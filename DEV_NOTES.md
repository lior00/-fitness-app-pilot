# Dev notes

Working notes for whoever picks this up next (written for a Claude Code session to
read cold — file paths included so it doesn't have to rediscover the codebase).

## State of the app

Working: signup/login/logout, onboarding (region + body metrics → TDEE/target
calories), dashboard (calendar + selected-day summary + entries, all one page),
calorie tracking (search USDA/Israeli-MoH/Open Food Facts, log single foods or
custom meals with per-ingredient weights, recent-foods quick-add), settings
(food region + units). Not built: workouts (`/workouts` is a stub), no tests,
no CI.

## Known issues / risks

- **Open Food Facts: switched to their modern search API, lost portion data.**
  [src/lib/food-sources/off.ts](src/lib/food-sources/off.ts) now calls
  `search.openfoodfacts.org` (Elasticsearch-backed "Search-a-licious") instead
  of the legacy `cgi/search.pl` endpoint — confirmed by direct testing that the
  legacy one missed real products the new one finds cleanly, with much better
  relevance too. Tradeoff, also confirmed by testing: this index doesn't carry
  `serving_size`/`serving_quantity` at all, so OFF results no longer get a
  suggested portion the way USDA branded items do (quantity field just starts
  empty). If this matters later, one option: only fetch portion data lazily
  when a user actually selects an OFF result (a follow-up product lookup via
  `/api/v2/product/{barcode}.json`), rather than for every search result.
- **Our own relevance scoring, not just source order.**
  [src/lib/food-sources/relevance.ts](src/lib/food-sources/relevance.ts) scores
  every result (all sources combined) by word-match against the query before
  slicing to 25 — added because USDA's own relevance let genuinely unrelated
  items (e.g. "Ruffed Grouse, breast meat" for a "chicken breast" search) rank
  in the top few. Simple word/substring scoring, nothing fancy; revisit if a
  future search source needs different treatment.
- **USDA Branded data can be wrong at the source — confirmed, not hypothetical.**
  USDA's search API always reports Branded-food nutrients as a per-serving
  figure that we scale to per-100g using their `servingSize` field
  ([src/lib/food-sources/usda.ts](src/lib/food-sources/usda.ts)). Found a real
  case: "YUCATAN GUACAMOLE" (fdcId 1853463) reports "167 kcal per 30g serving"
  → we correctly compute 556.67 kcal/100g from that, but the true value (cross-
  checked against 9 Open Food Facts entries for the same product line, all
  133-175 kcal/100g, and the actual product label) is ~167 kcal/100g — USDA's
  `servingSize` field is wrong for this record, not our math. Since we can't
  algorithmically know *which* entries are wrong, we surface the risk instead:
  every serving-converted result carries `isServingConverted: true` on
  `NormalizedFood`, which (a) nudges it slightly below equally-relevant
  alternatives in [relevance.ts](src/lib/food-sources/relevance.ts), and (b)
  shows a visible "calculated from a serving size" note in search results and
  right before logging ([src/components/food-search.tsx](src/components/food-search.tsx)'s
  `ServingConversionNote`, used in the log-food preview and
  [src/components/ingredient-editor.tsx](src/components/ingredient-editor.tsx)).
  This is a mitigation, not a fix — a determined bad USDA entry can still rank
  first and get logged. The "Can't find it? Add manually" fallback is the real
  escape hatch when a value looks wrong.
- **Israeli MoH data source has no SLA.** [src/lib/food-sources/israel.ts](src/lib/food-sources/israel.ts)
  hits data.gov.il's CKAN `datastore_search` API live, resource id hardcoded
  (`c3cb0630-0650-46c1-a068-82d575c094b2`). This is a government open-data portal,
  not a stable commercial API — the resource could be renamed/moved without notice.
  Worth an occasional smoke test. The raw CSV download (mentioned in earlier
  conversation) is now gated behind Google sign-in, so re-scraping isn't a quick
  fallback if the API disappears — would need to find wherever they relocated it.
- **Israeli source has no portion/serving data.** Unlike USDA/OFF,
  `searchIsrael` never sets `defaultPortionG`, so the quantity field always starts
  empty for IL results (no "suggested portion" shortcut). The MoH dataset does
  publish a units-of-measure table (`moh_yehidot_mida_lemitzrachim`) that could be
  joined in for this, not done yet.
- **"Today" is UTC-based for reads, local for writes.** `logged_date` (what
  actually gets stored — [src/app/meals/actions.ts](src/app/meals/actions.ts)) is
  the client's local calendar date, correct by design. But `todayIso()`
  ([src/lib/date.ts](src/lib/date.ts)), used to decide what counts as "today" on
  the dashboard (the default `/dashboard` view with no `?date=`), is
  server/UTC-based. Right around midnight in the user's timezone these can
  disagree by a day. Documented as a known pilot-scope simplification, not
  accidental — see the plan discussion this came from if you want the full
  reasoning.
- **Supabase's transactional email rate limit is low on the free tier.** We hit
  it multiple times during testing (~3-4 signup emails/hour). If testing signup
  flows, expect this; either wait it out or add a custom SMTP provider in Supabase
  Auth settings.
- **No duplicate-ingredient guard in custom meals.** Nothing stops adding the same
  food twice to one meal (`src/app/meals/new/new-meal-form.tsx`) — it'll just
  create two rows instead of merging quantities. Harmless (totals are still
  correct) but a little odd in the ingredient list UI.
- **Custom meal templates aren't editable after creation.** Logging a saved
  meal now prompts per-ingredient weights each time (so day-to-day variation
  doesn't require editing the template), but you still can't rename a template
  or permanently add/remove an ingredient from it — only delete individual
  logged instances. Would need an edit page for the template itself.
- **No confirmation on delete.** The "Delete" button on a logged entry
  ([src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)) fires immediately,
  no "are you sure." Low risk (nothing else depends on food logs), but worth a
  confirm dialog if this becomes a real product.
- **No macro targets, only a calorie target.** Onboarding never asked for a
  macro split, so the day view shows protein/carb/fat totals with nothing to
  compare them against. Intentional (didn't want to fabricate targets nobody
  asked for) but worth deciding on purpose if this grows.

## Hebrew / RTL support (currently partial)

Right now: Hebrew *data* displays fine (Israeli food names render correctly
inline since browsers handle bidi text automatically), but the **app itself is
English-only and LTR-only**. Nothing about the UI adapts when someone is working
primarily with Hebrew data. Getting to real Hebrew support would mean:

- A `dir="rtl"` mode — currently nothing in [src/app/layout.tsx](src/app/layout.tsx)
  or any page sets this; the whole layout (nav, forms, cards) is built assuming LTR
  and would need review, not just a blanket `dir` flip (icons like the ‹ › date
  nav arrows in [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx) would
  need to mirror, for one).
- UI string translation — every label, button, and error message in the app is
  hardcoded English (no i18n library, no string extraction). Would need something
  like `next-intl` and a real translation pass, not just Google-Translate-and-go
  given this is health/nutrition data where mistranslation matters.
- Mixed-language search results — when food_region is 'il', results are already
  Hebrew name + English translation together; when it's 'us' but a user still
  searches Hebrew terms, results will be empty (USDA/OFF are English-indexed).
  Worth deciding whether region should also gate/hint the search input language.
- Number/date formatting — currently uses `en-US` locale explicitly in
  [src/lib/date.ts](src/lib/date.ts) (`formatDisplayDate`, `formatMonthLabel`).
  Would need `he-IL` alternatives switched on the same settings preference used
  for food region/units.

This is a real chunk of work, not a toggle — flagging it as a distinct project
phase rather than a quick add.

## Researched ideas (not built, worth knowing about)

Looked at MyFitnessPal, Cronometer, MacroFactor, and Lose It for feature ideas.
Two are worth calling out specifically:

- **Adaptive TDEE (MacroFactor-style).** The single most-cited differentiator in
  the research. Instead of computing `target_calories` once at onboarding from a
  static formula ([src/lib/tdee.ts](src/lib/tdee.ts) — already averages three
  formulas, which is more than most competitors do), MacroFactor recalculates
  weekly by comparing actual logged weight trend against actual logged intake:
  if someone's maintaining weight at 2,200 kcal/day, their real TDEE is ~2,200,
  regardless of what the formula predicted. This needs a `weight_logs` table
  (mentioned in the original schema review, never built) plus a trend-smoothing
  algorithm and a minimum-data threshold before adjusting (2-4 weeks, per their
  public docs) — a real project, not a quick add. Worth doing eventually since
  static formulas can be off 15-25% for a given individual.
- **Barcode scanning.** Open Food Facts has a dedicated barcode-lookup endpoint
  (`GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json`) that's
  separate from the text-search endpoint we use today
  ([src/lib/food-sources/off.ts](src/lib/food-sources/off.ts)). A camera-based
  scanner (`@zxing/browser` is the standard pure-JS option, no native deps)
  feeding into that endpoint would remove search friction entirely for packaged
  foods. Deliberately scoped out of the current pass to keep focus on making
  core logging solid first; the endpoint and general approach are confirmed to
  exist, just not implemented.

Mentioned in the research but further out / lower priority: AI photo food
recognition (meal-photo → estimated macros), voice logging, wearable/fitness-
tracker sync.

## Polish backlog (smaller, lower-risk items)

- Loading/error states are minimal throughout — most forms just show plain text
  errors, no toasts, no skeleton loading states.
- No pagination on food search (hard-capped at 25 combined results in
  [src/app/api/foods/search/route.ts](src/app/api/foods/search/route.ts)) — fine
  for a pilot, would matter at scale.
- No accessibility pass done (focus states, aria labels beyond what Shadcn/base-ui
  give for free out of the box).
- No responsive/mobile layout testing beyond the default Tailwind stacking — forms
  are all single-column `max-w-md` so probably fine, but not verified on real
  small screens.
- Recent-foods quick-add ([src/lib/recent-foods.ts](src/lib/recent-foods.ts)) is
  usage-based only (most-recently-logged, deduped) — no explicit star/favorite
  system. Fine for now; would be a small addition (a `favorited` flag on
  `food_items` + a toggle) if usage-based recency turns out not to be enough.
- Password reset / "forgot password" flow doesn't exist — only signup/login.
- No tests of any kind (unit, integration, e2e) and no CI pipeline. Given the
  amount of business logic in [src/lib/tdee.ts](src/lib/tdee.ts) and
  [src/app/meals/actions.ts](src/app/meals/actions.ts) (calorie/macro math,
  snapshot-at-log-time logic), unit tests there would be the highest-value first
  addition.
- `git log` has a few "trigger redeploy" empty commits from Vercel env var
  changes — harmless, just noise if you're reading history.
