# Compose Watchlist Briefing Task Specification

## Basic Information

- **Task ID:** T6
- **Task name:** Compose Watchlist Briefing
- **Task type:** Act
- **Task owner:** StockBrief briefing service

## 1. Task Description

T6 combines validated market facts, source-backed context, qualified explanations, and neutral monitoring suggestions into one concise watchlist briefing. It creates a consistent section for every symbol, includes timestamps and source links, states limitations, and blocks unsupported causal claims or prohibited trade language before T7 can send the email.

## 2. Inputs

### Input 1

- **Input name:** Market evidence set
- **Contents and format:** Timestamped structured price and market-status records for every watchlist symbol.
- **Source:** T2 — Retrieve Market Data.

### Input 2

- **Input name:** Context and explanation records
- **Contents and format:** Source-backed context plus qualified movement explanations or an explicit no-verified-cause result for each relevant symbol.
- **Source:** T3 — Retrieve Market Context and T4 — Explain Watchlist Movement.

### Input 3

- **Input name:** Neutral monitoring suggestions
- **Contents and format:** Structured suggestions with information to monitor, reason, source or schedule, and limitation.
- **Source:** T5 — Generate Monitoring Suggestions.

- **If a required input is missing or invalid:** Record the missing section and route the run to T8 or T9. Do not compose a briefing that appears complete while omitting an unresolved required section.

## 3. Outputs

### Output 1

- **Output name:** Watchlist briefing
- **Contents and format:** Markdown or HTML message with run timestamp, one section per symbol, price movement, context, qualified explanation or no-verified-cause statement, neutral suggestions, source links, limitations, and recipient metadata.
- **Next task or recipient:** T7 — Send Watchlist Email.
- **Complete when:** Every symbol is represented, required citations and timestamps are present, policy checks pass, and the message is addressed only to the validated recipient.

### Output 2

- **Output name:** Briefing-completeness exception
- **Contents and format:** Run ID, missing or blocked section, validation rule, affected symbol, and evidence needed to continue.
- **Next task or recipient:** T8 — Investigate Missing Market Evidence, or T9 for human review.
- **Complete when:** The incomplete draft is blocked from T7 and the reason is logged.

## 4. Planned Tools

### Tool 1

- **Tool name:** compose_watchlist_briefing
- **Input:** Market evidence set, context and explanation records, and neutral monitoring suggestions
- **Output:** Watchlist briefing
- **Implementation Route:** Template renderer with constrained language-model formatting for concise prose.
- **Integration approach:** Direct function call within StockBrief.
- **Role in this task:** Places each approved field into the fixed briefing structure and preserves source links, timestamps, qualifications, and limitations.
- **Task timeout:** 15 seconds per watchlist run.
- **Maximum retries:** 0
- **Retry only when:** Not applicable; re-rendering cannot repair missing evidence.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the rendering failure and route the case to T8 or T9. Do not send a partial message.

### Tool 2

- **Tool name:** validate_briefing_content
- **Input:** Watchlist briefing
- **Output:** Approved briefing or briefing-completeness exception
- **Implementation Route:** Deterministic checks for symbol coverage, source links, timestamps, recipient match, unsupported causation, and prohibited trade language.
- **Integration approach:** Direct function call within the workflow.
- **Role in this task:** Confirms that the message is complete and safe for T7; it does not send the message.
- **Task timeout:** 5 seconds.
- **Maximum retries:** 0
- **Retry only when:** Not applicable; validation is deterministic.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the validation failure and route the case to T9 for review.
