-- Calorie tracking: food catalog, custom meals, and diary entries.
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');

create table public.food_items (
  id uuid default gen_random_uuid() primary key,
  created_by uuid references auth.users(id) on delete cascade not null,
  source text not null check (source in ('usda', 'off', 'custom')),
  external_id text,
  name text not null,
  brand text,
  calories_per_100g numeric(7,2) not null,
  protein_per_100g numeric(6,2) not null default 0,
  carbs_per_100g numeric(6,2) not null default 0,
  fat_per_100g numeric(6,2) not null default 0,
  default_portion_g numeric(7,2),
  default_portion_label text,
  created_at timestamptz not null default now()
);

create unique index food_items_created_by_source_external_id_idx
  on public.food_items (created_by, source, external_id)
  where external_id is not null;

alter table public.food_items enable row level security;

create policy "Users manage own food items"
  on public.food_items for all
  using (auth.uid() = created_by);

create table public.custom_meals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now()
);

create index custom_meals_user_id_idx on public.custom_meals (user_id);

alter table public.custom_meals enable row level security;

create policy "Users manage own custom meals"
  on public.custom_meals for all
  using (auth.uid() = user_id);

create table public.custom_meal_ingredients (
  id uuid default gen_random_uuid() primary key,
  custom_meal_id uuid references public.custom_meals(id) on delete cascade not null,
  food_item_id uuid references public.food_items(id) on delete restrict not null,
  quantity_g numeric(7,2) not null
);

create index custom_meal_ingredients_custom_meal_id_idx
  on public.custom_meal_ingredients (custom_meal_id);

alter table public.custom_meal_ingredients enable row level security;

create policy "Users manage ingredients through meal ownership"
  on public.custom_meal_ingredients for all
  using (
    exists (
      select 1 from public.custom_meals
      where custom_meals.id = custom_meal_ingredients.custom_meal_id
        and custom_meals.user_id = auth.uid()
    )
  );

create table public.food_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  food_item_id uuid references public.food_items(id) on delete restrict not null,
  custom_meal_id uuid references public.custom_meals(id) on delete set null,
  log_group_id uuid not null,
  meal_type meal_type not null,
  quantity_g numeric(7,2) not null,
  calories int not null,
  protein_g numeric(6,2) not null,
  carbs_g numeric(6,2) not null,
  fat_g numeric(6,2) not null,
  logged_date date not null,
  logged_at timestamptz not null default now()
);

create index food_logs_user_id_logged_date_idx on public.food_logs (user_id, logged_date);
create index food_logs_log_group_id_idx on public.food_logs (log_group_id);

alter table public.food_logs enable row level security;

create policy "Users manage own food logs"
  on public.food_logs for all
  using (auth.uid() = user_id);
