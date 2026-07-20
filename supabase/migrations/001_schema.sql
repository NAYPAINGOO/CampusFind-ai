-- CampusFind AI core schema for Supabase PostgreSQL
create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'security', 'admin');
create type public.account_status as enum ('active', 'suspended', 'disabled');
create type public.report_type as enum ('lost', 'found');
create type public.report_status as enum ('draft', 'active', 'possible_match_found', 'claim_submitted', 'under_review', 'awaiting_collection', 'returned', 'closed', 'rejected', 'archived');
create type public.match_status as enum ('recommended', 'reviewed', 'confirmed', 'dismissed');
create type public.claim_status as enum ('submitted', 'under_review', 'more_information', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key,
  full_name text not null check (char_length(full_name) between 2 and 120),
  university_email text not null unique,
  student_or_staff_id text unique,
  phone_number text,
  avatar_url text,
  role public.user_role not null default 'user',
  department text,
  account_status public.account_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.item_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campus_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  building text,
  floor text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name, building, floor)
);

create table public.item_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  report_type public.report_type not null,
  title text not null check (char_length(title) between 3 and 120),
  category_id uuid not null references public.item_categories(id),
  subcategory text,
  brand text,
  model text,
  primary_colour text not null,
  secondary_colour text,
  description text not null check (char_length(description) between 20 and 2000),
  unique_features text not null,
  incident_date date not null,
  approximate_time time,
  location_id uuid not null references public.campus_locations(id),
  specific_area text not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  status public.report_status not null default 'draft',
  contact_preference text not null default 'in_app' check (contact_preference in ('in_app', 'email')),
  contains_sensitive_information boolean not null default false,
  verification_question text not null,
  verification_answer_hash text not null,
  internal_storage_location text,
  privacy_consent_at timestamptz not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.report_images (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.item_reports(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  image_order smallint not null default 0 check (image_order between 0 and 4),
  image_embedding_reference text,
  mime_type text check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now(),
  unique(report_id, image_order)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  lost_report_id uuid not null references public.item_reports(id) on delete cascade,
  found_report_id uuid not null references public.item_reports(id) on delete cascade,
  overall_score numeric(5,2) not null check (overall_score between 0 and 100),
  image_score numeric(5,2) not null check (image_score between 0 and 100),
  text_score numeric(5,2) not null check (text_score between 0 and 100),
  category_score numeric(5,2) not null check (category_score between 0 and 100),
  colour_score numeric(5,2) not null check (colour_score between 0 and 100),
  brand_score numeric(5,2) not null check (brand_score between 0 and 100),
  location_score numeric(5,2) not null check (location_score between 0 and 100),
  date_score numeric(5,2) not null check (date_score between 0 and 100),
  match_explanation text not null,
  match_status public.match_status not null default 'recommended',
  reviewed_by uuid references public.profiles(id),
  administrator_feedback boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(lost_report_id, found_report_id),
  check (lost_report_id <> found_report_id)
);

create table public.ownership_claims (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id),
  ownership_explanation text not null,
  identifying_features text not null,
  evidence_url text,
  verification_answer_hash text not null,
  status public.claim_status not null default 'submitted',
  staff_notes text,
  reviewed_by uuid references public.profiles(id),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(match_id, claimant_id)
);

create table public.handover_records (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.ownership_claims(id) on delete cascade,
  verification_code_hash text not null,
  qr_token_hash text not null,
  collection_location text not null,
  collection_instructions text,
  collection_deadline timestamptz not null,
  collected_at timestamptz,
  verified_by uuid references public.profiles(id),
  receiver_signature_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  notification_type text not null,
  related_entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.report_abuse (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.item_reports(id) on delete cascade,
  reported_by uuid not null references public.profiles(id),
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewed','dismissed','actioned')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(report_id, reported_by)
);

create index item_reports_user_idx on public.item_reports(user_id, created_at desc) where deleted_at is null;
create index item_reports_search_idx on public.item_reports using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(primary_colour,'')));
create index item_reports_matching_idx on public.item_reports(report_type, status, category_id, incident_date) where deleted_at is null;
create index item_reports_location_idx on public.item_reports(location_id, incident_date desc) where deleted_at is null;
create index matches_lost_idx on public.matches(lost_report_id, overall_score desc);
create index matches_found_idx on public.matches(found_report_id, overall_score desc);
create index claims_status_idx on public.ownership_claims(status, submitted_at);
create index notifications_user_idx on public.notifications(user_id, is_read, created_at desc);
create index audit_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_updated before update on public.item_categories for each row execute function public.set_updated_at();
create trigger locations_updated before update on public.campus_locations for each row execute function public.set_updated_at();
create trigger reports_updated before update on public.item_reports for each row execute function public.set_updated_at();
create trigger matches_updated before update on public.matches for each row execute function public.set_updated_at();
create trigger claims_updated before update on public.ownership_claims for each row execute function public.set_updated_at();
create trigger handovers_updated before update on public.handover_records for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, university_email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.current_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and account_status = 'active' and deleted_at is null;
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() in ('security','admin'), false);
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

