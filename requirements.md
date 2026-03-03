# IndustryLOL — Requirements

## Overview
A vertical humor content platform where industry-specific song parodies, memes, and skits are organized by industry vertical + theme. Contributors submit text-based content (lyrics, scripts, memes), community reacts, and companies eventually license curated collections for internal events.

## Problem Statement
Corporate events (all-hands, offsites, talent showcases) need relatable, insider humor. Generic content falls flat. Industry-specific parodies of famous songs — dealing with legacy code, compliance nightmares, sprint planning hell — resonate deeply because they capture shared pain. There is no curated platform for this content.

## Target Users
1. **Consumers** — employees who browse and react to content for personal enjoyment or to share internally
2. **Contributors** — creative employees/enthusiasts who write parody lyrics, memes, scripts
3. **Corporate buyers (future)** — L&D managers, culture teams sourcing content for events
4. **Students/schools (future)** — teachers finding educational parody content

## Functional Requirements

### FR-001: Content Taxonomy
- Platform organizes content by **vertical** (e.g. software, finance, pharma, education) and **theme** (e.g. legacy code, deadlines, standups, compliance)
- Taxonomy is hierarchical: vertical → theme → content items
- Users can filter by vertical, by theme, or by vertical+theme combination
- Search across titles and body text

### FR-002: Content Types (V1)
- `parody_lyrics` — full or partial parody lyrics with original song reference metadata (title, artist — NOT the original lyrics)
- `meme_text` — text-based meme (setup + punchline or image macro text)
- `skit_script` — short script for performance
- `youtube_link` — link to a community performance on YouTube (no hosted video in V1)

### FR-003: Content Lifecycle
- Contributors submit content in **draft** status
- Admin reviews and publishes or flags
- Published content is publicly visible (no auth required to browse)
- Contributors can edit their own drafts
- Contributors cannot edit published content (submit correction request instead)

### FR-004: Authentication
- Email + password signup
- Google OAuth
- Display name + optional bio on profile
- No real name required

### FR-005: Reactions
- Authenticated users can react to published content
- Reaction types: 😂 (laugh), 🔥 (fire), 💀 (too real), 👏 (clap)
- One reaction per user per content item (can change reaction)
- Reaction counts visible to all (no auth required)
- Counts update in real-time via Supabase subscriptions

### FR-006: Collections (V1 — admin only)
- Admins can create named collections (e.g. "Best for All-Hands 2025", "Legacy Code Greatest Hits")
- Collections contain ordered content items
- Collections are publicly browsable

### FR-007: Contributions
- Authenticated users can submit content via a form
- Form captures: title, vertical, theme, content type, body text, original song reference (for parody_lyrics), youtube_url (for youtube_link type)
- Contributor sees their submissions and status (draft/published/flagged)

## Non-Functional Requirements

### NFR-001: Copyright Safety
- Platform stores ONLY original parody text, never original song lyrics
- Original song reference is metadata only (title + artist name)
- YouTube links point to user-uploaded performances — platform bears no hosting liability
- Terms of service must require contributors to certify originality

### NFR-002: Security
- Row Level Security (RLS) enabled on all Supabase tables from day one
- No sensitive data stored beyond email (handled by Supabase Auth)
- Content flagging mechanism for community reporting

### NFR-003: Performance
- Browse and filter must feel instant (< 200ms for filtered queries)
- Real-time reaction updates should not block page interaction

### NFR-004: Stack
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime)
- **Frontend**: React + TypeScript, deployable to Lovable
- **Styling**: Tailwind CSS
- **No custom backend server in V1** — all logic via Supabase client + Edge Functions if needed

## Out of Scope for V1
- Audio/video hosting (copyright risk + complexity)
- Monetization / payments
- Direct messaging between users
- Mobile app
- School-specific features
- AI content generation (future phase)
