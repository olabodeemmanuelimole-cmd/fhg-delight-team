# TeamFlow build foundation

## Current milestone

- Responsive React/Vite application shell
- Sign-in and registration interface
- Member, team-leader, and administrator routing previews
- Mobile and desktop navigation
- Supabase environment contract
- Initial PostgreSQL model and row-level security for profiles, offices, memberships, sponsors, and transfers

## Local development

```bash
npm install
npm run dev
```

The role selector on the sign-in page is temporary demo access. It will be removed when Supabase authentication is connected.

## Next milestone

Connect Supabase authentication, create the profile-on-signup database trigger, and replace demo records with authenticated queries.
