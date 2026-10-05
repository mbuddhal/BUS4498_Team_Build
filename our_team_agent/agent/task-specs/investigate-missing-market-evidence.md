```yaml
# BASIC INFORMATION
task_id: "T8"
task_name: "Investigate Missing Market Evidence"
task_owner: "StockBrief evidence-investigation service"
```

## 1. Task Goal

- **Objective:** Resolve a specific missing, stale, inconsistent, unavailable, or unsupported market-evidence gap within bounded limits, or produce a complete handoff packet for T9. T8 may recover evidence, but it may not invent data, assert an unverified cause, recommend a trade, or send an email.

## 2. Inbound Inputs

### Input 1

- **Input name:** Evidence gap record
- **What it contains:** Structured run ID, affected symbol or market factor, missing field, source attempted, source response, timestamp, freshness issue, and task that detected the gap.
- **Source:** T2 — Retrieve Market Data, T3 — Retrieve Market Context, T4 — Explain Watchlist Movement, or T6 — Compose Watchlist Briefing.

### Input 2

- **Input name:** Investigation policy and budgets
- **What it contains:** Structured list of approved alternate sources, permitted query scope, freshness threshold, maximum retry count, total task timeout, and tool-call limit.
- **Source:** StockBrief workflow configuration.

## 3. Tool Permissions and Boundaries

### Task-Wide Limits

- **Total task timeout:** 45 seconds per affected evidence gap, including waiting and retries.
- **Maximum tool calls:** 5 total calls across all tools for one gap; retries count toward this total.

### Tool 1

- **Tool name:** retry_allowed_source
- **Tool type:** Web API request
- **Supports these permitted subtasks:** Classify evidence gap; retry approved source.
- **Allowed use:** Repeats a read-only request for the same symbol, field, and permitted time window after a transient timeout or rate-limit response.
- **Prohibited use:** Changing query scope without justification, using an unapproved source, inventing a value, or treating an empty response as proof of no event.
- **Approval required:** None within the allowed use; the workflow policy already authorizes one bounded retry.
- **Timeout per call:** 10 seconds.
- **Maximum retries per call:** 1 additional attempt.
- **Retry conditions and failure response:** Retry only for a transient failure and record both attempts. On exhaustion, continue to another permitted subtask or hand off to T9.

### Tool 2

- **Tool name:** query_approved_context_source
- **Tool type:** Web API request or approved MCP retrieval
- **Supports these permitted subtasks:** Narrow market-context query; check approved alternate source.
- **Allowed use:** Searches an approved source category for the affected symbol or factor within the configured time window and returns source, timestamp, and relevance metadata.
- **Prohibited use:** Broad unbounded searching, relying on social speculation as confirmed evidence, contacting a person, sending email, or making a trade recommendation.
- **Approval required:** None within the allowed use; approved source categories and query limits are inputs to T8.
- **Timeout per call:** 10 seconds.
- **Maximum retries per call:** 0
- **Retry conditions and failure response:** Do not repeat the same failed query. Record the source response and choose another permitted subtask only if the total limits allow it.

### Tool 3

- **Tool name:** compare_evidence_metadata
- **Tool type:** Deterministic validation function
- **Supports these permitted subtasks:** Compare timestamps and symbol mappings; validate recovered evidence.
- **Allowed use:** Checks that symbols, timestamps, source fields, freshness, and requested fields align with the evidence gap.
- **Prohibited use:** Modifying source data, filling a missing value, or converting relevance into causation.
- **Approval required:** None within the allowed use.
- **Timeout per call:** 5 seconds.
- **Maximum retries per call:** 0
- **Retry conditions and failure response:** Not applicable; if validation fails, record the mismatch and hand off when no permitted path remains.

## 4. How the Agent Should Reason

### Permitted Subtask 1

- **Subtask name:** classify_evidence_gap
- **Subtask description:** Identify whether the gap is missing data, stale data, source failure, symbol mismatch, incomplete context, or unsupported causal wording. Produce one gap classification and the highest-priority missing field.
- **Subtask boundary:** Inspect only the supplied run records and source responses. Do not make a new claim or broaden the search.
- **Retry limits:** 0 additional attempts.

### Permitted Subtask 2

- **Subtask name:** retry_allowed_source
- **Subtask description:** Repeat one approved read-only source request when the failure is transient and a retry is permitted. Produce a response with source and timestamp.
- **Subtask boundary:** Use the same symbol, field, and time window. Stop if the result is still missing, stale, or ambiguous.
- **Retry limits:** 1 additional attempt.

### Permitted Subtask 3

- **Subtask name:** query_approved_context_source
- **Subtask description:** Select one approved alternate source or narrower query that addresses the classified gap. Produce evidence or a documented no-result response.
- **Subtask boundary:** Stay within the approved source category and time window. A no-result response does not prove that no event occurred.
- **Retry limits:** 0 additional attempts per query.

### Permitted Subtask 4

- **Subtask name:** validate_recovered_evidence
- **Subtask description:** Compare the recovered record with the original gap and check source, timestamp, symbol mapping, requested field, and freshness. Produce validated evidence or a mismatch.
- **Subtask boundary:** Validation can accept or reject evidence; it cannot repair or infer it.
- **Retry limits:** 0 additional attempts.

- **Decision guidance:** After classifying the gap, select the permitted subtask most likely to resolve the most important remaining uncertainty. The agent may skip, repeat only within the stated limits, or combine permitted subtasks. If evidence is recovered, validate it before returning to the control check that detected the gap. If no permitted subtask can make useful progress within the task-wide limits, stop and hand the case to T9.

## 5. When to Stop or Hand Off to a Human

- **Stop successfully when:** The missing field or context item is recovered, its source and timestamp are recorded, its symbol or factor mapping is valid, and the evidence is fresh enough for the enclosing workflow. Return the validated evidence to T4, T5, or T6 as directed by the workflow.
- **Hand off early when:** The evidence remains missing or stale, all permitted sources fail, the response is ambiguous, the evidence would require an unsupported causal claim, a budget is exhausted, or the request is outside T8's authority.
- **Hand off to:** T9 — Review Unsupported Insight, with the complete investigation packet.

Stop at the first applicable budget limit or handoff condition. While awaiting review, take no further autonomous action.

## 6. Outbound Deliverable

- **Status:** Completed with recovered evidence or escalated to human.
- **Result or recommendation:** Validated evidence record, or undetermined if the gap remains unresolved. Never a trade recommendation.
- **Evidence summary:** Original gap, sources attempted, source timestamps, recovered fields, freshness, and validation result.
- **Subtasks performed:** Gap classification, retries, alternate-source queries, metadata comparisons, and validation attempts actually completed.
- **Unresolved issues:** Any missing, stale, conflicting, or ambiguous fields; none only when the evidence gap is fully resolved.
- **Handoff note:** If escalated, include the missing field, attempted sources, limits reached, and the exact wording or decision T9 must review. Write "Not applicable" for a completed task.
- **Next task or recipient:** Return resolved evidence to T4, T5, or T6; unresolved cases go to T9 — Review Unsupported Insight.
