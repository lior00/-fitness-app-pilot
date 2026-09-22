-- Onboarding: body metrics, activity level, goal, and computed TDEE/target calories.
create type public.user_gender as enum ('male', 'female');

create type public.activity_level as enum (
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extra_active'
);

create type public.goal_type as enum ('cut', 'maintain', 'bulk');

alter table public.profiles
  add column gender user_gender,
  add column age smallint,
  add column height_cm numeric(5,2),
  add column weight_kg numeric(5,2),
  add column unit_preference text check (unit_preference in ('metric', 'imperial')),
  add column activity_level activity_level,
  add column goal goal_type,
  add column tdee_calories int,
  add column target_calories int,
  add column onboarding_completed_at timestamptz;
