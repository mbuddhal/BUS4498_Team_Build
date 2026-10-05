# Retrieve Active Watchlist Configuration Task Specification

## Basic Information

- **Task ID:** T1
- **Task name:** Retrieve Active Watchlist Configuration
- **Task type:** Retrieve
- **Task owner:** StockBrief scheduled workflow

## 1. Task Description

T1 reads the active watchlist configuration selected by the scheduler and validates it before any market-source calls occur. The task produces one usable configuration containing the symbols to process, the recipient address, the active status, and the configured market-open or market-close schedule. It must not create a watchlist, replace symbols, or invent a recipient.

## 2. Inputs

### Input 1

- **Input name:** Scheduled run context
- **Contents and format:** Structured run record containing a unique run ID, scheduled execution time, and the watchlist configuration identifier.
- **Source:** Scheduler.

### Input 2

- **Input name:** Stored watchlist configuration
- **Contents and format:** Structured database record containing one or more stock symbols, recipient email, active status, schedule, and record timestamps.
- **Source:** Watchlist Configuration Database.

- **If a required input is missing or invalid:** Record the run ID and exact missing or invalid field in the Run and Delivery Log, mark the run as configuration-invalid, and stop before T2. The user must correct the saved configuration before a later scheduled run.

## 3. Outputs

### Output 1

- **Output name:** Validated watchlist record
- **Contents and format:** Structured record containing normalized valid symbols, a validated recipient email, active status, schedule, configuration ID, and validation timestamp.
- **Next task or recipient:** T2 — Retrieve Market Data.
- **Complete when:** At least one symbol, a valid recipient, active status, and a valid market-open or market-close schedule are present and internally consistent.

### Output 2

- **Output name:** Configuration exception record
- **Contents and format:** Structured error record containing the run ID, configuration ID, failed validation rule, affected field, timestamp, and status configuration-invalid.
- **Next task or recipient:** Run and Delivery Log; configuration owner on the next correction cycle.
- **Complete when:** The invalid configuration is recorded and no downstream market or email task is started.

## 4. Planned Tools

### Tool 1

- **Tool name:** retrieve_watchlist_configuration
- **Input:** Scheduled run context
- **Output:** Stored watchlist configuration
- **Implementation Route:** Read-only database query by configuration identifier.
- **Integration approach:** Direct integration with the Watchlist Configuration Database.
- **Role in this task:** Retrieves the existing saved record without changing it.
- **Task timeout:** 10 seconds.
- **Maximum retries:** 1
- **Retry only when:** A transient database timeout occurs; retry once with the same read-only query. Do not retry a missing record or return a different record.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the retrieval failure and run ID in the Run and Delivery Log, mark the run incomplete, and stop before T2.

### Tool 2

- **Tool name:** validate_watchlist_configuration
- **Input:** Stored watchlist configuration
- **Output:** Validated watchlist record or configuration exception record
- **Implementation Route:** Deterministic validation function for required fields, symbol format, email format, active status, schedule, duplicate symbols, and timestamps.
- **Integration approach:** Direct function call within the workflow.
- **Role in this task:** Normalizes symbols and checks that the record is complete and internally consistent; it never silently repairs missing user choices.
- **Task timeout:** 5 seconds.
- **Maximum retries:** 0
- **Retry only when:** Not applicable; deterministic validation is not retried.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the validation error and stop the run as configuration-invalid. Do not call T2 or T7.
