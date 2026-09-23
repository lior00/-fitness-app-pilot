# Dev notes

Working notes for whoever picks this up next (written for a Claude Code session to
read cold — file paths included so it doesn't have to rediscover the codebase).

## State of the app

Working: signup/login/logout, onboarding (body metrics → TDEE/target calories),
dashboard, calorie tracking (search USDA/Israeli-MoH/Open Food Facts, log single
foods or custom meals, day view, month calendar), settings (food region + units).
Not built: workouts (`/workouts` is a stub), no tests, no CI.

## Known issues / risks

- **Open Food Facts is flaky.** Their legacy `cgi/search.pl` endpoint
  ([src/lib/food-sources/off.ts](src/lib/food-sources/off.ts)) returns intermittent
  503s. We already catch and degrade gracefully (just fewer results), but if OFF
  results feel sparse, this is why — not a bug to chase, it's their server. A retry
  with backoff would help but wasn't worth it for a pilot.
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
  the dashboard and the default `/meals` view, is server/UTC-based. Right around
  midnight in the user's timezone these can disagree by a day. Documented as a
  known pilot-scope simplification, not accidental — see the plan discussion this
  came from if you want the full reasoning.
- **Supabase's transactional email rate limit is low on the free tier.** We hit
  it multiple times during testing (~3-4 signup emails/hour). If testing signup
  flows, expect this; either wait it out or add a custom SMTP provider in Supabase
  Auth settings.
- **No duplicate-ingredient guard in custom meals.** Nothing stops adding the same
  food twice to one meal (`src/app/meals/new/new-meal-form.tsx`) — it'll just
  create two rows instead of merging quantities. Harmless (totals are still
  correct) but a little odd in the ingredient list UI.
- **Custom meals aren't editable after creation.** You can log servings of a
  saved meal but can't rename it or change its ingredients — only delete
  individual logged instances. Would need an edit page.
- **No confirmation on delete.** The "Delete" button on a logged entry
  ([src/app/meals/page.tsx](src/app/meals/page.tsx)) fires immediately, no
  "are you sure." Low risk (nothing else depends on food logs), but worth a
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
  nav arrows in [src/app/meals/page.tsx](src/app/meals/page.tsx) would need to
  mirror, for one).
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
- No "recently logged" or favorites shortcut for quick re-logging common foods —
  every log requires a fresh search even for things logged yesterday.
- Password reset / "forgot password" flow doesn't exist — only signup/login.
- No tests of any kind (unit, integration, e2e) and no CI pipeline. Given the
  amount of business logic in [src/lib/tdee.ts](src/lib/tdee.ts) and
  [src/app/meals/actions.ts](src/app/meals/actions.ts) (calorie/macro math,
  snapshot-at-log-time logic), unit tests there would be the highest-value first
  addition.
- `git log` has a few "trigger redeploy" empty commits from Vercel env var
  changes — harmless, just noise if you're reading history.
