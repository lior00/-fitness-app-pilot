-- Allow 'il' (Israeli MoH database) as a food_items source.
alter table public.food_items drop constraint food_items_source_check;

alter table public.food_items
  add constraint food_items_source_check
  check (source in ('usda', 'off', 'il', 'custom'));
