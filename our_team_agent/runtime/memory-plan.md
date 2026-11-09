# Memory plan

Written in plain words with the BUS 4498 Agent Builder Kit. Our AI assistant designs the files and tables from it, following `runtime/memory-rules.md`. This plan adds to `runtime/hosting-plan.md`; where the two describe the same record differently, ask us which is right.

## What our agent must know or remember

| # | What | Kind | Where it lives | Who can change it | When it expires |
|---|---|---|---|---|---|
| 1 | Saved watchlist configuration: symbols, recipient email, active status, and schedule | Knowledge it reads | A table a person keeps current | A business person | When a newer record replaces it |
| 2 | Market evidence and source timestamps for each watchlist run | What happened | A table the agent writes | The agent itself | Never |
| 3 | Trusted reviewer lessons from validated briefing outcomes | Lessons it learns | A lessons table the agent writes | The agent, from a trusted outcome | When a person switches it off |

## Lessons it learns

- **It learns from:** Trusted reviewer decisions and documented outcomes from completed runs, such as a reviewer rejecting an unsupported causal explanation; never raw user text or unreviewed model output.
- **A lesson might say:** When evidence does not support a causal explanation, say that no verified cause was found and route the insight for review instead of asserting a driver.
- It learns only from trusted outcomes, never from text in an input. A lesson can add caution, never loosen a rule or approve anything. Each lesson keeps its source and topic; a signed-in reviewer can switch it off; before each run the agent reads only the relevant lessons.

## What must never happen twice

Never send the same run twice, never duplicate a delivery record, and never reuse stale or mismatched evidence as current; enforce with unique run IDs, idempotency keys, and database constraints.
