-- Search alerts replace manual monitoring of chat-group messages.
create table public.search_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  keywords text,
  report_type public.report_type,
  category_id uuid references public.item_categories(id),
  location_id uuid references public.campus_locations(id),
  email_enabled boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    nullif(btrim(coalesce(keywords, '')), '') is not null
    or report_type is not null
    or category_id is not null
    or location_id is not null
  )
);

create index search_alerts_matching_idx
  on public.search_alerts(is_active, report_type, category_id, location_id)
  where is_active;

create unique index search_alerts_owner_conditions_unique
  on public.search_alerts (
    user_id,
    coalesce(lower(btrim(keywords)), ''),
    (report_type is null),
    coalesce(report_type, 'lost'::public.report_type),
    coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where is_active;

create trigger search_alerts_updated
before update on public.search_alerts
for each row execute function public.set_updated_at();

alter table public.search_alerts enable row level security;

create policy "users read own search alerts"
on public.search_alerts for select
using (user_id = auth.uid());

create policy "users create own search alerts"
on public.search_alerts for insert
with check (user_id = auth.uid());

create policy "users update own search alerts"
on public.search_alerts for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users delete own search alerts"
on public.search_alerts for delete
using (user_id = auth.uid());

create or replace function public.notify_matching_search_alerts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status not in ('active', 'possible_match_found') then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status = new.status then
      return new;
    end if;
  end if;

  insert into public.notifications (user_id, title, message, notification_type, related_entity_id)
  select
    a.user_id,
    case when new.report_type = 'found' then 'A matching found-item report was posted' else 'A matching lost-item report was posted' end,
    'A new ' || new.report_type::text || ' report matches your saved alert: ' || new.title || '. Review the public summary and submit a claim only if the details are relevant.',
    case when a.email_enabled then 'search_alert_email' else 'search_alert' end,
    new.id
  from public.search_alerts a
  where a.is_active
    and a.user_id <> new.user_id
    and (a.report_type is null or a.report_type = new.report_type)
    and (a.category_id is null or a.category_id = new.category_id)
    and (a.location_id is null or a.location_id = new.location_id)
    and (
      nullif(btrim(coalesce(a.keywords, '')), '') is null
      or to_tsvector('simple', concat_ws(' ', new.title, new.description, new.brand, new.model, new.primary_colour))
         @@ plainto_tsquery('simple', a.keywords)
    );

  return new;
end;
$$;

create trigger item_report_search_alert_notifications
after insert or update of status on public.item_reports
for each row execute function public.notify_matching_search_alerts();
