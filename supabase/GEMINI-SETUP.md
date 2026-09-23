# Gemini illustration pilot

Not deployed or live-tested yet. No API key belongs in frontend code or GitHub.

1. Run illustration-generation.sql in the existing TeamFlow Supabase project, after creative-hub-foundation.sql.
2. In Supabase → Edge Functions → Secrets, add GEMINI_API_KEY with your Google AI Studio key. Never paste it into SQL or chat. Add APP_ORIGIN=https://teamflow-fhg-delight.vercel.app. Leave ILLUSTRATION_ENABLED=false until ready for a paid test.
3. Deploy supabase/functions/illustration-generate/index.ts as an Edge Function named illustration-generate. This is TypeScript, not SQL. The function verifies the bearer token with Supabase Auth and checks the active admin role server-side. Supabase provides SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY automatically; never expose the service role in the browser.
4. Push frontend changes and wait for Vercel Ready.
5. Confirm your Google project can use gemini-3.1-flash-image and check its billing. Set ILLUSTRATION_ENABLED=true to permit calls; false stops new calls (not requests already in flight).
6. Save an illustration project with a style. In its canvas, describe one character, generate, refresh, download, and reopen. Select that image as a visual reference and generate a scene. Check persistence and Google usage before more testing.

Privacy: only the saved style, current description, and explicitly selected reference go to Google. Manuscripts are not sent by this endpoint. Private artwork is stored in a dedicated Supabase bucket. Signed viewing links expire after one hour; Refresh artwork renews them. Do not share those links.

Safety: server enforces active admin access, project ownership, one-minute spacing, 10 reserved attempts per rolling 24h per admin, and unique request IDs. Failures count to avoid costly automatic retries. Limits are not a dollar budget or global account cap. A provider timeout may still incur charges. Never automatically retry uncertain requests. Check pending/failed generation records before retrying; reconciliation is manual in this pilot.

Tests before opening access: reject unauthenticated and non-admin calls; reject another owner's project/reference; concurrent requests cannot bypass quota; save/reload/PNG download; provider rejection and timeout; disabled configuration; private storage access. Real tests require deployment and an API key and have not been performed locally.

Current canvas is a zoomable image workspace, not a full layer editor. Manuscript analysis, storyboard approval, structured character libraries, multi-reference composition, targeted masks, page layout, and automatic continuity inspection remain future work. This pilot does not claim production-ready completion.
