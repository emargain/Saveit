## Known bugs to fix in Task 2 (data layer)
    - Onboarding profile (exercise type, frequency, motivation) is stored in a 
    global AsyncStorage blob (`@saveit_onboarding_profile`). New users on the 
    same device see the previous user's preferences. Fix: move to Supabase 
    table scoped by userId, fetch on sign-in.
    - ~~Favorites (`@saveit_favorites`) and recent views (`@saveit_views`)~~ — fixed in Sessions 2e/2f. Both now Supabase-scoped per user; AsyncStorage strangler removed.
    - Bookings written via `createCustomerBooking` are local-only and global; 
    need to be scoped by userId and persisted to Supabase.


## Pre-piloto email setup (from earlier decision)
    - Switch from Supabase default sender to Resend with corporate domain
    - Branded confirmation landing page
    - Eventually: deep linking back into app from confirmation email

## Schema gaps to fix
    - user_preferences.motivation is text but the wizard collects `reasons` as 
    string[]. Currently dropped on sync. Need a migration adding `reasons 
     text[]` to user_preferences, then update profileToPrefs() in 
     onboarding-context.tsx.

## Coach polish (post-MVP, when LLM integration lands)
    - Coach currently responds in English regardless of app language setting
    - All hardcoded responses in src/coach/responses.ts need locale handling
    - When swapping to OpenAI/Anthropic, pass user's locale into system prompt
    - Move buildWorkoutPlan and other deterministic responses to localized strings
    OR have the LLM regenerate them per-locale

## UX polish session (post-Session 2d, before piloto)

### Navigation IA
- Discover tab is hidden from the bottom tab bar (href: null) but Home links to it via category pills. Decide: surface Discover, or merge with Browse, or expose filters from Browse directly. The current state means users can only reach Discover by tapping a Home category, which isn't intuitive.
- The filter button currently lives on Browse but feels more useful from Discover (where the list of studios is). Consider a header filter icon on Discover.
- Browse tab's list mode permanently shows an empty-state illustration; map works but list doesn't. Either implement the list view or remove the toggle.

### Keyboard and dismiss patterns
- Keyboard dismiss is inconsistent: Coach lets you tap anywhere; Map requires the back button. Pick one global pattern (recommendation: tap-outside-input dismisses on all screens, possibly via a shared KeyboardAvoidingView wrapper) and apply everywhere.

### Partner Detail slot display
- The slot list shows every available time as a flat list across multiple days. Overwhelming for the user. Group by day, highlight today, or add a date picker. Make sure padel valley/peak pricing differences are surfaced visually.

### Distance
- mapStudioRowToPartner currently hardcodes distanceKm to 1 for every studio. Wire useLocation to compute real distances against studio coordinates.

### Guest / unsigned users
- Guest user favorites are in-session only — no AsyncStorage persistence after the strangler removal. If we want guest hearts to survive app close, add a guest-state local store separate from Supabase. Low priority for piloto since real users sign in.

## Pricing algorithm (separate session)

Padel valley-vs-peak pricing exists in seed data (450 MXN before 5pm, 540 after) but the UI doesn't currently surface the discount. When we build the dynamic pricing algorithm specified in the strategic doc (Precio base × Factor horario × Factor ocupación × Factor anticipación), make sure the UI clearly shows:
- The discounted price vs the retail price
- Why a slot is discounted (valley hour, last-minute, etc.)

## Session 3b followups

- Booking captures static `slots.price_mxn`, not the displayed dynamic price. Session 3b-followup will pass the displayed price to the RPC and have the server verify within tolerance.
- Batch RPC for `calculate_slot_price` to avoid N+1 (~25 concurrent calls per studio fetch at piloto scale).

## Categories (Session categories strangler)

- Save migration 011 (`categories` table) into `supabase/migrations/` — applied live and types regenerated, but the SQL file is missing from the repo (same applied-but-not-saved pattern as 2a/2e).
- After verifying Home/Discover tiles against Supabase, delete hardcoded FALLBACK_CATEGORIES in `app/(tabs)/index.tsx` and FALLBACK_DISCOVER_CATEGORY_IDS in `app/(tabs)/discover.tsx`.
- `categories.display_name` is Spanish-only. Add `display_name_es` / `display_name_en` (or a locale map) when bilingual category labels are needed; tracked also in categories-service.ts.
- Seed studios still store legacy/payload category strings; once all use public.categories slugs, drop yoga→yoga_flex and boxing→boxeo aliases in studio-service.toPartnerCategory.

## Schema scaling concerns

- Slot times are generated in CDMX local timezone (Date.getHours() based). When expanding beyond one city, timezone needs to become a studio attribute and slot times need to be displayed in the user's local TZ.
- user_preferences.motivation is a text column but the onboarding wizard collects `reasons` as string[]. Currently dropped on sync. When this matters, add a `reasons text[]` column via migration and update profileToPrefs in onboarding-context.

## Pre-piloto: replace dev slot seeding
- Dev seed currently generates 7 days of slots starting from "now"; they expire 
  a week later, breaking dev testing if not re-run
- Real partners will manage their own slots via partner-side wizard (post-MVP) 
  or via SQL during piloto onboarding
- Decide before piloto: keep manual re-seeding, automate via pg_cron, or 
  build partner slot managementr