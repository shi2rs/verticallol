# IndustryLOL — Tasks

Kiro-style task list. Work top to bottom. Each task has acceptance criteria — don't mark done until all criteria are met.

---

## Phase 1: Foundation

### TASK-001: Supabase Project Setup
**Status:** TODO

**Steps:**
1. Create new Supabase project at supabase.com
2. Note: Project URL and anon key (go into `.env.local`)
3. Run full schema SQL from `design.md` in Supabase SQL editor (in order: enums → tables → RLS policies → view → trigger)
4. Enable Realtime for `reactions` table in Supabase dashboard → Database → Replication
5. Run seed data SQL

**Acceptance Criteria:**
- [ ] All tables exist in Supabase dashboard
- [ ] RLS is enabled on all tables (green shield icon)
- [ ] Seed verticals and themes are present
- [ ] Trigger `on_auth_user_created` exists

---

### TASK-002: React Project Scaffold
**Status:** TODO

**Steps:**
1. `npm create vite@latest industrylol -- --template react-ts`
2. `cd industrylol && npm install`
3. `npm install @supabase/supabase-js`
4. `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
5. `npm install react-router-dom`
6. Create `.env.local`:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
7. Create `src/lib/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   )
   ```
8. Generate TypeScript types from Supabase:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
   ```

**Acceptance Criteria:**
- [ ] `npm run dev` starts without errors
- [ ] `supabase.ts` exports working client
- [ ] `database.types.ts` contains all tables
- [ ] Tailwind working (test with a `bg-red-500` class)

---

### TASK-003: Auth — Signup, Login, Logout
**Status:** TODO

**Relevant requirement:** FR-004

**Steps:**
1. Create `src/hooks/useAuth.ts` — wraps `supabase.auth.getSession()` and `onAuthStateChange`
2. Create `src/components/AuthGuard.tsx` — redirects to `/login` if not authenticated
3. Create login page with email/password + Google OAuth button
4. Create signup page
5. Set up Google OAuth in Supabase dashboard → Authentication → Providers
6. Verify profile auto-creates on signup (check profiles table after test signup)

**Acceptance Criteria:**
- [ ] Can sign up with email
- [ ] Can log in / log out
- [ ] Google OAuth works
- [ ] Profile row created automatically on signup
- [ ] `useAuth` hook returns user + profile correctly

---

### TASK-004: Browse Page — Vertical + Theme Filter
**Status:** TODO

**Relevant requirement:** FR-001, FR-002

**Steps:**
1. Create `src/hooks/useContent.ts` — query `content_items` with optional `vertical_id` and `theme_id` filters, status = 'published' only
2. Create `src/components/FilterBar.tsx` — fetch verticals, on select fetch themes for that vertical, emit filter state up
3. Create `src/components/ContentCard.tsx` — shows title, type badge (color-coded), original song ref if parody, reaction counts
4. Create `src/pages/Browse.tsx` — FilterBar + content grid using ContentCard

**Query pattern:**
```typescript
const { data } = await supabase
  .from('content_items')
  .select(`
    *,
    vertical:verticals(name, slug),
    theme:themes(name, slug),
    contributor:profiles(display_name)
  `)
  .eq('status', 'published')
  .eq('vertical_id', selectedVerticalId)   // optional
  .eq('theme_id', selectedThemeId)          // optional
  .order('published_at', { ascending: false })
```

**Acceptance Criteria:**
- [ ] Browse page loads published content
- [ ] Filtering by vertical shows correct subset
- [ ] Filtering by theme narrows further
- [ ] Clearing filter shows all published content
- [ ] Empty state shown when no results

---

### TASK-005: Content Detail Page
**Status:** TODO

**Relevant requirement:** FR-002, FR-005

**Steps:**
1. Create `src/pages/ContentDetail.tsx` — fetch single item by slug
2. Render full body_text (preserve line breaks for lyrics)
3. Show original song reference if present
4. Embed YouTube iframe if type is youtube_link
5. Include `ReactionBar` component (built in TASK-006)

**Acceptance Criteria:**
- [ ] Page loads via `/content/:slug`
- [ ] Lyrics display with correct line breaks
- [ ] YouTube embeds render for youtube_link type
- [ ] Original song metadata shown for parody_lyrics

---

## Phase 2: Reactions (Realtime)

### TASK-006: Reactions — Static + Realtime
**Status:** TODO

**Relevant requirement:** FR-005

