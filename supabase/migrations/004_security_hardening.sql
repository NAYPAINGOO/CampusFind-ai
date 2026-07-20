-- Restrict ownership claims to the owner of the lost report participating in the match.
drop policy if exists "claimant submit own claim" on public.ownership_claims;

create policy "lost reporter submits own claim"
on public.ownership_claims for insert
with check (
  claimant_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    join public.item_reports lost_report on lost_report.id = m.lost_report_id
    where m.id = match_id
      and lost_report.user_id = auth.uid()
      and lost_report.deleted_at is null
  )
);

-- Avoid leaking brand/model details for reports explicitly marked sensitive.
create or replace view public.public_item_reports
with (security_barrier = true) as
select
  r.id,
  r.report_type,
  r.title,
  c.name as category_name,
  case when r.contains_sensitive_information then null else r.brand end as brand,
  case when r.contains_sensitive_information then null else r.model end as model,
  r.primary_colour,
  r.secondary_colour,
  case when r.contains_sensitive_information then 'Sensitive item reported. Details are restricted.' else r.description end as public_description,
  r.incident_date,
  l.name as location_name,
  r.status,
  r.created_at
from public.item_reports r
join public.item_categories c on c.id = r.category_id
join public.campus_locations l on l.id = r.location_id
where r.deleted_at is null
  and r.status in ('active','possible_match_found','claim_submitted','under_review','awaiting_collection');

grant select on public.public_item_reports to anon, authenticated;
