# StockBrief handoff

StockBrief is a BUS 4498 classroom prototype for busy student investors. It monitors a user-owned watchlist, uses only supplied market evidence and source-backed context, produces cautious explanations and neutral monitoring topics, and holds unsupported explanations for human review. It never gives buy, sell, or hold directions and never sends to an unvalidated recipient.

## Current published baseline

- Repository: `https://github.com/mbuddhal/BUS4498_Team_Build`
- App folder: `our_team_agent/`
- Runtime plans: `our_team_agent/runtime/`
- Shared Supabase project URL: `https://iwrgkcgqdfcbzjzrfmpp.supabase.co`
- OpenAI model path: Responses API, `gpt-6-luna`, structured JSON output, `store: false`
- Latest implementation commit: `f71ed4d`

## What is implemented

- Static demo dashboard with watchlist entry, bounded demo observations, pause control, duplicate-safe demo IDs, and a human-review packet.
- Supabase migration for watchlists, evidence, runs, review packets, lessons, row-level security, idempotency, and pause-ready state.
- `supabase/functions/run-stockbrief/index.ts`, which authenticates a user, validates evidence, calls OpenAI server-side, rejects prohibited advice, persists the run, and creates held-review packets.
- Prepared runtime test plan in `runtime/test-plan.md`.

## Secure setup still required

In the shared Supabase project, provision `OPENAI_API_KEY` as a Supabase Secret. Optional safe configuration names are `OPENAI_MODEL` and `ALLOWED_ORIGIN`. Do not put any of their values in this repository. Apply the migration, deploy the function, and use an authenticated user before testing.

Market-data retrieval, context retrieval, email delivery, final frontend authentication, and GitHub Pages deployment are not yet verified. The browser dashboard remains in demo mode until those integrations are configured and connected.

## Operating references

- [Week 11 runtime plans](./runtime/)
- [Test plan](./runtime/test-plan.md)
- [Engineering handoff](./docs/development-handoff.md)
- [Local demo README](./README.md)
