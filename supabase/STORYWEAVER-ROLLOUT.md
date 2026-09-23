# StoryWeaver integration

The illustration tool now opens IllustrationStudio directly, not the brief form. Existing illustration projects and brief fields are preserved. Characters and scenes use studioCharacters and studioScenes within creative_projects.brief. No new SQL is required.

Implemented: project creation/switching/editing, style selection, character editing, direct reference-sheet generation, character dossier, DNA JSON import/export, batch profile entry, scene composition with character descriptions and one image reference, galleries, captions and page ordering, artwork downloads and recovery gallery. Saving and generation failures are reported instead of substituted placeholder images.

Generation remains active-admin-only under the existing backend policy. The deployed function must have GEMINI_API_KEY and ILLUSTRATION_ENABLED=true. Redeploy supabase/functions/illustration-generate/index.ts to use the optional ADDITIONAL_APP_ORIGINS setting. For the current local preview set that value to http://localhost:5199 while keeping APP_ORIGIN set to the production site. This does not bypass authentication or ownership checks.

Live generation and durable save/reload testing must be completed before claiming the integration is verified end-to-end. No chargeable generation has been run by this change.

Differences from supplied prototype: batch entry saves profiles for individual generation (one-per-minute quota); JSON imports import descriptions rather than embedded base64 images; no AI text-enhance button, no print-ready layout export, no automatic manuscript analysis. Character identity is guided by descriptions and an attached image, not guaranteed. Existing preview SVG work is preserved on disk but is not used in this new studio.
