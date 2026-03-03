-- ============================================================
-- VerticalLOL — Initial Schema
-- ============================================================

-- ─── Enums ───────────────────────────────────────────────────

create type content_status as enum ('draft', 'published', 'flagged');
create type reaction_type  as enum ('laugh', 'fire', 'too_real', 'clap');


-- ─── Tables (in dependency order) ───────────────────────────

create table verticals (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  name        text        not null,
  description text,
  icon        text,
  created_at  timestamptz default now()
);

create table profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  display_name text        not null,
  bio          text,
  is_admin     boolean     not null default false,
  created_at   timestamptz default now()
);

create table themes (
  id          uuid        primary key default gen_random_uuid(),
  vertical_id uuid        not null references verticals(id) on delete cascade,
  slug        text        not null,
  name        text        not null,
  description text,
  created_at  timestamptz default now(),
  unique(vertical_id, slug)
);

create table collections (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text,
  slug        text        not null unique,
  created_by  uuid        not null references auth.users(id),
  is_public   boolean     not null default true,
  created_at  timestamptz default now()
);

create table content_items (
  id                   uuid           primary key default gen_random_uuid(),
  vertical_id          uuid           not null references verticals(id),
  theme_id             uuid           not null references themes(id),
  contributor_id       uuid           not null references auth.users(id),
  type                 text           not null check (type in (
                                        'parody_lyrics',
                                        'meme_text',
                                        'skit_script',
                                        'youtube_link',
                                        'image_meme',
                                        'gif'
                                      )),
  status               content_status not null default 'draft',
  title                text           not null,
  body_text            text,           -- lyrics, meme caption, skit script
  media_url            text,           -- YouTube, Giphy, or other external URLs
  storage_path         text,           -- Supabase Storage path for uploaded files
  original_song_title  text,           -- parody_lyrics only
  original_song_artist text,           -- parody_lyrics only
  slug                 text           unique,
  created_at           timestamptz    default now(),
  updated_at           timestamptz    default now(),
  published_at         timestamptz
);

create table reactions (
  id              uuid          primary key default gen_random_uuid(),
  content_item_id uuid          not null references content_items(id) on delete cascade,
  user_id         uuid          not null references auth.users(id) on delete cascade,
  type            reaction_type not null,
  created_at      timestamptz   default now(),
  unique(content_item_id, user_id)  -- one reaction per user per item
);

create table comments (
  id              uuid        primary key default gen_random_uuid(),
  content_item_id uuid        not null references content_items(id) on delete cascade,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  body            text        not null,
  created_at      timestamptz default now()
);

create table flags (
  id              uuid        primary key default gen_random_uuid(),
  content_item_id uuid        not null references content_items(id) on delete cascade,
  reported_by     uuid        not null references auth.users(id),
  reason          text        not null,
  created_at      timestamptz default now(),
  unique(content_item_id, reported_by)
);

create table collection_items (
  id              uuid    primary key default gen_random_uuid(),
  collection_id   uuid    not null references collections(id) on delete cascade,
  content_item_id uuid    not null references content_items(id) on delete cascade,
  position        integer not null,
  unique(collection_id, content_item_id)
);


-- ─── View ────────────────────────────────────────────────────

create view reaction_counts as
  select
    content_item_id,
    type,
    count(*) as count
  from reactions
  group by content_item_id, type;


-- ─── Auto-create profile on signup ───────────────────────────

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ─── Row Level Security ───────────────────────────────────────

alter table verticals       enable row level security;
alter table themes          enable row level security;
alter table profiles        enable row level security;
alter table content_items   enable row level security;
alter table reactions       enable row level security;
alter table comments        enable row level security;
alter table flags           enable row level security;
alter table collections     enable row level security;
alter table collection_items enable row level security;

-- verticals
create policy "Public read verticals" on verticals
  for select using (true);
create policy "Admin insert verticals" on verticals
  for insert with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- themes
create policy "Public read themes" on themes
  for select using (true);
create policy "Admin insert themes" on themes
  for insert with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- profiles
create policy "Public read profiles" on profiles
  for select using (true);
create policy "User insert own profile" on profiles
  for insert with check (id = auth.uid());
create policy "User update own profile" on profiles
  for update using (id = auth.uid());

-- content_items
create policy "Public read published" on content_items
  for select using (status = 'published');
create policy "Contributor read own" on content_items
  for select using (contributor_id = auth.uid());
create policy "Authenticated insert" on content_items
  for insert with check (auth.uid() is not null and contributor_id = auth.uid() and status = 'draft');
create policy "Contributor update own draft" on content_items
  for update using (contributor_id = auth.uid() and status = 'draft');
create policy "Admin update status" on content_items
  for update using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- reactions
create policy "Public read reactions" on reactions
  for select using (true);
create policy "Auth insert reaction" on reactions
  for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy "User update own reaction" on reactions
  for update using (user_id = auth.uid());
create policy "User delete own reaction" on reactions
  for delete using (user_id = auth.uid());

-- comments
create policy "Public read comments" on comments
  for select using (true);
create policy "Auth insert comment" on comments
  for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy "User delete own comment" on comments
  for delete using (user_id = auth.uid());
create policy "Admin delete any comment" on comments
  for delete using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- flags
create policy "Admin read flags" on flags
  for select using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "Auth insert flag" on flags
  for insert with check (auth.uid() is not null and reported_by = auth.uid());
create policy "Admin delete flag" on flags
  for delete using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- collections
create policy "Public read public collections" on collections
  for select using (is_public = true);
create policy "Owner read own collections" on collections
  for select using (created_by = auth.uid());
create policy "Admin insert collection" on collections
  for insert with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "Owner update own collection" on collections
  for update using (created_by = auth.uid());
create policy "Admin delete collection" on collections
  for delete using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- collection_items
create policy "Read collection_items if collection visible" on collection_items
  for select using (
    exists (
      select 1 from collections c
      where c.id = collection_id
        and (c.is_public = true or c.created_by = auth.uid())
    )
  );
create policy "Owner insert collection_item" on collection_items
  for insert with check (
    exists (select 1 from collections where id = collection_id and created_by = auth.uid())
  );
create policy "Owner delete collection_item" on collection_items
  for delete using (
    exists (select 1 from collections where id = collection_id and created_by = auth.uid())
  );


-- ─── Realtime ────────────────────────────────────────────────

alter publication supabase_realtime add table reactions;
