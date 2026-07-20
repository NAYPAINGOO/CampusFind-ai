-- Non-authenticated demonstration records for local analytics and UI testing.
-- Real login accounts should be created through Supabase Auth so the profile trigger runs.

insert into public.item_categories(name, description, icon) values
('Student ID card','University identity and access cards','id-card'),
('Wallet','Wallets, purses and card holders','wallet'),
('Mobile phone','Smartphones and feature phones','smartphone'),
('Laptop','Laptop computers and sleeves','laptop'),
('Tablet','Tablets and e-readers','tablet'),
('Backpack','Backpacks and laptop bags','backpack'),
('Keys','Keys, keyrings and access fobs','key-round'),
('Earphones','Earbuds, headphones and charging cases','headphones'),
('Watch','Watches and fitness trackers','watch'),
('Water bottle','Reusable bottles and flasks','bottle'),
('Clothing','Jackets, scarves and other clothing','shirt'),
('Documents','Printed documents, notebooks and passports','files'),
('Other','Items not covered by another category','package')
on conflict (name) do nothing;

insert into public.campus_locations(name, building, floor, latitude, longitude) values
('Main Library','Library','All',6.116120,100.367410),
('Student Centre','Student Centre','Ground',6.116380,100.367810),
('Engineering Block','Academic Complex','All',6.116810,100.368240),
('Science Laboratory','Academic Complex','Level 2',6.116960,100.368430),
('Cafeteria','Student Centre','Ground',6.116270,100.367690),
('Sports Complex','Sports Complex','Ground',6.115540,100.368220),
('Convocation Hall','Main Hall','Ground',6.116030,100.366940),
('Administration Building','Administration','All',6.116660,100.367110),
('Hostel A','Residential','All',6.114980,100.367420),
('Hostel B','Residential','All',6.114710,100.367930),
('Prayer Room','Library','Ground',6.116090,100.367470),
('Bus Stop','Main Entrance','Outdoor',6.117420,100.366770),
('Innovation Lab','Academic Complex','Level 1',6.116730,100.368120),
('Lecture Hall 1','Academic Complex','Ground',6.116570,100.368010),
('Campus Clinic','Student Centre','Level 1',6.116450,100.367760)
on conflict (name, building, floor) do nothing;

-- 20 users, 6 security staff and 2 administrators.
insert into public.profiles(id, full_name, university_email, student_or_staff_id, role, department)
select gen_random_uuid(), 'Demo Student ' || n, 'student' || n || '@example.edu', 'STU-' || lpad(n::text,4,'0'), 'user'::public.user_role,
case when n % 3 = 0 then 'Engineering' when n % 3 = 1 then 'Computer Science' else 'Business' end
from generate_series(1,20) n
on conflict (university_email) do nothing;

insert into public.profiles(id, full_name, university_email, student_or_staff_id, role, department)
select gen_random_uuid(), 'Security Officer ' || n, 'security' || n || '@example.edu', 'SEC-' || lpad(n::text,3,'0'), 'security'::public.user_role, 'Campus Security'
from generate_series(1,6) n
on conflict (university_email) do nothing;

insert into public.profiles(id, full_name, university_email, student_or_staff_id, role, department)
select gen_random_uuid(), 'System Administrator ' || n, 'admin' || n || '@example.edu', 'ADM-' || lpad(n::text,3,'0'), 'admin'::public.user_role, 'Information Technology'
from generate_series(1,2) n
on conflict (university_email) do nothing;

