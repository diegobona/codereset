# CodeReset SEO scorecard

This is the weekly source of truth for search, funnel, return, and performance measurement. Record a dated snapshot every Monday; do not overwrite an earlier observation with a later result.

## Measurement status — 2026-09-15 implementation baseline

| Surface | Known now | Must not be inferred |
| --- | --- | --- |
| Google Search Console | The site owner confirmed that CodeReset has been submitted to GSC. The exact property type and submission timestamp are not recorded here. | Verification state, crawl state, indexed count, impressions, clicks, and ranking are unknown until read from GSC. |
| Sitemap | Canonical URL: `https://codereset.dev/sitemap.xml`. The generated local sitemap contains six indexable URLs after `/privacy` is added. | A generated sitemap does not prove that GSC accepted or crawled it. Confirm the post-deploy fetch and submission status in GSC. |
| Cloudflare Web Analytics | Planned for aggregate pageviews and Web Vitals. | Dashboard enablement and production data have not been verified. |
| Analytics Engine | The local Pages Function and `SEO_EVENTS` binding contract are implemented. | Preview/production bindings, a successful production write, dataset retention, and query results have not been verified. |
| CWV / Lighthouse | Baseline pending a production deployment and real measurement. | No score or percentile is claimed in this document. |

The first five canonical URLs tracked before the privacy route was added are:

1. `https://codereset.dev/`
2. `https://codereset.dev/guides/5-hour-limit`
3. `https://codereset.dev/guides/weekly-limit`
4. `https://codereset.dev/guides/banked-resets`
5. `https://codereset.dev/guides/check-codex-usage`

After this change deploys, `https://codereset.dev/privacy` is the sixth indexable URL. Re-submit or refresh the sitemap in GSC, then record the actual GSC response without assuming indexation.

## Metric definitions

All event counts use `SUM(_sample_interval)`, not raw row count, because Analytics Engine may sample records. Unless a row says otherwise, compute numerator and denominator over the same environment and reporting window. A zero denominator produces `N/A`, never `0%`.

| Metric | Formula | Denominator and interpretation |
| --- | --- | --- |
| Index rate | GSC indexed canonical URLs ÷ GSC discovered/submitted indexable canonical URLs × 100 | Denominator is the unique indexable canonical URLs known to GSC in the selected sitemap cohort. Report the cohort size and snapshot date. Exclude redirects, noindex pages, and duplicates. |
| Parser success rate | `parser_success` ÷ `parser_attempt` × 100 | Every session-deduplicated parse attempt in the period. This measures whether supported text parsed; no pasted text or quota value is collected. |
| Desk completion rate | `desk_complete` ÷ `desk_start` × 100 | Every session-deduplicated desk start in the period, across paste and manual paths. |
| Manual completion rate | `manual_setup_complete` ÷ `manual_setup_start` × 100 | Every session-deduplicated manual setup start in the period. |
| Guide-to-desk rate | `guide_to_desk_click` ÷ `guide_pageview` × 100 | Every custom, session-deduplicated guide pageview in the period. This is separate from Cloudflare Web Analytics pageviews. |
| ICS rate | `ics_download` ÷ `desk_complete` × 100 | Completed desks in the same period. Label this as downloads per completion, not unique-user conversion. |
| Share rate | `share_card_download` ÷ `desk_complete` × 100 | Completed desks in the same period. Until the share-card feature exists, record `not available`, not `0%`. |
| 7-day return event rate | cumulative `return_7d` events through snapshot D ÷ cumulative `first_visit` events on or before D−7 days × 100 | Aggregate browser-return proxy. Local storage can be cleared and there is no visitor ID, so this is not user-level retention or a cohort join. |
| 30-day return event rate | cumulative `return_30d` events through snapshot D ÷ cumulative `first_visit` events on or before D−30 days × 100 | Same limitations as the 7-day proxy. Report `N/A` until the measurement window has matured. |

## Weekly snapshot template

| Week ending | Submitted | Indexed | Index rate | Parser success | Desk completion | Manual completion | Guide → desk | ICS | Share | Return 7d | Return 30d | Notes/action |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Baseline pending | 6 local candidates | pending GSC | N/A | pending deployment | pending deployment | pending deployment | pending deployment | pending deployment | not available | not matured | not matured | Verify production surfaces before entering values. |

Always retain the raw numerator and denominator beside percentages in the weekly notes. Avoid interpreting small samples as trends.

## Performance targets and budget

- LCP target: ≤ 2.5 seconds.
- INP target: < 200 milliseconds.
- CLS target: < 0.1.
- Regression budget: no metric may worsen by more than 10% relative to the recorded baseline without an explicit investigation and decision.
- Current Lighthouse/CWV baseline: pending post-deploy measurement. Run mobile and desktop Lighthouse against the production canonical, then copy the exact timestamp, URL, mode, and scores here. Use field CWV once sufficient data exists; do not substitute an invented value.

## Required online verification after deployment

1. Fetch `https://codereset.dev/privacy` and `https://codereset.dev/sitemap.xml`; confirm six canonical, indexable HTML routes and a `200` response.
2. In GSC, record the actual property type, sitemap submission/last-read state, and URL Inspection result for each first-cohort URL plus `/privacy`.
3. Confirm Cloudflare Web Analytics is enabled once and no second beacon script is manually embedded.
4. Confirm `SEO_EVENTS` is bound in both preview and production, then send one allowlisted preview event.
5. Query Analytics Engine and inspect that the row contains only event name, page kind, and coarse device class; record the verified dataset retention setting.
6. Capture production Lighthouse/CWV baselines. Until these checks are recorded, measurement status remains `pending online verification`.
