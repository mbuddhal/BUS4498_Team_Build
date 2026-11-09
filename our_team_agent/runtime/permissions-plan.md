# Permissions and boundaries plan

Written in plain words with the BUS 4498 Agent Builder Kit. Our AI assistant builds it following `runtime/permission-rules.md`. Where this plan and our task specifications disagree, this plan wins.

- Agent: StockBrief monitors each user’s saved stock watchlist, retrieves current market data and source-backed context, explains movement cautiously, suggests neutral topics to monitor, and sends a concise briefing without providing personalized financial advice or making trades. (`our_team_agent`)
- Owner, who answers for this agent: Manu Buddhala and Zoe Lee
- Written on: November 8, 2026

## 1. May (on its own)

| # | Action |
|---|---|
| 1 | Read a validated watchlist and approved source-backed market context, draft a qualified briefing with links, and prepare neutral monitoring suggestions. |

## 2. May, with a limit

| # | What | The limit | Kind | Who can change it |
|---|---|---|---|---|
| 1 | Retrieve current data and context and send one completed briefing per validated run. | One request per symbol; 45 seconds and at most 5 investigation calls per gap; one delivery per run ID. | Fixed: only the builders change it | Only the builders, by changing the code |

## 3. Ask first (hold for a person)

| # | When | What the agent does instead |
|---|---|---|
| 1 | Evidence cannot support a causal explanation, a source is outside the approved list, or a recipient/watchlist change is requested. | Pause the run and create a T9 review packet; the designated human approves or rejects qualified wording in the app. |

## 4. Never

| # | Never | Where it is enforced |
|---|---|---|
| 1 | Provide buy, sell, or hold recommendations, invent or estimate missing/stale evidence, send to an unvalidated recipient, or retry indefinitely. | Code and a database rule |

## 5. Who signs off

| Decision | Who | How |
|---|---|---|
| Whether unresolved movement explanations or unsupported insights may be included. | Designated human reviewer; Manu and Zoe own the policy. | Approve or reject the review packet with a recorded in-app decision; never approve trade direction. |

## The off switch

Manu Buddhala or Zoe Lee can pause StockBrief with the Paused switch in the app; when paused, no retrieval or email runs.

## How mistakes are reported

Use the Report a problem control on the affected briefing; the owner reviews the run ID, sources, policy decision, and delivery record, then records the correction and lesson.

## Rules we keep

- Every permission starts off. The agent may do only what this plan lists under *May* and *May, with a limit*.
- Writing a permission down does not enforce it. Every limit and every *Never* is enforced in code or in a database rule, never in instructions alone.
- A limit a person may change is a setting with an owner and a reason, which the code reads on every run.
- Asking means holding, not guessing: the record waits with a plain reason that names what is missing.
- A sign-off is a click in the app, recorded with who and when. A chat message is not a sign-off.
- Test mode never acts: with `dry_run`, the agent decides but saves nothing.