-- 40 lost and 40 found reports with realistic categories and campus locations.
with demo_users as (
  select id, row_number() over(order by university_email) rn from public.profiles where role='user' order by university_email limit 20
), cats as (
  select id, name, row_number() over(order by name) rn from public.item_categories
), locs as (
  select id, name, row_number() over(order by name) rn from public.campus_locations
), generated as (
  select n, case when n <= 40 then 'lost'::public.report_type else 'found'::public.report_type end report_type,
         ((n-1)%20)+1 user_rn, ((n-1)%13)+1 cat_rn, ((n-1)%15)+1 loc_rn
  from generate_series(1,80) n
)
insert into public.item_reports(
  user_id, report_type, title, category_id, brand, primary_colour, description, unique_features,
  incident_date, approximate_time, location_id, specific_area, status, contact_preference,
  contains_sensitive_information, verification_question, verification_answer_hash, privacy_consent_at
)
select u.id, g.report_type,
  case c.name
    when 'Backpack' then case when g.report_type='lost' then 'Black laptop backpack' else 'Found dark laptop bag' end
    when 'Mobile phone' then case when g.report_type='lost' then 'Lost smartphone with clear case' else 'Found smartphone in protective case' end
    when 'Student ID card' then case when g.report_type='lost' then 'Missing student ID holder' else 'Found university card holder' end
    when 'Earphones' then case when g.report_type='lost' then 'Missing wireless earbuds' else 'Found wireless earbuds case' end
    else initcap(g.report_type::text) || ' ' || lower(c.name)
  end,
  c.id,
  case when g.n % 4 = 0 then 'Lenovo' when g.n % 4 = 1 then 'Samsung' when g.n % 4 = 2 then 'Apple' else null end,
  case when g.n % 5 = 0 then 'Black' when g.n % 5 = 1 then 'Blue' when g.n % 5 = 2 then 'Silver' when g.n % 5 = 3 then 'Red' else 'White' end,
  'Realistic demonstration report describing an item, its visible condition and approximate campus context without publishing ownership-only evidence.',
  'Private identifying mark recorded for authorised verification only.',
  current_date - ((g.n % 30) || ' days')::interval,
  make_time(8 + (g.n % 10), (g.n * 7) % 60, 0),
  l.id,
  'Approximate public area near ' || l.name,
  case when g.n % 8 = 0 then 'possible_match_found'::public.report_status else 'active'::public.report_status end,
  case when g.n % 3 = 0 then 'email' else 'in_app' end,
  c.name in ('Student ID card','Wallet','Documents'),
  'What private detail proves ownership?',
  encode(digest('demo-answer-' || g.n, 'sha256'), 'hex'),
  now()
from generated g
join demo_users u on u.rn=g.user_rn
join cats c on c.rn=g.cat_rn
join locs l on l.rn=g.loc_rn;

-- 30 generated match recommendations.
with lost as (select id, row_number() over(order by created_at,id) rn from public.item_reports where report_type='lost' limit 30),
found as (select id, row_number() over(order by created_at,id) rn from public.item_reports where report_type='found' limit 30)
insert into public.matches(lost_report_id, found_report_id, overall_score, image_score, text_score, category_score, colour_score, brand_score, location_score, date_score, match_explanation)
select l.id, f.id, 55 + (l.rn % 40), 50 + (l.rn % 45), 55 + (l.rn % 40), 70 + (l.rn % 30), 60 + (l.rn % 35), 45 + (l.rn % 50), 50 + (l.rn % 45), 65 + (l.rn % 30),
'AI-generated demonstration recommendation based on multiple weighted attributes. Human verification is required.'
from lost l join found f on f.rn=l.rn;

-- 15 ownership claims.
with claimants as (select id, row_number() over(order by university_email) rn from public.profiles where role='user' limit 15),
matched as (select id, row_number() over(order by created_at,id) rn from public.matches limit 15)
insert into public.ownership_claims(match_id, claimant_id, ownership_explanation, identifying_features, verification_answer_hash, status, staff_notes)
select m.id, c.id,
'I am the owner and can provide purchase history, account details and a clear explanation of when the item was lost.',
'A hidden serial suffix, internal mark or content detail not visible in the public report.',
encode(digest('claim-answer-' || c.rn, 'sha256'), 'hex'),
case when c.rn <= 10 then 'approved'::public.claim_status else 'under_review'::public.claim_status end,
case when c.rn <= 10 then 'Evidence checked for demonstration seed.' else null end
from claimants c join matched m on m.rn=c.rn;

-- 10 completed handovers.
with approved as (select id, claimant_id, row_number() over(order by submitted_at,id) rn from public.ownership_claims where status='approved' limit 10),
staff as (select id from public.profiles where role='security' order by university_email limit 1)
insert into public.handover_records(claim_id, verification_code_hash, qr_token_hash, collection_location, collection_instructions, collection_deadline, collected_at, verified_by, notes)
select a.id, encode(digest('CF-DEMO-'||a.rn,'sha256'),'hex'), encode(digest('qr-demo-'||a.rn,'sha256'),'hex'),
'Campus Security Office', 'Bring university ID and present the one-time credential.', now() + interval '2 days', now() - interval '1 day', s.id, 'Demonstration handover completed.'
from approved a cross join staff s;

-- 30 notifications.
with recipients as (select id, row_number() over(order by university_email) rn from public.profiles where role='user' limit 20)
insert into public.notifications(user_id,title,message,notification_type,is_read)
select r.id,
case when n % 3 = 0 then 'Possible match found' when n % 3 = 1 then 'Claim status updated' else 'Collection reminder' end,
case when n % 3 = 0 then 'A new AI recommendation is available. Review the explanation before claiming.' when n % 3 = 1 then 'Campus security updated the status of your ownership claim.' else 'An approved collection credential is approaching its deadline.' end,
case when n % 3 = 0 then 'match' when n % 3 = 1 then 'claim' else 'handover' end,
n % 4 = 0
from generate_series(1,30) n join recipients r on r.rn=((n-1)%20)+1;
