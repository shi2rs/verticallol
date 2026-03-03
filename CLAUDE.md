# VerticalLol — Project Steering

## What this project is
A vertical humor content platform. Industry-specific song parodies, memes, and skits organized by vertical (e.g. software engineering) and theme (e.g. legacy code). Text-based content only in V1 — no audio/video hosting for copyright safety.

## Stack
- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Backend**: Supabase only (Postgres + Auth + Realtime)
- **Deployment**: Lovable
- **No custom API server**

## How to navigate this project

| I want to understand... | Read... |
|---|---|
| Why we built it this way | `.kiro/specs/industrylol/requirements.md` |
| Database schema + RLS policies | `.kiro/specs/industrylol/design.md` |
| What to build next | `.kiro/specs/industrylol/tasks.md` |

## Non-negotiable principles
1. **RLS is always on** — never use service role key on frontend, never disable RLS to "just make it work"
2. **Type safety** — always use generated types from `src/lib/database.types.ts`
3. **Copyright safety** — platform never stores original song lyrics, only parody text
4. **Taxonomy not tags** — content is organized by vertical → theme hierarchy, not free-form tags

## Current status
Schema designed, not yet implemented. Start with TASK-001 in tasks.md.

## Owner
Shishir — senior technology leader running this as a learning project for Supabase + Lovable stack.
