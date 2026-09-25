-- User-controlled calorie surplus/deficit (replaces the fixed -500/0/+300
-- per-goal deltas previously baked into target_calories at onboarding time).
alter table public.profiles
  add column calorie_adjustment int not null default 0;