create or replace view public.public_item_reports
with (security_barrier = true) as
select
  r.id, r.report_type, r.title, c.name as category_name, r.brand, r.model,
  r.primary_colour, r.secondary_colour,
  case when r.contains_sensitive_information then 'Sensitive item reported. Details are restricted.' else r.description end as public_description,
  r.incident_date, l.name as location_name, r.status, r.created_at
from public.item_reports r
join public.item_categories c on c.id = r.category_id
join public.campus_locations l on l.id = r.location_id
where r.deleted_at is null and r.status in ('active','possible_match_found','claim_submitted','under_review','awaiting_collection');


revoke all on public.item_reports from anon;
revoke all on public.report_images from anon;
revoke all on public.matches from anon;
revoke all on public.ownership_claims from anon;
revoke all on public.handover_records from anon;
grant select on public.public_item_reports to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.item_categories enable row level security;
alter table public.campus_locations enable row level security;
alter table public.item_reports enable row level security;
alter table public.report_images enable row level security;
alter table public.matches enable row level security;
alter table public.ownership_claims enable row level security;
alter table public.handover_records enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;
alter table public.report_abuse enable row level security;

create policy "profiles read own or staff" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "profiles update own or admin" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "categories public read" on public.item_categories for select using (is_active or public.is_staff());
create policy "categories admin write" on public.item_categories for all using (public.is_admin()) with check (public.is_admin());
create policy "locations public read" on public.campus_locations for select using (is_active or public.is_staff());
create policy "locations admin write" on public.campus_locations for all using (public.is_admin()) with check (public.is_admin());

create policy "owners or staff read reports" on public.item_reports for select using (
  deleted_at is null and (user_id = auth.uid() or public.is_staff())
);
create policy "users create own reports" on public.item_reports for insert with check (user_id = auth.uid() and public.current_role() = 'user');
create policy "owners update mutable reports" on public.item_reports for update using (
  user_id = auth.uid() and status in ('draft','active','possible_match_found')
) with check (user_id = auth.uid());
create policy "staff manage reports" on public.item_reports for all using (public.is_staff()) with check (public.is_staff());

create policy "report image read by report access" on public.report_images for select using (
  exists(select 1 from public.item_reports r where r.id = report_id and (r.user_id = auth.uid() or public.is_staff() or r.status in ('active','possible_match_found','claim_submitted','under_review','awaiting_collection')))
);
create policy "owners add report images" on public.report_images for insert with check (
  exists(select 1 from public.item_reports r where r.id = report_id and r.user_id = auth.uid() and r.status in ('draft','active'))
);
create policy "owners or staff remove images" on public.report_images for delete using (
  public.is_staff() or exists(select 1 from public.item_reports r where r.id = report_id and r.user_id = auth.uid() and r.status in ('draft','active'))
);

create policy "match participants or staff read" on public.matches for select using (
  public.is_staff() or exists(
    select 1 from public.item_reports r
    where r.id in (lost_report_id, found_report_id) and r.user_id = auth.uid()
  )
);
create policy "admin or backend manage matches" on public.matches for all using (public.is_admin()) with check (public.is_admin());

create policy "claimant or staff read claims" on public.ownership_claims for select using (claimant_id = auth.uid() or public.is_staff());
create policy "claimant submit own claim" on public.ownership_claims for insert with check (claimant_id = auth.uid());
create policy "staff update claims" on public.ownership_claims for update using (public.is_staff()) with check (public.is_staff());

create policy "claimant or staff read handover" on public.handover_records for select using (
  public.is_staff() or exists(select 1 from public.ownership_claims c where c.id = claim_id and c.claimant_id = auth.uid() and c.status = 'approved')
);
create policy "staff manage handover" on public.handover_records for all using (public.is_staff()) with check (public.is_staff());

create policy "users read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "users mark own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "staff create notifications" on public.notifications for insert with check (public.is_staff());

create policy "admin reads audit logs" on public.audit_logs for select using (public.is_admin());
create policy "admin manages settings" on public.system_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "authenticated reads public settings" on public.system_settings for select using (auth.uid() is not null and setting_key like 'public.%');
create policy "users report abuse" on public.report_abuse for insert with check (reported_by = auth.uid());
create policy "staff manage abuse reports" on public.report_abuse for all using (public.is_staff()) with check (public.is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-images', 'report-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "users upload to own report folder" on storage.objects for insert to authenticated
with check (bucket_id = 'report-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users read own images or staff" on storage.objects for select to authenticated
using (bucket_id = 'report-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
create policy "users delete own images or staff" on storage.objects for delete to authenticated
using (bucket_id = 'report-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));

insert into public.system_settings(setting_key, setting_value)
values
  ('matching.weights', '{"image":30,"text":25,"category":10,"colour":10,"brand":10,"location":8,"date":7}'::jsonb),
  ('matching.notification_threshold', '70'::jsonb),
  ('public.support_email', '"security@example.edu"'::jsonb)
on conflict (setting_key) do nothing;
