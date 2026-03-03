-- ============================================================
-- VerticalLOL — Seed Data
-- ============================================================

-- ─── Verticals ───────────────────────────────────────────────

insert into verticals (slug, name, icon) values
  ('software',    'Software Engineering', '💻'),
  ('finance',     'Finance & Banking',    '💰'),
  ('education',   'Education',            '📚'),
  ('healthcare',  'Healthcare',           '🏥'),
  ('legal',       'Legal',               '⚖️');


-- ─── Themes — Software Engineering ───────────────────────────

insert into themes (vertical_id, slug, name)
select id, 'legacy-code',     'Legacy Code'      from verticals where slug = 'software';
insert into themes (vertical_id, slug, name)
select id, 'deadlines',       'Deadlines & Crunch' from verticals where slug = 'software';
insert into themes (vertical_id, slug, name)
select id, 'standups',        'Daily Standups'   from verticals where slug = 'software';
insert into themes (vertical_id, slug, name)
select id, 'production-bugs', 'Production Bugs'  from verticals where slug = 'software';
insert into themes (vertical_id, slug, name)
select id, 'code-reviews',    'Code Reviews'     from verticals where slug = 'software';
insert into themes (vertical_id, slug, name)
select id, 'meetings',        'Meetings'         from verticals where slug = 'software';
insert into themes (vertical_id, slug, name)
select id, 'sprint-planning', 'Sprint Planning'  from verticals where slug = 'software';


-- ─── Themes — Finance ────────────────────────────────────────

insert into themes (vertical_id, slug, name)
select id, 'quarter-close',  'Quarter Close'  from verticals where slug = 'finance';
insert into themes (vertical_id, slug, name)
select id, 'audits',         'Audits'         from verticals where slug = 'finance';
insert into themes (vertical_id, slug, name)
select id, 'earnings-calls', 'Earnings Calls' from verticals where slug = 'finance';


-- ─── Themes — Education ──────────────────────────────────────

insert into themes (vertical_id, slug, name)
select id, 'grading',       'Grading'       from verticals where slug = 'education';
insert into themes (vertical_id, slug, name)
select id, 'parent-emails', 'Parent Emails' from verticals where slug = 'education';
insert into themes (vertical_id, slug, name)
select id, 'lesson-plans',  'Lesson Plans'  from verticals where slug = 'education';


-- ─── Themes — Healthcare ─────────────────────────────────────

insert into themes (vertical_id, slug, name)
select id, 'on-call',    'On Call'    from verticals where slug = 'healthcare';
insert into themes (vertical_id, slug, name)
select id, 'paperwork',  'Paperwork'  from verticals where slug = 'healthcare';
insert into themes (vertical_id, slug, name)
select id, 'night-shift', 'Night Shift' from verticals where slug = 'healthcare';


-- ─── Themes — Legal ──────────────────────────────────────────

insert into themes (vertical_id, slug, name)
select id, 'billable-hours', 'Billable Hours' from verticals where slug = 'legal';
insert into themes (vertical_id, slug, name)
select id, 'discovery',      'Discovery'      from verticals where slug = 'legal';
insert into themes (vertical_id, slug, name)
select id, 'depositions',    'Depositions'    from verticals where slug = 'legal';
