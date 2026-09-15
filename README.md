# CodeReset.dev

An English-language reset desk for Codex power users: private personal quota countdowns, clearly labeled public reset signals, calendar reminders, and search-focused field notes.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm test
npm run lint
npm run build
```

## What is implemented

- Responsive Next.js App Router landing page.
- Local five-hour and weekly quota desk.
- Paste parser plus manual fallback.
- Browser-only persistence and one-click clearing.
- Quota pacing labels and live reset countdowns.
- Downloadable `.ics` reminders.
- Honest preview surface for future verified global reset signals.
- Four statically generated SEO field notes.
- Per-page metadata, JSON-LD, sitemap, robots, and app manifest.

## Privacy model

The personal reset desk has no sign-in and makes no network request. Pasted status text is parsed in the browser, and normalized reset data is stored in local storage under `codereset:v1:quota`. The interface includes a control to remove it.

## Connecting live reset data later

The homepage signal log is intentionally marked `PRODUCT PREVIEW`. To make it live, add a server-side ingestion layer that records:

1. Source URL and publisher.
2. Original publication timestamp and normalized UTC timestamp.
3. Event type: public reset, banked reset, incident, or product change.
4. Verification status and reviewer trail.
5. A public API response consumed by the signal log.

Do not infer a personal account reset from a public event. Account-specific usage screens remain authoritative.

## Product status

CodeReset is independent and is not affiliated with OpenAI. Codex and OpenAI are trademarks of their respective owners.
