# StockBrief

StockBrief is a BUS 4498 classroom prototype for monitoring a student's stock watchlist without making personalized financial recommendations or trades.

## Current feature group

The first feature group is a static, policy-safe dashboard. It works without credentials in demo mode and demonstrates:

- watchlist entry and local-session configuration;
- bounded demo observations with freshness/source labels;
- a pause switch that blocks new runs;
- duplicate-safe demo run IDs; and
- a human-review packet when evidence does not support a causal explanation.

The demo is intentionally not presented as live market data or a connected AI agent.

## Local preview

From the `our_team_agent/` folder, run any static file server, for example:

```powershell
py -m http.server 4173
```

Then open <http://127.0.0.1:4173/>. If Python is unavailable, use another static server; opening `index.html` directly is sufficient for the demo but may hide browser console warnings.

## Configuration boundary

`config.example.js` documents the safe browser configuration. Copy it to `config.js` only after the team has the shared Supabase publishable key. `config.js` is intentionally not included in the repository yet. Provider keys and AI keys belong in Supabase Secrets, never in this folder.

Live market retrieval, model inference, authenticated persistence, scheduled runs, and email delivery remain separate integration groups.
