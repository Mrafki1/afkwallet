-- PointsBinder: Cards table
-- Run this once in your Supabase dashboard → SQL Editor

create table if not exists public.cards (
  -- Core identity
  id                text        primary key,
  name              text        not null,
  issuer            text        not null,

  -- Fees & value
  annual_fee        text        not null default '$0',
  annual_fee_num    integer     not null default 0,
  first_year_value  text        not null default '$0',
  points_bonus      text        not null default '',
  msr               text        not null default '$0',

  -- Apply links
  portals           jsonb       not null default '[]',
  direct_link       text        not null default '',
  ccg_slug          text,       -- CCG URL slug for re-scraping (e.g. "american-express-cobalt")

  -- Rewards program
  program           text        not null default '',
  tags              text[]      not null default '{}',
  rewards           jsonb       not null default '[]',
  transfer_partners text[]      not null default '{}',
  points_value      text,

  -- Card details
  network           text,       -- 'Visa' | 'Mastercard' | 'American Express'
  foreign_fee       text,
  income_req        text,
  insurance         text[]      not null default '{}',
  lounge_details    text,
  perks             text[]      not null default '{}',
  welcome_milestones jsonb      not null default '[]',

  -- Offer state
  elevated          boolean     not null default false,
  elevated_note     text,
  featured          boolean     not null default false,

  -- Display
  image             text        not null default '/cards/placeholder.png',
  gradient          text        not null default 'from-slate-600 to-slate-900',

  -- Metadata
  source            text        not null default 'manual',   -- 'manual' | 'ccg_scrape'
  status            text        not null default 'published', -- 'published' | 'pending' | 'archived'
  last_verified     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cards_updated_at on public.cards;
create trigger cards_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

-- Enable RLS — allow public read, service-role write
alter table public.cards enable row level security;

drop policy if exists "Public read published cards" on public.cards;
create policy "Public read published cards"
  on public.cards for select
  using (status = 'published');

-- Index for common queries
create index if not exists cards_issuer_idx  on public.cards (issuer);
create index if not exists cards_program_idx on public.cards (program);
create index if not exists cards_status_idx  on public.cards (status);
create index if not exists cards_source_idx  on public.cards (source);
