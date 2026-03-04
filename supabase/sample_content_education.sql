-- ============================================================
-- VerticalLOL — Education Sample Content (5 memes + 3 image memes)
-- Run in Supabase SQL Editor AFTER migrations + at least 1 user
-- ============================================================
-- For image_meme entries: replace the media_url placeholder with
-- a real image URL (Imgur, your Supabase Storage bucket, etc.)
-- ============================================================

do $$
declare
  v_edu_id        uuid;
  v_grading_id    uuid;
  v_parents_id    uuid;
  v_lessons_id    uuid;
  v_contributor   uuid;
begin

  select id into v_edu_id      from verticals where slug = 'education';
  select id into v_grading_id  from themes    where slug = 'grading';
  select id into v_parents_id  from themes    where slug = 'parent-emails';
  select id into v_lessons_id  from themes    where slug = 'lesson-plans';
  select id into v_contributor from auth.users limit 1;

  insert into content_items
    (vertical_id, theme_id, contributor_id, type, title, body_text, media_url, status, published_at)
  values

  -- ── MEME TEXT (5) ─────────────────────────────────────────

  -- 1. Grading / Workload
  (v_edu_id, v_grading_id, v_contributor, 'meme_text',
   'Teacher salary breakdown (actual hours)',
   E'Contract hours: 37.5/week\nActual hours: 60+/week\n\nBreakdown:\n• Teaching: 25 hrs\n• Grading at 10pm: 8 hrs\n• Lesson planning on Sunday: 6 hrs\n• Responding to parent emails during dinner: 4 hrs\n• Professional development nobody asked for: 3 hrs\n• Crying in the supply closet: billable\n\nHourly rate: $0.002 above minimum wage',
   null, 'published', now()),

  -- 2. Parent Emails
  (v_edu_id, v_parents_id, v_contributor, 'meme_text',
   'Parent email decoder ring',
   E'"Just wanted to check in..." → My child failed and I need someone to blame\n"Per my last email..." → You ignored me and I have receipts\n"We feel that..." → My spouse doesn''t know I''m emailing you\n"As a taxpayer..." → Buckle up\n"He''s never had this problem before..." → He absolutely has\n"Can we schedule a call?" → I''d like to yell at you in real time',
   null, 'published', now()),

  -- 3. Lesson Plans / Admin Workload
  (v_edu_id, v_lessons_id, v_contributor, 'meme_text',
   'Things teachers do "for free"',
   E'✓ Lesson planning (evenings)\n✓ Grading (weekends)\n✓ Buying classroom supplies (own money)\n✓ Emotional support counselling (untrained)\n✓ Hunger assessment (unofficial)\n✓ Technology support (unpaid IT)\n✓ Admin paperwork about the paperwork\n✓ Mandatory fun committee\n\nAlso the principal needs your updated seating chart by 7am.',
   null, 'published', now()),

  -- 4. Grading
  (v_edu_id, v_grading_id, v_contributor, 'meme_text',
   'Grading 30 essays on the same prompt',
   E'Essay 1: "Interesting take!"\nEssay 5: "Good effort"\nEssay 10: "See previous comments"\nEssay 15: "..."\nEssay 20: *just writes the grade*\nEssay 25: *questioning career choices*\nEssay 28: "Did you even read the prompt"\nEssay 30: SUBMITTED. DONE. GLASS OF WINE. NOW.',
   null, 'published', now()),

  -- 5. Principal / Admin
  (v_edu_id, v_lessons_id, v_contributor, 'meme_text',
   'New initiative from admin (arriving Thursday)',
   E'Monday: "We''re implementing a new wellbeing framework"\nTuesday: Training on the framework (during your prep period)\nWednesday: Framework has been updated, redo the training\nThursday: "We''re moving to a different framework"\nFriday: Framework is now mandatory AND will be observed\n\nPrincipal in staff meeting: "We really value your feedback."',
   null, 'published', now()),

  -- ── IMAGE MEMES (3) ───────────────────────────────────────
  -- Replace media_url with a real image URL before running,
  -- or update via Supabase Table Editor after inserting.

  -- 6. Teacher supply budget meme
  (v_edu_id, v_grading_id, v_contributor, 'image_meme',
   'Annual classroom supply budget: $50',
   null,
   'https://REPLACE_WITH_IMAGE_URL/teacher-supply-budget-meme.jpg',
   'published', now()),

  -- 7. Stack of marking meme
  (v_edu_id, v_grading_id, v_contributor, 'image_meme',
   'Me on Friday vs the stack of marking on my kitchen table',
   null,
   'https://REPLACE_WITH_IMAGE_URL/marking-stack-meme.jpg',
   'published', now()),

  -- 8. Parent email notification meme
  (v_edu_id, v_parents_id, v_contributor, 'image_meme',
   'That feeling when you get a parent email that starts with "I just wanted to say..."',
   null,
   'https://REPLACE_WITH_IMAGE_URL/parent-email-anxiety-meme.jpg',
   'published', now());

  raise notice 'Inserted 5 text memes + 3 image meme placeholders for education.';
  raise notice 'Update the 3 image_meme rows with real media_url values in Table Editor.';
end $$;
