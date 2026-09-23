-- Preferred food-data region: which primary source /api/foods/search queries
-- alongside Open Food Facts. 'us' = USDA FoodData Central, 'il' = Israeli
-- Ministry of Health nutrition database.
alter table public.profiles
  add column food_region text not null default 'us' check (food_region in ('us', 'il'));
