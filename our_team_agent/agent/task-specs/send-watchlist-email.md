# Send Watchlist Email Task Specification

## Basic Information

- **Task ID:** T7
- **Task name:** Send Watchlist Email
- **Task type:** Act
- **Task owner:** StockBrief delivery service

## 1. Task Description

T7 sends the validated watchlist briefing to the recipient stored in the validated configuration. It performs the only external delivery action in the scheduled workflow, records the provider response, and distinguishes confirmed delivery from an unknown or failed outcome. It must not change the recipient, send to an unverified address, or claim success without usable delivery evidence.

## 2. Inputs

### Input 1

- **Input name:** Approved watchlist briefing
- **Contents and format:** Final Markdown or HTML message with run ID, symbol sections, market data, context, explanations, suggestions, source links, limitations, and policy-check status.
- **Source:** T6 — Compose Watchlist Briefing.

### Input 2

- **Input name:** Validated recipient record
- **Contents and format:** Structured record containing the validated recipient email, configuration ID, run ID, and active status.
- **Source:** T1 — Retrieve Active Watchlist Configuration.

- **If a required input is missing or invalid:** Do not send. Record the missing input and route the run to the Run and Delivery Log as delivery-not-attempted.

## 3. Outputs

### Output 1

- **Output name:** Confirmed delivery record
- **Contents and format:** Run ID, recipient, provider message ID, send timestamp, provider delivery status, subject or content hash, and status delivered or accepted according to provider semantics.
- **Next task or recipient:** Successful completion and Run and Delivery Log.
- **Complete when:** The provider returns a usable non-error response that identifies the message and its delivery or accepted status.

### Output 2

- **Output name:** Delivery failure record
- **Contents and format:** Run ID, recipient, message identifier if any, provider response, error category, attempt count, timestamp, and status delivery-failed or delivery-unknown.
- **Next task or recipient:** Stop: delivery failure recorded; Run and Delivery Log.
- **Complete when:** The outcome is recorded without reporting successful completion.

## 4. Planned Tools

### Tool 1

- **Tool name:** send_watchlist_email
- **Input:** Approved watchlist briefing and validated recipient record
- **Output:** Provider delivery response
- **Implementation Route:** Authenticated email API request using the configured delivery provider.
- **Integration approach:** Direct integration with the email provider API.
- **Role in this task:** Sends one message to the exact validated recipient and includes an idempotency key based on run ID.
- **Task timeout:** 20 seconds.
- **Maximum retries:** 1 additional attempt.
- **Retry only when:** The provider returns a clearly transient timeout before a message ID is known. Reuse the same run ID and idempotency key to prevent duplicate messages. Do not retry after an ambiguous response unless the provider supports idempotency.
- **On timeout, exhausted retries, or an error that cannot be retried:** Write a delivery failure or delivery-unknown record and stop. Do not send to another address or claim the briefing was delivered.

### Tool 2

- **Tool name:** record_delivery_result
- **Input:** Provider delivery response or delivery failure record
- **Output:** Run and Delivery Log entry
- **Implementation Route:** Append-only database or structured log write.
- **Integration approach:** Direct integration with the Run and Delivery Log.
- **Role in this task:** Stores the provider response, timestamps, status, recipient, and idempotency key for audit and later review.
- **Task timeout:** 5 seconds.
- **Maximum retries:** 1 additional attempt for a transient log-write failure.
- **Retry only when:** The write is known to have failed before acknowledgment; use the same run ID and event ID to avoid duplicate records.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the logging failure in the local run state and mark delivery status unknown. Do not treat the task as successful.
