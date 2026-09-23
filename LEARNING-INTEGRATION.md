# Learning Hub integration

## Inspected sources

- TeamFlow: existing React app and Supabase client in this repository.
- Learning prototype: C:/Users/pc/Documents/Codex/2026-09-04/ski/outputs/teamm-learning.
- Prototype uses vanilla JavaScript, its own stored auth session, and a different Supabase project.
- Its schema creates public.profiles; do not run that schema against TeamFlow.

## Implementation sequence

1. Foundation: learning-prefixed tables referencing existing TeamFlow profiles. Prepared in supabase/learning-foundation.sql; not applied or database-tested by this change.
2. React learner library and course/lesson views inside the existing shell, using src/supabase.js. Preserve back navigation and shared logout.
3. Admin course/lesson editor; no external second login or client-side role switcher.
4. Course-specific creator assignments, review and versioned publishing. Leadership alone must not automatically grant global publishing access.
5. Restricted enrolment/access codes, questions/replies, and office-scoped leader progress views. Restricted content requires server enforcement before release.
6. Test all roles and deploy through the existing repository.

The foundation deliberately permits only active TeamFlow administrators to manage content. Active members read published courses and manage only their own completion records. It does not yet implement creator delegation, private courses or office reporting. Do not upload restricted content to a published course in this phase.

## Migration safety

No existing Learning Hub accounts, courses, or resources have been copied. Inventory live learning data before deciding whether to migrate it. User IDs from separate Supabase projects are not interchangeable. Do not copy password hashes, browser sessions, or access tokens. Do not remove the old application during integration.

External video/resource links remain accessible according to their hosting provider's permissions; database policies cannot protect public external media URLs.

## Required database checks before rollout

- Apply in a test database with TeamFlow's existing profiles schema, then apply again to check rerun safety.
- An anonymous or pending/suspended account must not read courses or lessons.
- An active learner must see published content only, never drafts, and cannot modify courses or another member's progress.
- An active administrator can create/edit/publish/archive courses and lessons.
- Completion requires a published lesson and is unique per member/lesson; undo affects only the current member.
- Verify archived courses disappear for learners and existing attendance, finance, and order operations remain unchanged.

## First testable UI

More → Learning Hub now opens a React learning workspace with the existing TeamFlow session. It includes course search, course details, ordered lessons, external video links, personal completion/undo, and admin course/lesson creation and editing. Course visibility is draft, published, or archived. Existing resource records render, but resource editing is not included yet.

Install supabase/learning-foundation.sql in the TeamFlow project before testing. Publish the frontend changes through the normal GitHub/Vercel flow. No live database changes or deployment were performed while implementing this UI.

Test as administrator: create a draft course → add two lessons → edit their order → publish. Test as an active member: find the course → open a lesson → mark complete → reload → verify completion remains → undo completion. Back should return from lesson to course, course to library, and library to the previous TeamFlow screen. Archive the test course and verify it disappears for members.

This is the first functional slice, not the complete original Learning Hub migration. Creator assignments, questions, restricted access, inline video playback, resource editing, and production RLS/browser tests remain outstanding.
