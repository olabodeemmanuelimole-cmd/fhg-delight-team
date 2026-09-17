# Attendance verification rollout

1. Run all of attendance-verification.sql in Supabase SQL Editor. It requires the existing core, leader-access, engagement and notification migrations. Do not paste React files into SQL Editor.
2. Commit the app files and migration in GitHub Desktop. Summary: Add attendance verification and daily checkout. Push origin; wait for Vercel Ready.
3. With an active member account, open Attendance: red before check-in. Check in; return to Attendance: yellow plus an eight-character daily code.
4. Try signing out while pending: the server must reject it. Repeating check-in must not regenerate the code or award points.
5. With the office's full-access leader, open Attendance register. The pending queue should contain the member; confirm their physical presence. A different office's leader and a limited-access leader must not be able to approve.
6. Refresh the member's Attendance: green. Try an incorrect code, then the correct code. Only the correct code should work; repeating checkout must fail. Checkout must not award attendance points again.
7. Codes expire at midnight Africa/Lagos. Next day's check-in starts a new session. No user can verify their own attendance; another authorized leader/admin is needed.
8. Existing historical records remain classified as before. New pending claims do not count as present/late in reports; points are awarded only on verification.

The production bundle was built locally. Database execution and the two-account live checks require installing this migration; they have not been run against production by Codex.
