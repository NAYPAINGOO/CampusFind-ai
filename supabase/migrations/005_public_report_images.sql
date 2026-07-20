-- Allow a report owner to opt in to displaying the first uploaded image in public summaries.
-- Sensitive reports are always excluded even when consent is true.
alter table public.item_reports
  add column if not exists public_image_consent boolean not null default true;

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
  r.created_at,
  (
    r.public_image_consent
    and not r.contains_sensitive_information
    and exists (select 1 from public.report_images ri where ri.report_id = r.id)
  ) as public_image_enabled
from public.item_reports r
join public.item_categories c on c.id = r.category_id
join public.campus_locations l on l.id = r.location_id
where r.deleted_at is null
  and r.status in ('active','possible_match_found','claim_submitted','under_review','awaiting_collection');

grant select on public.public_item_reports to anon, authenticated;
