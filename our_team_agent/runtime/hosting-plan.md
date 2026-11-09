# Hosting plan

Written in plain words with the BUS 4498 Agent Builder Kit. Our AI assistant turns it into a GitHub Pages website and a Supabase backend, following `runtime/hosting-rules.md`. Where this plan and our task specifications disagree, this plan wins.

## Our project

- GitHub repository: https://github.com/mbuddhal/BUS4498_Team_Build
- Our agent’s folder: `our_team_agent` (our plans are in `our_team_agent/runtime/`)
- Supabase project: https://iwrgkcgqdfcbzjzrfmpp.supabase.co
- Owner of the repository and the Supabase project: Manu Buddhala and Zoe Lee
- Teammate: Manu Buddhala, a collaborator on GitHub and a Developer in the Supabase organization
- We say “I’m working on it” and “pushed” in: Our team GroupMe chat. One of us works at a time.

## What our agent does

StockBrief monitors each user’s saved stock watchlist, retrieves current market data and source-backed context, explains movement cautiously, suggests neutral topics to monitor, and sends a concise briefing without providing personalized financial advice or making trades.

## Our tasks

Use the tasks in our task specifications: `our_team_agent/agent/workflow-of-tasks.md` and `our_team_agent/agent/task-specs/`.

## Who can see or change what

Each user can view and change only their own watchlist and briefing history. StockBrief can read the approved market and context sources, but it cannot access another user’s private watchlist or recipient email. The designated reviewer can see exception packets and approve or reject qualified wording; the agent never approves its own exception. Only the validated recipient receives a briefing email.

## External tools and applications

| # | Tool or application | What the agent uses it for | What it does with it | Most sensitive data it touches | How it connects |
|---|---|---|---|---|---|
| 1 | Market data API | Reads current price, comparison price, percentage change, market status, currency, and observation timestamps for each saved symbol. | Reads from it | Public | An API key (in Supabase Secrets) |
| 2 | Approved market context sources | Reads company news, earnings, official guidance, sector or index movement, and broad market events with source and time metadata. | Reads from it | Public | An API key (in Supabase Secrets) |
| 3 | Email delivery provider | Sends the completed briefing only to the validated recipient and returns a provider delivery or accepted status. | Sends with it | Confidential | An API key (in Supabase Secrets) |

## Files people upload

No file uploads planned; users enter structured watchlist symbols and recipient email in the app.
