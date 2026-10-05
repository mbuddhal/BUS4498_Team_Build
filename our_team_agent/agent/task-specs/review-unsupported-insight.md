# Review Unsupported Insight Task Specification

## Basic Information

- **Task ID:** T9
- **Task name:** Review Unsupported Insight
- **Task type:** Decide
- **Task owner:** Designated StockBrief human reviewer

## 1. Task Description

T9 is the final human-review exception when the automated workflow cannot safely qualify an insight, complete a briefing section, or approve neutral wording. The reviewer examines the evidence and proposed wording, then decides whether a clearly limited statement may be included. The reviewer does not approve a trade recommendation and does not authorize the system to invent missing evidence.

## 2. Inputs

### Input 1

- **Input name:** Unsupported-insight review packet
- **Contents and format:** Structured packet containing run ID, symbol, market data, context-source links, timestamps, missing fields, attempted T8 investigations, rejected wording, policy concern, and proposed qualified wording.
- **Source:** T8 — Investigate Missing Market Evidence, or T6 — Compose Watchlist Briefing.

- **If a required input is missing or invalid:** Return the packet as incomplete, record the missing field, and stop the run without approving or sending the insight.

## 3. Outputs

### Output 1

- **Output name:** Human-approved qualified wording
- **Contents and format:** Reviewer identity, decision timestamp, approved wording, evidence references, limitations, scope of approval, and status approved-for-composition.
- **Next task or recipient:** T6 — Compose Watchlist Briefing.
- **Complete when:** The reviewer explicitly approves only wording that states the evidence limitation and contains no trade direction.

### Output 2

- **Output name:** Human-rejected insight record
- **Contents and format:** Reviewer identity, decision timestamp, rejection reason, unresolved evidence, and status stopped-no-supported-insight.
- **Next task or recipient:** Stop: no unsupported insight sent; Run and Delivery Log.
- **Complete when:** The rejection is recorded and no email containing the unsupported insight is sent.

## 4. Planned Tools

### Tool 1

- **Tool name:** review_unsupported_insight
- **Input:** Unsupported-insight review packet
- **Output:** Human-approved qualified wording or human-rejected insight record
- **Implementation Route:** Human review queue or review form; no autonomous model decision is allowed.
- **Integration approach:** Direct human handoff with the decision written to the Run and Delivery Log.
- **Role in this task:** Presents the evidence, missing information, attempted investigations, and proposed limited wording to the reviewer and records the explicit approve or reject decision.
- **Task timeout:** Human response deadline of one business day after assignment.
- **Maximum retries:** Not applicable — manual task.
- **Retry only when:** Not applicable. If the reviewer cannot decide because the packet is incomplete, return it to T8 as incomplete rather than guessing.
- **On timeout, exhausted retries, or an error that cannot be retried:** Mark the run review-expired and stop without sending unsupported information.
