# Explain Watchlist Movement Task Specification

## Basic Information

- **Task ID:** T4
- **Task name:** Explain Watchlist Movement
- **Task type:** Reason
- **Task owner:** StockBrief explanation service

## 1. Task Description

T4 compares observed price movement with the market context evidence and produces a cautious, source-backed explanation for each notable symbol. It distinguishes facts from interpretation, labels relationships as possible drivers or consistent evidence, and states when no verified cause is available. It never turns timing alone into causation or gives a buy, sell, or hold recommendation.

## 2. Inputs

### Input 1

- **Input name:** Market evidence set
- **Contents and format:** Timestamped structured records with symbol, current price, comparison price, percentage change, market status, source, and freshness.
- **Source:** T2 — Retrieve Market Data.

### Input 2

- **Input name:** Market context evidence set
- **Contents and format:** Source-backed evidence records with symbol or market factor, event description, source link, publication or observation time, retrieval time, and relevance note.
- **Source:** T3 — Retrieve Market Context, or T8 when evidence was recovered.

- **If a required input is missing or invalid:** Do not write a causal explanation. Create an evidence exception record and route the case to T8.

## 3. Outputs

### Output 1

- **Output name:** Qualified movement explanation
- **Contents and format:** Structured record containing symbol, movement window, factual observations, possible driver wording, supporting source links, evidence timestamps, confidence limitation, and no-advice policy check.
- **Next task or recipient:** T5 — Generate Monitoring Suggestions.
- **Complete when:** The explanation is traceable to available evidence, uses qualified language, and contains no unsupported causal claim or trade direction.

### Output 2

- **Output name:** Unsupported-explanation exception
- **Contents and format:** Symbol, movement, evidence considered, missing support, rejected wording, and reason the explanation cannot be safely stated.
- **Next task or recipient:** T8 — Investigate Missing Market Evidence.
- **Complete when:** The unsupported relationship is recorded and is not passed to T5 as a valid explanation.

## 4. Planned Tools

### Tool 1

- **Tool name:** compare_movement_with_evidence
- **Input:** Market evidence set and market context evidence set
- **Output:** Qualified movement explanation or unsupported-explanation exception
- **Implementation Route:** Rule-based comparison plus language-model-supported drafting constrained by the evidence records.
- **Integration approach:** Direct function call with approved model service.
- **Role in this task:** Aligns time windows, symbol mappings, and event descriptions; drafts possible-driver language only when evidence supports that qualification.
- **Task timeout:** 20 seconds per watchlist run.
- **Maximum retries:** 0
- **Retry only when:** Not applicable; repeated drafting cannot create missing evidence.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the incomplete comparison and route it to T8. Do not send the draft to T5.

### Tool 2

- **Tool name:** check_explanation_policy
- **Input:** Qualified movement explanation
- **Output:** Approved explanation or unsupported-explanation exception
- **Implementation Route:** Deterministic checks for citations, qualified wording, causal overstatement, and prohibited buy/sell/hold language.
- **Integration approach:** Direct function call within the workflow.
- **Role in this task:** Blocks explanations that claim certainty without authoritative support or contain personalized financial advice.
- **Task timeout:** 5 seconds.
- **Maximum retries:** 0
- **Retry only when:** Not applicable; policy validation is deterministic.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the policy-check failure and route the case to T8.
