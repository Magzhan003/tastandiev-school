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
