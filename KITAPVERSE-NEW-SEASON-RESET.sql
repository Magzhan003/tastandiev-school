-- KITAPVERSE — NEW SEASON RESET
-- One-time operation: removes TEST RESULTS/PROGRESS while preserving
-- student accounts, books, quests, questions, rewards and site structure.
-- Run this only when you are ready to start the real season from zero.

begin;

delete from public.book_progress;
delete from public.quest_attempts;
delete from public.battle_attempts;
delete from public.quiz_attempts;

-- Class rating is stored as a running total here.
update public.class_xp
set xp = 0,
    updated_at = now();

commit;

-- After this reset:
-- • Student rating = 0 because quiz_attempts is empty.
-- • Class rating = 0 because class_xp is reset.
-- • Reading progress = 0 because book_progress is empty.
-- • Quest attempts = 0, so every student can start the new season.
-- • Student Auth accounts are NOT deleted.
-- • Books/quests/questions are NOT deleted.
