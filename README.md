# Dale & Mick Tasks

A mobile-first shared task app built with React, Vite, Tailwind CSS, Framer Motion, and optional Supabase live sync.

## Local run

```bash
npm install
npm run dev
```

## Build

```bash
npm install
npm run build
```

## Test

```bash
npm install
npm run test
```

## Deploy to Vercel

1. Create a new project in Vercel.
2. Upload this folder or push it to GitHub and import the repo in Vercel.
3. Vercel should detect Vite automatically.
4. Build command: `npm run build`
5. Output directory: `dist`

## Optional Supabase setup

You can either:
- enter the Supabase URL and anon key inside the app under **Shared sync setup**, or
- add them as Vercel environment variables using:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

After deployment, open **Shared sync setup**, copy the SQL, run it in Supabase SQL Editor, then connect.


## Voice task entry

This build includes speech-to-text task creation. On a supported mobile browser, tap **Voice task**, allow microphone access, and say something like: `Call Mick about the site tomorrow, high priority`. The app will try to fill in the title, owner, priority, due date, and will store the full spoken text in notes.
