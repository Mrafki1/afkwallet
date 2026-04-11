create table if not exists card_changes (
  id          bigint generated always as identity primary key,
  card_id     text not null,
  field       text not null,
  old_value   text,
  new_value   text,
  recorded_at date not null default current_date,
  note        text
);

create index if not exists card_changes_card_id_idx  on card_changes (card_id);
create index if not exists card_changes_recorded_idx on card_changes (recorded_at desc);

alter table card_changes enable row level security;
create policy "public read" on card_changes for select using (true);
