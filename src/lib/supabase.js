import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/*
──────────────────────────────────────────────────────────────
  SUPABASE SETUP — run this SQL in Supabase SQL Editor
──────────────────────────────────────────────────────────────

-- Factions table
create table factions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '⚔',
  color text not null default '#888899',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Boxes (sub-categories under a faction)
create table boxes (
  id uuid primary key default gen_random_uuid(),
  faction_id uuid references factions(id) on delete cascade,
  name text not null,
  description text default '',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Miniatures
create table miniatures (
  id uuid primary key default gen_random_uuid(),
  box_id uuid references boxes(id) on delete cascade,
  name text not null,
  unit_type text default '',
  status text not null default 'unpainted' check (status in ('unpainted','wip','done')),
  notes text default '',
  image_url text default null,
  created_at timestamptz default now()
);

-- Storage bucket for miniature images
insert into storage.buckets (id, name, public) values ('miniature-images', 'miniature-images', true);

-- Allow public reads and authenticated uploads on the bucket
create policy "Public read" on storage.objects for select using (bucket_id = 'miniature-images');
create policy "Anyone upload" on storage.objects for insert with check (bucket_id = 'miniature-images');
create policy "Anyone delete" on storage.objects for delete using (bucket_id = 'miniature-images');

-- Enable Row Level Security (open access — add auth later if needed)
alter table factions enable row level security;
alter table boxes enable row level security;
alter table miniatures enable row level security;

create policy "Allow all factions" on factions for all using (true) with check (true);
create policy "Allow all boxes" on boxes for all using (true) with check (true);
create policy "Allow all miniatures" on miniatures for all using (true) with check (true);

──────────────────────────────────────────────────────────────
*/
