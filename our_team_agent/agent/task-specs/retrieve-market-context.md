# Retrieve Market Context Task Specification

## Basic Information

- **Task ID:** T3
- **Task name:** Retrieve Market Context
- **Task type:** Retrieve
- **Task owner:** StockBrief context-retrieval service

## 1. Task Description

T3 gathers timely, source-backed context that may relate to notable watchlist movement. It checks company news, earnings information, official guidance, sector or index movement, and relevant broad market events. It separates relevant context from verified causation and records enough metadata for T4 to qualify its explanation.

## 2. Inputs

### Input 1

- **Input name:** Market evidence set
- **Contents and format:** Structured records for each symbol containing price change, market status, observation timestamp, source, and freshness status.
- **Source:** T2 — Retrieve Market Data.

### Input 2

- **Input name:** Approved context-source rules
- **Contents and format:** Structured list of allowed source categories, time window, query limits, and required evidence fields.
- **Source:** StockBrief workflow configuration.

- **If a required input is missing or invalid:** Record the missing input or source-rule error and route the affected symbol to T8. Do not describe a context item as evidence without a source and timestamp.

## 3. Outputs

### Output 1

- **Output name:** Market context evidence set
- **Contents and format:** Evidence records containing symbol or market factor, headline or event description, source URL or identifier, publisher, publication or observation time, retrieval time, relevance note, and source category.
- **Next task or recipient:** T4 — Explain Watchlist Movement, or T6 when no notable movement or relevant event exists.
- **Complete when:** Each notable movement has the permitted context search completed and every included item has source, time, and relevance metadata.

### Output 2

- **Output name:** Context evidence exception record
- **Contents and format:** Run ID, symbol, query scope, sources attempted, unavailable or stale fields, and timestamp.
- **Next task or recipient:** T8 — Investigate Missing Market Evidence.
- **Complete when:** The unresolved evidence gap is explicit and cannot be mistaken for a verified cause.

## 4. Planned Tools

### Tool 1

- **Tool name:** search_market_context
- **Input:** Market evidence set and approved context-source rules
- **Output:** Market context evidence set
- **Implementation Route:** Search requests and read-only retrieval from approved news, earnings, company, sector, index, and market-event sources.
- **Integration approach:** Direct web API integration where available; otherwise approved MCP retrieval.
- **Role in this task:** Finds context in the permitted time window, preserves source links and timestamps, and associates each item with a symbol or market factor.
- **Task timeout:** 45 seconds per watchlist run.
- **Maximum retries:** 1 additional attempt for a transient source failure.
- **Retry only when:** The source times out or temporarily rejects the request; retry within the time limit. Do not retry indefinitely or broaden the query beyond the approved scope.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the exact source failure and route the affected evidence to T8. Do not infer a cause from the absence of results.

### Tool 2

- **Tool name:** validate_context_evidence
- **Input:** Market context evidence set
- **Output:** Market context evidence set or context evidence exception record
- **Implementation Route:** Deterministic check for source, timestamp, symbol or factor mapping, duplicate items, and relevance metadata.
- **Integration approach:** Direct function call within the workflow.
- **Role in this task:** Rejects unsupported or incomplete context items and marks uncertainty for T4.
- **Task timeout:** 5 seconds.
- **Maximum retries:** 0
- **Retry only when:** Not applicable; validation is deterministic.
- **On timeout, exhausted retries, or an error that cannot be retried:** Route the invalid or incomplete evidence to T8 and prevent it from being used as confirmed causation.
