# Retrieve Market Data Task Specification

## Basic Information

- **Task ID:** T2
- **Task name:** Retrieve Market Data
- **Task type:** Retrieve
- **Task owner:** StockBrief market-data service

## 1. Task Description

T2 retrieves a current, timestamped market snapshot for every symbol in the validated watchlist. It supplies the factual price movement data used by later context and explanation tasks. T2 reports source and freshness for every result and never estimates, fills, or silently drops a missing value.

## 2. Inputs

### Input 1

- **Input name:** Validated watchlist record
- **Contents and format:** Structured record from T1 containing one or more normalized stock symbols, run ID, schedule, and validation timestamp.
- **Source:** T1 — Retrieve Active Watchlist Configuration.

- **If a required input is missing or invalid:** Record the input error and stop the run before querying sources. Send the case to the Run and Delivery Log; do not continue with a partial or unvalidated watchlist.

## 3. Outputs

### Output 1

- **Output name:** Market evidence set
- **Contents and format:** One structured evidence record per symbol containing symbol, current price, comparison price, percentage change, currency when available, market status, observation timestamp, source identifier, and freshness status.
- **Next task or recipient:** T3 — Retrieve Market Context.
- **Complete when:** Every symbol has a valid current snapshot, or each unavailable or stale field is explicitly marked with a source error and timestamp.

### Output 2

- **Output name:** Market-data exception record
- **Contents and format:** Run ID, symbol, requested field, source attempted, error or stale-data reason, attempt count, and timestamp.
- **Next task or recipient:** T8 — Investigate Missing Market Evidence.
- **Complete when:** The unresolved field is recorded and downstream explanation does not treat it as known.

## 4. Planned Tools

### Tool 1

- **Tool name:** retrieve_market_snapshot
- **Input:** Validated watchlist record
- **Output:** Market evidence set
- **Implementation Route:** Web API requests to an approved market-data provider.
- **Integration approach:** Direct integration with the provider API.
- **Role in this task:** Requests the same defined fields for each symbol and attaches provider timestamps and source identifiers.
- **Task timeout:** 30 seconds for the full watchlist.
- **Maximum retries:** 1 additional attempt per failed symbol request.
- **Retry only when:** A transient timeout or rate-limit response occurs; retry the same symbol after the provider's permitted wait. Do not retry invalid symbols as if they were temporary.
- **On timeout, exhausted retries, or an error that cannot be retried:** Emit a market-data exception record for the affected symbol and route the run to T8. Do not substitute a prior value without labeling it stale.

### Tool 2

- **Tool name:** validate_market_snapshot
- **Input:** Market evidence set
- **Output:** Market evidence set or market-data exception record
- **Implementation Route:** Deterministic validation function for numeric fields, symbol identity, timestamp, percentage-change calculation, and freshness threshold.
- **Integration approach:** Direct function call within the workflow.
- **Role in this task:** Rejects malformed, mismatched, or stale provider output and preserves the exact reason for rejection.
- **Task timeout:** 5 seconds.
- **Maximum retries:** 0
- **Retry only when:** Not applicable; validation is deterministic.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the validation failure and route the affected evidence to T8. Do not send an incomplete briefing as complete.