**Steps:**
1. Create `src/hooks/useReactions.ts`:
   - Initial load: query `reaction_counts` view for the content item
   - Subscribe to realtime changes on `reactions` table filtered by `content_item_id`
   - On change event: re-query counts (simpler than incrementing locally)
   - Cleanup subscription on unmount
2. Create `src/components/ReactionBar.tsx`:
   - Show 4 emoji buttons with counts
   - If user is authed: clicking adds/changes reaction (upsert to reactions table)
   - If user has existing reaction of same type: delete it (toggle off)
   - If not authed: clicking prompts login
3. Optimistic update: update count locally immediately, reconcile with server response

**Acceptance Criteria:**
- [ ] Reaction counts visible without login
- [ ] Authenticated user can add reaction
- [ ] Clicking same reaction twice removes it
- [ ] Changing reaction updates (not duplicates)
- [ ] Open same content in two browser tabs — reacting in one updates count in other within 2 seconds

---

## Phase 3: Contributions

### TASK-007: Submit Content Form
**Status:** TODO

**Relevant requirement:** FR-007

**Steps:**
1. Create `src/pages/Submit.tsx` wrapped in `AuthGuard`
2. Form fields:
   - Content type selector (changes which fields appear below)
   - Vertical selector → Theme selector (cascading, same as FilterBar)
   - Title
   - Body text (textarea, shown for parody_lyrics, meme_text, skit_script)
   - Original song title + artist (shown only for parody_lyrics)
   - YouTube URL (shown only for youtube_link, validate URL format)
   - Copyright certification checkbox: "I confirm this is my original work"
3. On submit: insert to `content_items` with `status = 'draft'`, `contributor_id = auth.uid()`
4. Show success state with link to profile to track status

**Acceptance Criteria:**
- [ ] Form shows/hides fields correctly per content type
- [ ] Submission inserts draft row in DB
- [ ] Contributor can see their draft in profile page
- [ ] Copyright checkbox is required (cannot submit without it)
- [ ] YouTube URL validated before submit

---

### TASK-008: Profile Page — My Submissions
**Status:** TODO

**Steps:**
1. Create `src/pages/Profile.tsx` wrapped in `AuthGuard`
2. Show display_name, bio (editable inline)
3. List user's content_items with status badges (draft / published / flagged)
4. Allow editing draft submissions
5. Show reaction history (content I've reacted to) — optional stretch

**Acceptance Criteria:**
- [ ] All user submissions visible with status
- [ ] Can edit draft items
- [ ] Published items shown as read-only

---

## Phase 4: Admin

### TASK-009: Admin Review Queue
**Status:** TODO

**Steps:**
1. Create `src/pages/Admin.tsx` — accessible only if `profile.is_admin = true`
2. List all draft and flagged content items
3. Actions: Publish (set status = 'published', set published_at = now()) | Flag | Delete
4. Set first admin manually in Supabase dashboard: `update profiles set is_admin = true where id = 'YOUR_USER_ID'`

**Acceptance Criteria:**
- [ ] Non-admin users cannot access /admin (redirect)
- [ ] Admin can publish a draft item
- [ ] Published item immediately appears on Browse page
- [ ] Admin can flag content (removes from public browse)

---

### TASK-010: Collections
**Status:** TODO

**Relevant requirement:** FR-006

**Steps:**
1. Admin can create collections and add published content items to them
2. Create `src/pages/Collection.tsx` — public view of a collection
3. Collections page lists all public collections

**Acceptance Criteria:**
- [ ] Admin can create collection and add items
- [ ] Public collection page renders ordered items
- [ ] Collections browsable from nav

---

## Stretch / Future Tasks (not for V1)

- TASK-011: Search (full-text search on title + body_text using Postgres `to_tsvector`)
- TASK-012: Supabase Storage for user-uploaded images (meme images)
- TASK-013: Lovable deployment configuration
- TASK-014: AI-assisted parody generation (Claude API integration)
- TASK-015: Monetization — company licensing flow

---

## Notes for Claude (VS Code Extension)

When picking up this project:
1. Read `requirements.md` for WHY decisions were made
2. Read `design.md` for the full schema and RLS policies
3. Work tasks in order — later tasks depend on earlier ones
4. Never bypass RLS by using service role key on frontend
5. All DB queries go through `src/lib/supabase.ts` client — no direct fetch calls to Supabase REST
6. Keep TypeScript strict — use generated types from `database.types.ts`
7. Realtime subscriptions must be cleaned up on component unmount
