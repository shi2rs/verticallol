# IndustryLOL — Design

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           React + TypeScript            │
│           (Lovable / Vite)              │
│                                         │
│  Pages: Browse | Detail | Submit |      │
│         Profile | Admin | Collections   │
└──────────────────┬──────────────────────┘
                   │ supabase-js client
┌──────────────────▼──────────────────────┐
│              Supabase                   │
│                                         │
│  Auth    Postgres    Storage  Realtime  │
│  (JWT)   (RLS)       (future) (ws)      │
└─────────────────────────────────────────┘
```

No custom API server. All data access via Supabase client with RLS enforcing permissions.

---

## Database Schema

### Table: verticals
```sql
create table verticals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,          -- 'software', 'finance'
  name text not null,                 -- 'Software Engineering'
  description text,
  icon text,                          -- emoji or icon name
  created_at timestamptz default now()
);
```

### Table: themes
```sql
create table themes (
  id uuid primary key default gen_random_uuid(),
  vertical_id uuid not null references verticals(id) on delete cascade,
  slug text not null,                 -- 'legacy-code'
  name text not null,                 -- 'Legacy Code'
  description text,
  created_at timestamptz default now(),
  unique(vertical_id, slug)
);
```

### Table: content_items

Content type rules:
| type           | body_text        | media_url          | storage_path       | original_song_* |
|----------------|------------------|--------------------|--------------------|-----------------|
| parody_lyrics  | lyrics text      | —                  | —                  | required        |
| meme_text      | meme caption     | —                  | —                  | —               |
| skit_script    | script text      | —                  | —                  | —               |
| youtube_link   | optional notes   | YouTube URL        | —                  | optional        |
| image_meme     | optional caption | —                  | Supabase Storage   | —               |
| gif            | optional caption | Giphy/external URL | or Supabase Storage| —               |

```sql
create type content_status as enum ('draft', 'published', 'flagged');

create table content_items (
  id                   uuid primary key default gen_random_uuid(),
  vertical_id          uuid not null references verticals(id),
  theme_id             uuid not null references themes(id),
  contributor_id       uuid not null references auth.users(id),
  type                 text not null check (type in (
                         'parody_lyrics', 'meme_text', 'skit_script',
                         'youtube_link', 'image_meme', 'gif'
                       )),
  status               content_status not null default 'draft',
  title                text not null,
  body_text            text,           -- lyrics, meme caption, skit script
  media_url            text,           -- YouTube, Giphy, or other external URLs
  storage_path         text,           -- Supabase Storage path for uploaded files
  original_song_title  text,           -- parody_lyrics only
  original_song_artist text,           -- parody_lyrics only
  slug                 text unique,    -- SEO-friendly URL
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  published_at         timestamptz
);
```

### Table: profiles
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  is_admin boolean not null default false,
  created_at timestamptz default now()
);
```

### Table: reactions

Emoji mapping (UI ↔ DB):
| DB enum    | Emoji | UI label  |
|------------|-------|-----------|
| laugh      | 😂    | Laugh     |
| fire       | 🔥    | Fire      |
| too_real   | 🙏    | Relatable |
| clap       | 👏    | Clap      |

Note: only one reaction per user per content item (unique constraint).

```sql
create type reaction_type as enum ('laugh', 'fire', 'too_real', 'clap');

create table reactions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type reaction_type not null,
  created_at timestamptz default now(),
  unique(content_item_id, user_id)    -- one reaction per user per item
);
```

### Table: collections
```sql
create table collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  slug text not null unique,
  created_by uuid not null references auth.users(id),
  is_public boolean not null default true,
  created_at timestamptz default now()
);

create table collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  content_item_id uuid not null references content_items(id) on delete cascade,
  position integer not null,
  unique(collection_id, content_item_id)
);
```

### Table: flags
```sql
create table flags (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  reported_by uuid not null references auth.users(id),
  reason text not null,
  created_at timestamptz default now(),
  unique(content_item_id, reported_by)
);
```

### Table: comments
```sql
create table comments (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);
```

---

## Row Level Security Policies

### verticals & themes — public read, admin write
```sql
alter table verticals enable row level security;
create policy "Public read verticals" on verticals for select using (true);
create policy "Admin insert verticals" on verticals for insert
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

alter table themes enable row level security;
create policy "Public read themes" on themes for select using (true);
create policy "Admin insert themes" on themes for insert
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
```

### content_items — public read published, contributor owns draft
```sql
alter table content_items enable row level security;

-- Anyone can read published content
create policy "Public read published" on content_items
  for select using (status = 'published');

-- Contributors can read their own content (any status)
create policy "Contributor read own" on content_items
  for select using (contributor_id = auth.uid());

-- Authenticated users can insert (creates as draft)
create policy "Authenticated insert" on content_items
  for insert with check (auth.uid() is not null and contributor_id = auth.uid() and status = 'draft');

-- Contributors can update their own drafts only
create policy "Contributor update own draft" on content_items
  for update using (contributor_id = auth.uid() and status = 'draft');

-- Admins can update status
create policy "Admin update status" on content_items
  for update using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
```

