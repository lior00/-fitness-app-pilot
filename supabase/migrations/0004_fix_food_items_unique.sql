-- Supabase's upsert(onConflict:) needs a plain unique constraint to target;
-- a partial index (used previously) isn't inferrable by an ON CONFLICT column
-- list. A plain constraint works identically here since Postgres already
-- treats NULL external_id values as distinct, so custom (non-external) foods
-- never collide with each other anyway.
drop index if exists public.food_items_created_by_source_external_id_idx;

alter table public.food_items
  add constraint food_items_created_by_source_external_id_key
  unique (created_by, source, external_id);
