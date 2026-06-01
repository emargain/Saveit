## Known bugs to fix in Task 2 (data layer)
    - Onboarding profile (exercise type, frequency, motivation) is stored in a 
    global AsyncStorage blob (`@saveit_onboarding_profile`). New users on the 
    same device see the previous user's preferences. Fix: move to Supabase 
    table scoped by userId, fetch on sign-in.
    - Favorites likely have the same leak (`@saveit_favorites` is global).
    - Recent views likely have the same leak (`@saveit_views`).
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

## Known data-source bypasses to clean up

After Session 2c, these two screens still read from src/data/partners.ts (the hardcoded array) instead of useMarketplacePartners():
- app/(tabs)/profile.tsx — for favorites lookup
- app/(tabs)/coach.tsx — for coach context

Both should be migrated to the hook in a small cleanup session. Until then, those screens show stale SF mock data. Favorites still functionally works (clicking the heart still persists), but the displayed partner names there will be SF studios, not the Polanco seed data.

## Pricing algorithm (separate session)

Padel valley-vs-peak pricing exists in seed data (450 MXN before 5pm, 540 after) but the UI doesn't currently surface the discount. When we build the dynamic pricing algorithm specified in the strategic doc (Precio base × Factor horario × Factor ocupación × Factor anticipación), make sure the UI clearly shows:
- The discounted price vs the retail price
- Why a slot is discounted (valley hour, last-minute, etc.)

## Schema scaling concerns

- Slot times are generated in CDMX local timezone (Date.getHours() based). When expanding beyond one city, timezone needs to become a studio attribute and slot times need to be displayed in the user's local TZ.
- user_preferences.motivation is a text column but the onboarding wizard collects `reasons` as string[]. Currently dropped on sync. When this matters, add a `reasons text[]` column via migration and update profileToPrefs in onboarding-context.
