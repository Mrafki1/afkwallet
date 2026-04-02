-- PointsBinder: Bonus history table
-- Tracks welcome bonus changes over time so users can see historical highs/lows

create table if not exists public.bonus_history (
  id           uuid        primary key default gen_random_uuid(),
  card_id      text        not null references public.cards (id) on delete cascade,
  points_bonus text        not null,
  recorded_at  date        not null default current_date,
  note         text,                        -- e.g. "Elevated offer", "Standard offer restored"
  created_at   timestamptz not null default now()
);

-- One entry per card per day (upsert key)
create unique index if not exists bonus_history_card_date_idx
  on public.bonus_history (card_id, recorded_at);

-- Fast lookups by card
create index if not exists bonus_history_card_id_idx
  on public.bonus_history (card_id);

-- Public read access (no auth required to view history)
alter table public.bonus_history enable row level security;

drop policy if exists "Anyone can read bonus history" on public.bonus_history;
create policy "Anyone can read bonus history"
  on public.bonus_history
  for select using (true);

-- Only service role can write (scraper uses service role key)
