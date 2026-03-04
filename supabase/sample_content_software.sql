-- ============================================================
-- VerticalLOL — 10 Sample Software Engineering Memes
-- Run this in the Supabase SQL Editor AFTER:
--   1. Running migrations (npx supabase db push)
--   2. Signing up at least one user in the app
-- ============================================================
-- Uses the first user in the system as contributor.
-- All items are set to 'published' so they show on the feed.
-- ============================================================

do $$
declare
  v_software_id   uuid;
  v_legacy_id     uuid;
  v_deadlines_id  uuid;
  v_standups_id   uuid;
  v_prod_bugs_id  uuid;
  v_code_rev_id   uuid;
  v_meetings_id   uuid;
  v_sprint_id     uuid;
  v_contributor   uuid;
begin

  -- Look up IDs
  select id into v_software_id  from verticals where slug = 'software';
  select id into v_legacy_id    from themes    where slug = 'legacy-code';
  select id into v_deadlines_id from themes    where slug = 'deadlines';
  select id into v_standups_id  from themes    where slug = 'standups';
  select id into v_prod_bugs_id from themes    where slug = 'production-bugs';
  select id into v_code_rev_id  from themes    where slug = 'code-reviews';
  select id into v_meetings_id  from themes    where slug = 'meetings';
  select id into v_sprint_id    from themes    where slug = 'sprint-planning';
  select id into v_contributor  from auth.users limit 1;

  insert into content_items
    (vertical_id, theme_id, contributor_id, type, title, body_text, status, published_at)
  values

  -- 1. Legacy Code
  (v_software_id, v_legacy_id, v_contributor, 'meme_text',
   'The 5 stages of reading legacy code',
   E'1. Denial — "This can''t be production code"\n2. Anger — "WHO WROTE THIS??"\n3. Bargaining — "Maybe if I just add one more if statement..."\n4. Depression — "git blame says... it was me. 3 years ago."\n5. Acceptance — "Touch nothing. Ship it."',
   'published', now()),

  -- 2. Legacy Code
  (v_software_id, v_legacy_id, v_contributor, 'meme_text',
   'Comment found in 8-year-old codebase',
   E'// I have no idea why this works.\n// Do not touch.\n// Seriously.\n// I''m watching you.\n\nmagicNumber = 42 * offset / 0.0001337;',
   'published', now()),

  -- 3. Production Bugs
  (v_software_id, v_prod_bugs_id, v_contributor, 'meme_text',
   'The on-call experience in 4 acts',
   E'Act 1 — 3am: PagerDuty fires\nAct 2 — You: "It works on my machine"\nAct 3 — Users: "It works on no machine"\nAct 4 — Fix: restart the server\n\nRCA: "Investigated and resolved"',
   'published', now()),

  -- 4. Production Bugs
  (v_software_id, v_prod_bugs_id, v_contributor, 'meme_text',
   'Incident severity levels (honest edition)',
   E'P0 — CEO can''t log in\nP1 — Sales can''t log in\nP2 — Everyone can''t log in\nP3 — Engineering noticed something weird\nP4 — A user emailed support\nP5 — Engineering filed a ticket nobody will read',
   'published', now()),

  -- 5. Daily Standups
  (v_software_id, v_standups_id, v_contributor, 'meme_text',
   'Standup bingo (free space: "no blockers")',
   E'"Yesterday I worked on... the thing from last week."\n"Today I''ll continue... the thing from last week."\n"No blockers... except the thing blocking me since last week."\n\nSM: "Great, thanks! Anyone else?"\nEveryone: *mutes*',
   'published', now()),

  -- 6. Daily Standups
  (v_software_id, v_standups_id, v_contributor, 'meme_text',
   'How standups feel after year 3',
   E'What I say: "Working on the auth refactor, should be done EOD."\n\nWhat I mean: "I have been staring at this OAuth callback for 11 hours and I think it hates me personally."',
   'published', now()),

  -- 7. Code Reviews
  (v_software_id, v_code_rev_id, v_contributor, 'meme_text',
   'Code review feedback translator',
   E'"Nit:" → I will die on this hill\n"Curious why..." → This is wrong\n"Have you considered..." → Do it my way\n"LGTM" → I opened the file and scrolled\n"Looks good, just one thing" → 47 comments incoming',
   'published', now()),

  -- 8. Code Reviews
  (v_software_id, v_code_rev_id, v_contributor, 'meme_text',
   'The PR description lifecycle',
   E'Small PR: "Fix button color"\nActual diff: 847 files changed\n\nLarge PR: 14 paragraphs of architectural context\nActual diff: deleted a console.log\n\nPerfect PR: Does not exist',
   'published', now()),

  -- 9. Deadlines
  (v_software_id, v_deadlines_id, v_contributor, 'meme_text',
   'Sprint velocity explained to non-engineers',
   E'Week 1: "We''re on track!"\nWeek 2: "Still on track, minor adjustments"\nWeek 3: "Redefining what done means"\nWeek 4: "Shipping the MVP of the MVP"\nRetrospective: "How do we improve our estimates?"',
   'published', now()),

  -- 10. Meetings
  (v_software_id, v_meetings_id, v_contributor, 'meme_text',
   'This meeting could have been...',
   E'This meeting could have been an email.\nThis email could have been a Slack message.\nThis Slack message could have been a ticket.\nThis ticket could have been done in the time we spent creating it.\n\nThis ticket has been moved to the backlog.',
   'published', now());

  raise notice 'Inserted 10 sample memes for software engineering.';
end $$;