### reactions — public read counts, auth to react
```sql
alter table reactions enable row level security;
create policy "Public read reactions" on reactions for select using (true);
create policy "Auth insert reaction" on reactions
  for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy "User update own reaction" on reactions
  for update using (user_id = auth.uid());
create policy "User delete own reaction" on reactions
  for delete using (user_id = auth.uid());
```

### profiles — public read, own write
```sql
alter table profiles enable row level security;
create policy "Public read profiles" on profiles for select using (true);
create policy "User insert own profile" on profiles
  for insert with check (id = auth.uid());
create policy "User update own profile" on profiles
  for update using (id = auth.uid());
```

### flags — auth to flag, admin to manage
```sql
alter table flags enable row level security;
create policy "Admin read flags" on flags
  for select using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "Auth insert flag" on flags
  for insert with check (auth.uid() is not null and reported_by = auth.uid());
create policy "Admin delete flag" on flags
  for delete using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
```

### comments — public read, auth to write
```sql
alter table comments enable row level security;
create policy "Public read comments" on comments for select using (true);
create policy "Auth insert comment" on comments
  for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy "User delete own comment" on comments
  for delete using (user_id = auth.uid());
create policy "Admin delete any comment" on comments
  for delete using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
```

### collections — public read public, owner manages own, admin manages all
```sql
alter table collections enable row level security;

-- Anyone can read public collections
create policy "Public read public collections" on collections
  for select using (is_public = true);

-- Owners can read their own private collections
create policy "Owner read own collections" on collections
  for select using (created_by = auth.uid());

-- Admins can insert collections
create policy "Admin insert collection" on collections
  for insert with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Owners can update their own collections
create policy "Owner update own collection" on collections
  for update using (created_by = auth.uid());

-- Admins can delete any collection
create policy "Admin delete collection" on collections
  for delete using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
```

### collection_items — inherits visibility from parent collection
```sql
alter table collection_items enable row level security;

-- Readable if the parent collection is public, or user owns it
create policy "Read collection_items if collection visible" on collection_items
  for select using (
    exists (
      select 1 from collections c
      where c.id = collection_id
        and (c.is_public = true or c.created_by = auth.uid())
    )
  );

-- Only collection owner can add/remove items
create policy "Owner insert collection_item" on collection_items
  for insert with check (
    exists (select 1 from collections where id = collection_id and created_by = auth.uid())
  );

create policy "Owner delete collection_item" on collection_items
  for delete using (
    exists (select 1 from collections where id = collection_id and created_by = auth.uid())
  );
```

---

## Reaction Count View (denormalized for performance)
```sql
create view reaction_counts as
  select
    content_item_id,
    type,
    count(*) as count
  from reactions
  group by content_item_id, type;
```

---

## Supabase Realtime
Enable realtime on the `reactions` table only:
```sql
alter publication supabase_realtime add table reactions;
```

Frontend subscribes to reaction changes per content item:
```typescript
supabase
  .channel(`reactions:${contentItemId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'reactions',
    filter: `content_item_id=eq.${contentItemId}`
  }, handleReactionUpdate)
  .subscribe()
```

---

## Auto-create Profile on Signup
```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

---

## Frontend Component Map

```
src/
├── pages/
│   ├── Browse.tsx          — vertical/theme filter + content grid
│   ├── ContentDetail.tsx   — single content item + reactions
│   ├── Submit.tsx          — contribution form (auth required)
│   ├── Profile.tsx         — user's submissions + reaction history
│   ├── Collection.tsx      — curated collection view
│   └── Admin.tsx           — review queue (admin only)
├── components/
│   ├── ContentCard.tsx     — card with title, type badge, reaction counts
│   ├── ReactionBar.tsx     — emoji reaction buttons with live counts
│   ├── FilterBar.tsx       — vertical + theme filter UI
│   ├── SubmitForm.tsx      — dynamic form based on content type
│   └── AuthGuard.tsx       — wrapper for protected routes
├── hooks/
│   ├── useReactions.ts     — realtime reaction subscription
│   ├── useContent.ts       — filtered content queries
│   └── useAuth.ts          — auth state + profile
├── lib/
│   ├── supabase.ts         — supabase client init
│   └── types.ts            — TypeScript types from DB schema
└── App.tsx
```

---

## Seed Data (run after schema)

```sql
-- Verticals
insert into verticals (slug, name, icon) values
  ('software', 'Software Engineering', '💻'),
  ('finance', 'Finance & Banking', '💰'),
  ('pharma', 'Pharma & Healthcare', '💊'),
  ('education', 'Education', '📚');

-- Themes under Software
insert into themes (vertical_id, slug, name)
select id, 'legacy-code', 'Legacy Code' from verticals where slug = 'software';
insert into themes (vertical_id, slug, name)
select id, 'deadlines', 'Deadlines & Crunch' from verticals where slug = 'software';
insert into themes (vertical_id, slug, name)
select id, 'standups', 'Daily Standups' from verticals where slug = 'software';
insert into themes (vertical_id, slug, name)
select id, 'production-bugs', 'Production Bugs' from verticals where slug = 'software';
```
