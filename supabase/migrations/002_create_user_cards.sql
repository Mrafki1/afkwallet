-- PointsBinder: User card tracking table
-- Run this in your Supabase dashboard → SQL Editor

create table if not exists public.user_cards (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users (id) on delete cascade,

  -- Card reference (card_id links to public.cards, but is nullable in case of free-text entry)
  card_id          text,
  card_name        text        not null,

  -- Application details
  apply_date       date        not null,

  -- MSR tracking
  msr_amount       integer     not null default 0,   -- spend required ($)
  msr_spent        integer     not null default 0,   -- spend logged ($)
  msr_deadline     date,

  -- Fee tracking
  annual_fee_date  date,

  -- Notes
  notes            text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Auto-update updated_at
drop trigger if exists user_cards_updated_at on public.user_cards;
create trigger user_cards_updated_at
  before update on public.user_cards
  for each row execute function public.set_updated_at();

-- Enable RLS — users can only see/modify their own cards
alter table public.user_cards enable row level security;

drop policy if exists "Users manage own cards" on public.user_cards;
create policy "Users manage own cards"
  on public.user_cards
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for per-user queries
create index if not exists user_cards_user_id_idx on public.user_cards (user_id);
