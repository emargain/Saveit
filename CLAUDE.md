# SaveIt — Project Context

## What this is

Solo founder building a mobile marketplace for fitness boutique studios and pádel clubs in CDMX. The model is idle-time monetization — helping studios fill underbooked slots — not a discount app. Initial go-to-market is a micro-mercado piloto focused on Polanco/Condesa/Roma Norte. Built on Expo/React Native + Supabase. Spanish + English i18n. Project is built in small focused sessions (evenings/weekends).

## Where we are right now

For the latest state and deferred work, read:
- `TODO.md` — the active backlog and known gaps
- Recent commit messages: `git log --oneline -10`

These are the live source of truth. This file (CLAUDE.md) holds only durable architecture and conventions.

## Conventions to follow

These came from hard-won iterations. Don't drift from them without explicit user approval:

- **Strangler pattern**: new code runs alongside old code until proven, then old code is removed. Never rip out the old path in the same session that adds the new one.
- **RLS-first**: every table has Row Level Security enabled and explicit policies. Never bypass via service role. Policies live in migration files alongside the table definitions.
- **Cache + sync**: per-user data flows: read once from Supabase on sign-in, cache in React context, write through to Supabase on user actions. No live-read-every-screen.
- **Explicit columns over JSON**: structured data goes in columns with constraints. JSONB only when truly fluid (e.g., studio.payload is a documented MVP shortcut).
- **Strict identity guards**: never persist a record with userId derived from a fallback (userId ?? userEmail ?? "guest"). Refuse to proceed when userId is null.
- **i18n in both en and es**: every user-facing string has both locales. Never add EN-only keys outside the coach module.
- **Generated Supabase types**: src/types/supabase.ts is the source of truth for column shapes. After any migration, run npm run supabase:types. Don't hand-edit this file.
- **TODO.md is the deferred work register**: any decision to postpone something gets logged there in the moment.
- **Commit boundaries match logical work**: feature commits and fix commits go separately. Migration SQL files are committed with their consuming code.

## How to start a session

When the user begins a new Claude Code session, the user will typically describe which session number we're on. Before doing anything, read:
1. This file (CLAUDE.md)
2. TODO.md (current backlog)
3. The most recent 5 commit messages via `git log --oneline -5`

Then wait for explicit instructions before making any changes.

## Architecture pointers

- Auth: src/auth-context.tsx (the source of userId + isLoggedIn truth)
- Onboarding state: src/onboarding-context.tsx (cache+sync example to mirror for other per-user data)
- Supabase client: src/services/supabase/client.ts
- Generated DB types: src/types/supabase.ts
- Partner data flow: studio-service.ts → useMarketplacePartners hook → home/discover/browse/partner-detail screens
- Bookings: src/services/bookings-service.ts (reads), studio-service.ts createCustomerBooking (writes via RPC)
- Migrations: supabase/migrations/ (numbered, never edit history)

## Stack quirks worth knowing

- Windows PowerShell handles `>` redirection differently than bash; npm scripts that pipe to files need to be careful (see supabase:types script for the workaround)
- The Supabase client must be configured with `storage: AsyncStorage` for sessions to persist on RN
- The studios.payload jsonb is a documented MVP shortcut; KPIs requiring slot/booking queries got their own normalized tables
- Seed slots in the slots table are generated for the next 7 days from when the seed script was last run. They expire. If the app shows no slots, you probably need to re-seed — there's a SQL script in chat history that re-seeds while preserving any slots with real bookings. This is tracked in TODO.md under "Pre-piloto: replace dev slot seeding."

## Execution layer history

Earlier sessions used Cursor's agent for execution. Starting from Session 2d-3's commit, execution moved to Claude Code (this tool). The strategic planning layer is a separate Claude.ai web chat that holds project memory across sessions, plans scope, writes prompts you execute, and reviews your output. Treat any prompt that arrives from the user with framing like "paste this into Claude Code" as a planning-layer directive. Working norms are saved to Claude Code's memory; don't override them without user approval.

## Key project IDs

- Seed studios owner: `seed-data@saveit.mx` (UUID `91dff07b-a723-4358-9f0d-d7e55cd2780f`). All current piloto seed studios are owned by this user. When deleting test data or running seed scripts, this is the owner_id to target.
