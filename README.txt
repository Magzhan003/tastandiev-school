№11 Тайыр Тастандиев атындағы орта мектеп — GitHub Pages + Supabase

This package is configured for the Supabase project supplied during setup.
Run supabase-migration.sql once, then upload the site files to GitHub Pages.

KITAPVERSE v2 changes
- Student account: one dashboard card containing XP, streak, books, level, level progress, reading progress and Logout.
- Library: 3 books shown per selected grade; arrow expands the rest.
- Quests: grouped by grades 6–10; 3 quests shown per grade; arrow expands the rest.
- Fake student Top-5 block removed from the page.
- Login fields use dark text/placeholder/autofill-safe styling so IIN and password are visible.
- Quest seed SQL is generated from the supplied grade 6/7/8 and grade 9/10 quest documents.
- Reset SQL clears test attempts/progress and class XP without deleting student accounts or books.

ACCOUNT LINK FIX: Run KITAPVERSE-ACCOUNT-LINK-SETUP.sql once in Supabase SQL Editor.
The site links an existing Auth account to student_profiles using the 12-digit IIN from the Auth email.
No student accounts or passwords are created/deleted/changed.


FINAL SETUP v5: run KITAPVERSE-FINAL-SETUP.sql in Supabase SQL Editor. It links existing student accounts by IIN and seeds/links 120 book quests (600 questions) to existing library books. It does not change passwords or delete accounts.
