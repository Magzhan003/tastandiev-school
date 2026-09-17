-- KITAPVERSE — ONE-TIME NEW SEASON SETUP
-- IMPORTANT: this file resets test results AND installs/refreshes quests.
-- Run only once when starting the real season.

begin;

delete from public.book_progress;
delete from public.quest_attempts;
delete from public.battle_attempts;
delete from public.quiz_attempts;
update public.class_xp set xp=0, updated_at=now();
commit;

-- Quest data is installed by the companion file:
-- KITAPVERSE-QUESTS-SEED.sql
-- Run that file immediately after this reset.
