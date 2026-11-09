-- StockBrief private workflow state.
-- Apply with Supabase CLI or the SQL editor in the shared team project.

create extension if not exists pgcrypto;

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbols text[] not null check (cardinality(symbols) between 1 and 20),
  recipient_email text not null,
  schedule text not null default 'manual' check (schedule in ('open', 'close', 'manual')),
  is_active boolean not null default true,
  paused boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists watchlists_one_active_per_user
  on public.watchlists(user_id) where is_active;

create table if not exists public.market_evidence (
  id uuid primary key default gen_random_uuid(),
  run_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  price numeric not null,
  comparison_price numeric not null,
  percent_change numeric not null,
  market_status text not null,
  currency text not null,
  observed_at timestamptz not null,
  source_name text not null,
  source_url text not null,
  freshness_seconds integer not null check (freshness_seconds >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.context_evidence (
  id uuid primary key default gen_random_uuid(),
  run_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  claim text not null,
  source_name text not null,
  source_url text not null,
  published_at timestamptz,
  retrieved_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.briefing_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watchlist_id uuid references public.watchlists(id) on delete set null,
  idempotency_key text not null,
  status text not null check (status in ('running', 'completed', 'failed', 'held_for_review')),
  model_id text,
  output jsonb,
  error_code text,
  delivery_status text not null default 'not_sent' check (delivery_status in ('not_sent', 'queued', 'accepted', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, idempotency_key)
);

create table if not exists public.review_packets (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.briefing_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  question text not null,
  evidence jsonb not null default '[]'::jsonb,
  decision text not null default 'pending' check (decision in ('pending', 'approved', 'rejected')),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  lesson text not null,
  source_run_id uuid references public.briefing_runs(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  switched_off_at timestamptz
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists watchlists_set_updated_at on public.watchlists;
create trigger watchlists_set_updated_at
before update on public.watchlists
for each row execute function public.set_updated_at();

alter table public.watchlists enable row level security;
alter table public.market_evidence enable row level security;
alter table public.context_evidence enable row level security;
alter table public.briefing_runs enable row level security;
alter table public.review_packets enable row level security;
alter table public.lessons enable row level security;

drop policy if exists watchlists_owner on public.watchlists;
create policy watchlists_owner on public.watchlists
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists market_evidence_owner on public.market_evidence;
create policy market_evidence_owner on public.market_evidence
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists context_evidence_owner on public.context_evidence;
create policy context_evidence_owner on public.context_evidence
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists briefing_runs_owner on public.briefing_runs;
create policy briefing_runs_owner on public.briefing_runs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists review_packets_owner on public.review_packets;
create policy review_packets_owner on public.review_packets
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists lessons_owner on public.lessons;
create policy lessons_owner on public.lessons
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
