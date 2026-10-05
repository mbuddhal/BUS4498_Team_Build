# Generate Monitoring Suggestions Task Specification

## Basic Information

- **Task ID:** T5
- **Task name:** Generate Monitoring Suggestions
- **Task type:** Reason
- **Task owner:** StockBrief suggestion service

## 1. Task Description

T5 converts the qualified explanation and available evidence into neutral topics for the user to monitor. Suggestions should tell the user what information may be worth checking and why it may matter, such as an upcoming earnings release, official guidance, sector performance, or continuation of a market-wide event. Suggestions must not instruct the user to buy, sell, or hold a security.

## 2. Inputs

### Input 1

- **Input name:** Qualified movement explanation
- **Contents and format:** Structured record containing symbol, factual movement, possible driver wording, source links, timestamps, limitations, and policy-check status.
- **Source:** T4 — Explain Watchlist Movement.

### Input 2

- **Input name:** Monitoring-topic rules
- **Contents and format:** Structured policy list of permitted neutral topics, prohibited trade language, and required reason/source fields.
- **Source:** StockBrief workflow configuration.

- **If a required input is missing or invalid:** Record the issue and route the case to T8 or T9 rather than generating a suggestion from unsupported evidence.

## 3. Outputs

### Output 1

- **Output name:** Neutral monitoring suggestions
- **Contents and format:** One or more structured suggestions containing symbol or factor, information to monitor, reason it may matter, relevant source or schedule, time horizon when known, and limitation.
- **Next task or recipient:** T6 — Compose Watchlist Briefing.
- **Complete when:** Each suggestion is traceable to the qualified evidence and uses monitoring language without a personalized trade direction.

### Output 2

- **Output name:** Suggestion-policy exception
- **Contents and format:** Draft suggestion, prohibited or unsupported phrase, source record, and validation reason.
- **Next task or recipient:** T8 — Investigate Missing Market Evidence, or T9 if wording cannot be safely corrected.
- **Complete when:** The unsafe suggestion is blocked from T6 and the reason is logged.

## 4. Planned Tools

### Tool 1

- **Tool name:** generate_monitoring_suggestions
- **Input:** Qualified movement explanation and monitoring-topic rules
- **Output:** Neutral monitoring suggestions
- **Implementation Route:** Rule-based selection plus constrained language-model drafting from the approved evidence.
- **Integration approach:** Direct function call with approved model service.
- **Role in this task:** Selects observable future information that relates to the evidence and explains why monitoring it may help interpret later movement.
- **Task timeout:** 15 seconds per watchlist run.
- **Maximum retries:** 0
- **Retry only when:** Not applicable; another draft cannot create missing evidence.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the incomplete suggestion result and route the case to T8 or T9. Do not pass a blank or speculative suggestion to T6.

### Tool 2

- **Tool name:** check_monitoring_language
- **Input:** Neutral monitoring suggestions
- **Output:** Approved suggestions or suggestion-policy exception
- **Implementation Route:** Deterministic check for source linkage, neutral wording, prohibited buy/sell/hold language, guaranteed predictions, and personalized advice.
- **Integration approach:** Direct function call within the workflow.
- **Role in this task:** Blocks suggestions that become recommendations and confirms that the reason and evidence link are present.
- **Task timeout:** 5 seconds.
- **Maximum retries:** 0
- **Retry only when:** Not applicable; validation is deterministic.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the policy failure and route the case to T9 for review.
