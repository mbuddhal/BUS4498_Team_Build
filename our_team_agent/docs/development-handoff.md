# StockBrief development handoff

## 1. System and readiness snapshot

- System: StockBrief, a watchlist monitoring prototype for busy student investors.
- Goal: reduce manual market-checking effort while avoiding personalized financial advice, trades, unsupported claims, and duplicate deliveries.
- Confirmed baseline: repository README, `our_team_agent/agent/workflow-of-tasks.md`, nine task specifications, and Week 11 runtime plans.
- Implementation baseline: commit `f71ed4d` on `main`; the dashboard and OpenAI synthesis workflow are published.
- Delivery target: GitHub Pages frontend plus Supabase database and Edge Functions. Pages deployment is not yet configured.
- Current status: dashboard demo verified; schema/function code reviewed; live Supabase/OpenAI/provider integration unverified.
- Owners: Manu Buddhala and Zoe Lee.

## 2. Architecture and repository map

The browser dashboard collects a watchlist and displays a briefing. The future authenticated path will call the Supabase Edge Function, which validates the user and idempotency key, reads or receives evidence, calls OpenAI, validates the structured result, persists the run, and creates a review packet when evidence is insufficient.

| Component | Responsibility | Source |
|---|---|---|
| Static dashboard | Watchlist UX, demo mode, pause state, review packet display | `index.html`, `app.js`, `styles.css` |
| Workflow contract | Ordered task behavior and limits | `agent/workflow-of-tasks.md`, `agent/task-specs/` |
| Persistent state | Private watchlists, evidence, runs, review packets, lessons | `supabase/migrations/002_stockbrief.sql` |
| Synthesis controller | Auth, input/policy validation, idempotency, OpenAI call, persistence | `supabase/functions/run-stockbrief/index.ts` |
| Runtime controls | Hosting, memory, permission rules | `runtime/` |

## 3. Runtime, model, and configuration

- OpenAI model: `gpt-6-luna` through `POST https://api.openai.com/v1/responses`.
- Output contract: strict JSON schema with movement, cautious explanation, neutral suggestions, citations, limitations, and `supported`/`held_for_review` status.
- Privacy setting: `store: false` in the OpenAI request; recipient email is not included in the model input.
- Required secret: `OPENAI_API_KEY` in Supabase Secrets.
- Optional safe settings: `OPENAI_MODEL`, `ALLOWED_ORIGIN`.
- No credentials are stored in the repository.

## 4. Tools and integrations

| Tool | Intended operation | Status |
|---|---|---|
| Supabase Auth/Database | Authenticate users and persist private state under RLS | Schema and function code present; migration/deployment unverified |
| OpenAI Responses API | Produce structured, policy-constrained briefing language | Adapter present; key and live call unverified |
| Market data API | Supply fresh price evidence | Provider not selected/connected |
| Approved context sources | Supply source-backed context | Provider not selected/connected |
| Email provider | Send one validated briefing | Provider not selected/connected |

## 5. Data and persistence

The migration creates owner-scoped tables for watchlists, market evidence, context evidence, briefing runs, review packets, and lessons. RLS policies restrict access to the authenticated owner. The unique `(user_id, idempotency_key)` constraint prevents duplicate runs. Backup/restore and production retention are not verified.

## 6. Workflow controls and human review

The controller owns authentication, evidence-only inputs, idempotency, output schema validation, prohibited-advice rejection, and held-review packet creation. Unsupported causal explanations stop at human review. The agent does not approve its own exception and cannot authorize trading directions. Pause controls are represented in the schema and demo; server-side pause enforcement remains to be connected to the deployed workflow.

## 7. Setup and operation

1. Apply `supabase/migrations/002_stockbrief.sql` to the shared project.
2. Set `OPENAI_API_KEY` in Supabase Secrets.
3. Deploy `supabase/functions/run-stockbrief/`.
4. Use an authenticated caller with synthetic evidence and an idempotency key.
5. Run the cases in `runtime/test-plan.md` and record observed results.
6. Configure the frontend publishable key only in an ignored `config.js`; never add a secret key.

The local demo can be previewed from `our_team_agent/` with a static server. It is not a live agent.

## 8. Verification limits

The static dashboard was verified locally for initial render, demo run, pause blocking, and review-dialog behavior. Code syntax and whitespace checks passed; Deno type-checking was not available in the local environment. Supabase migration application, Edge Function deployment, OpenAI calls, live source retrieval, RLS isolation, email delivery, and GitHub Pages deployment remain unverified.

## 9. System engineer review register

| Priority | Component | Finding and next check | Owner | Release impact |
|---|---|---|---|---|
| P0 | Supabase migration/function | Apply migration and deploy function; pass authenticated N1–N3 and E1 tests without cross-user reads. | Manu and Zoe | Blocks live use |
| P0 | Market/context adapters | Select approved providers, implement freshness/source validation, and pass N2/E2 with representative evidence. | Unassigned | Blocks live use |
| P0 | Email adapter | Select provider, validate recipient scope and delivery idempotency, then pass N5. | Unassigned | Blocks scheduled delivery |
| P1 | Frontend auth/config | Connect sign-in, publishable key, function URL, and RLS-aware client; verify the Pages base path. | Manu and Zoe | Blocks public deployment |
| P1 | Handoff/test evidence | Run the Builder Kit test controls and replace pending statuses with observed receipts. | Manu and Zoe | Blocks final submission claim |
