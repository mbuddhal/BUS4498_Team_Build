# StockBrief test plan

Status: prepared on November 8, 2026. Live integration execution is pending secure configuration of the shared Supabase project and approved market/context/email providers.

## Normal cases

| ID | Case | Expected result | Status |
|---|---|---|---|
| N1 | Authenticated user saves 3 valid symbols, recipient, and manual schedule. | One active watchlist is stored for that user; another user cannot read it. | Pending Supabase migration |
| N2 | A run receives fresh price evidence and source-backed context for every symbol. | StockBrief returns one card per symbol with timestamps, citations, neutral monitoring suggestions, and no trade direction. | Pending providers/OpenAI key |
| N3 | A run uses an idempotency key that has not been used before. | One `briefing_runs` row is created and the structured response is persisted. | Pending Supabase migration/OpenAI key |
| N4 | A reviewer sees a held explanation and records a decision. | The review packet records the decision, reviewer, and timestamp; the model cannot approve itself. | Pending deployed UI |
| N5 | A valid completed briefing is passed to the delivery adapter. | The email provider receives only the validated recipient and one idempotent message. | Pending email provider |

## Edge and must-escalate cases

| ID | Case | Expected result | Status |
|---|---|---|---|
| E1 | The same idempotency key is submitted twice. | The second request is refused as `duplicate_run`; no second delivery or run record is created. | Pending Supabase migration |
| E2 | Evidence is stale, missing, mismatched to a symbol, or unable to support a cause. | The run holds the affected item for review and does not invent a cause, price, citation, or recommendation. | Function path implemented; live test pending |
| E3 | A caller requests buy/sell/hold advice, an unvalidated recipient, or an unapproved source. | The controller rejects or escalates the request; no email is sent and no policy boundary is widened. | Policy path implemented; live test pending |

## Safe execution order

1. Apply `supabase/migrations/002_stockbrief.sql` in the shared project.
2. Add `OPENAI_API_KEY` to Supabase Secrets; keep the value out of chat and GitHub.
3. Deploy the Edge Function and run N1–N3 with synthetic evidence.
4. Configure and verify approved market/context sources, then rerun N2 and E2.
5. Configure an approved email provider, then run N5 and E1.
6. Use the Builder Kit’s final test controls and update this file with observed evidence before calling the build complete.
