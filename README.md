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
npm run seo:check
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

The personal reset desk has no sign-in or account connection. Pasted status text is parsed in the browser, and normalized reset data is stored in local storage under `codereset:v1:quota`. The interface includes a control to remove it.

Optional product measurement sends only an allowlisted event name plus a coarse `page` kind and `device` class. The endpoint rejects pasted text, quota percentages, reset timestamps, visitor identifiers, unknown fields, cross-origin requests, and oversized bodies. See the public `/privacy` route for all localStorage/sessionStorage keys, retention language, contact details, and the browser opt-out switch.

## Cloudflare measurement deployment

This repository contains a Cloudflare Pages Function at `functions/api/events.ts`. Static output remains `out`; Cloudflare Pages deploys the sibling `functions` directory separately.

Before enabling custom events, create or select an Analytics Engine dataset and bind it as `SEO_EVENTS` in both environments:

| Environment | Binding name | Dataset | Verification |
| --- | --- | --- | --- |
| Preview | `SEO_EVENTS` | dedicated preview dataset preferred | Send one allowlisted event from the preview origin and query it. |
| Production | `SEO_EVENTS` | production dataset | Enable only after preview payload inspection and `/privacy` deployment. |

Binding checklist:

1. In the Cloudflare Pages project settings, add an Analytics Engine binding named exactly `SEO_EVENTS` for preview and production.
2. Deploy a preview and confirm `/privacy` is available before exercising `/api/events`.
3. From the preview page console, send a same-origin JSON request containing only `{"event":"first_visit","page":"home","device":"desktop"}`. A configured endpoint returns `204`; a missing/unavailable binding returns the explicit non-blocking `503` status.
4. Query the preview dataset and confirm no IP address, user-agent, identifier, pasted text, percentage, reset timestamp, full URL, or unexpected blob is present.
5. Repeat the binding and single-event verification for production. Record the real result in `docs/seo-scorecard.md`; do not infer success from a local build.

Event columns are `blob1 = event`, `blob2 = page`, and `blob3 = device`. A sampling-aware seven-day count query is:

```sql
SELECT
  blob1 AS event,
  blob2 AS page,
  blob3 AS device,
  SUM(_sample_interval) AS events
FROM SEO_EVENTS
WHERE timestamp > NOW() - INTERVAL '7' DAY
GROUP BY event, page, device
ORDER BY events DESC
```

Run SQL through the [Cloudflare Analytics Engine SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/) with a least-privilege API token. Never commit account IDs or tokens.

Cloudflare currently documents [Analytics Engine retention](https://developers.cloudflare.com/analytics/analytics-engine/limits/#data-retention) as three months. Verify the current limit for the deployed account during production enablement and keep the public privacy page aligned with it.

Enable Cloudflare Web Analytics in the dashboard for aggregate pageviews and Web Vitals. Use Cloudflare's automatic dashboard integration and verify the beacon appears only once; do not also paste a manual Web Analytics script into this app. Custom Analytics Engine events serve the product funnel and should not be presented as a second general pageview counter.

## Monday SEO review

Every Monday:

1. Copy the GSC submitted/discovered/indexed counts, coverage changes, clicks, impressions, CTR, and top queries/pages into a dated scorecard note.
2. Query Analytics Engine with `SUM(_sample_interval)`, preserve each numerator and denominator, and calculate the formulas in `docs/seo-scorecard.md`.
3. Review Cloudflare Web Analytics and CWV. Compare LCP, INP, and CLS with the recorded baseline and flag any regression greater than 10%.
4. Inspect parser failures and guide-to-desk conversion only at the allowlisted aggregate level; never expand collection to pasted text, quota values, timestamps, or visitor IDs.
5. Choose no more than three actions for the week, each tied to a query/page/funnel observation, and record owner plus follow-up date.
6. Re-run `npm test`, `npm run lint`, and `npm run seo:check` before publishing route or metadata changes.

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
