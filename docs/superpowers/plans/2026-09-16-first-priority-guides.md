# First-Priority Codex Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the first-priority, source-backed Codex usage rule and operation guides without adding thin or unsupported pages.

**Architecture:** Continue using the existing Markdown content registry and evidence validator so every new claim is tied to current official OpenAI documentation. Add one static `/guides` collection page for discovery, include it in the published route manifest and sitemap, and keep the homepage limited to common questions plus one “all guides” link.

**Tech Stack:** Next.js 16 App Router static export, React 19, Markdown/gray-matter, Zod, Vitest, Testing Library, Cloudflare Pages.

---

### Task 1: Lock the first-priority content contract

**Files:**
- Modify: `tests/content.test.ts`
- Test: `tests/content.test.ts`

- [x] **Step 1: Write the failing test**

Require exactly the existing four guides plus these six source-backed guides:

- `what-counts-toward-codex-usage`
- `why-codex-shows-multiple-limits`
- `codex-local-cloud-shared-limits`
- `switch-codex-models-save-usage`
- `codex-limit-reached`
- `make-codex-usage-last-longer`

Also require at least seven rule guides and three operation guides so the first-priority cluster cannot silently regress.

Lock the new guide intents explicitly:

- `rule`: `what-counts-toward-codex-usage`, `why-codex-shows-multiple-limits`, `codex-local-cloud-shared-limits`, `switch-codex-models-save-usage`
- `operation`: `codex-limit-reached`, `make-codex-usage-last-longer`

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/content.test.ts --maxWorkers=1`

Expected: FAIL because the six new slugs do not exist.

- [x] **Step 3: Do not add production content yet**

Move to Task 2 only after confirming the expected missing-guide failure.

### Task 2: Add six evidence-backed rule and operation guides

**Files:**
- Create: `content/guides/what-counts-toward-codex-usage.md`
- Create: `content/guides/why-codex-shows-multiple-limits.md`
- Create: `content/guides/codex-local-cloud-shared-limits.md`
- Create: `content/guides/switch-codex-models-save-usage.md`
- Create: `content/guides/codex-limit-reached.md`
- Create: `content/guides/make-codex-usage-last-longer.md`
- Modify: `content/sources.json`
- Test: `tests/content.test.ts`

- [x] **Step 1: Add only claims supported by the current OpenAI pricing documentation**

Use `openai-codex-pricing` for these official facts:

- task complexity, model, context, reasoning, tools, retrieval, and caching can affect usage;
- local messages and cloud tasks share included plan usage;
- Spark uses a separate adjustable limit;
- smaller models can make included usage last longer;
- the current turn can finish when a limit is reached, subject to fair-use controls;
- current limits and reset times are shown in the usage dashboard and `/status`;
- prompt/source/output scope, AGENTS.md size, MCP count, and model choice are documented usage-saving levers.

Add the current official Developer commands page to the source registry for the `/model` and `/status` instructions used by the operation checklists.

- [x] **Step 2: Give every page a distinct decision aid**

Each Markdown file must include a unique evidence directive, a direct quick answer, actionable steps, explicit boundary conditions, at least two FAQs, and at least two related guide links.

- [x] **Step 3: Run the focused content tests**

Run: `npx vitest run tests/content.test.ts tests/content-loader.test.ts --maxWorkers=1`

Expected: PASS.

### Task 3: Add a compact Guides hub and internal links

**Files:**
- Create: `app/guides/page.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `lib/content/route-manifest.ts`
- Modify: `app/sitemap.ts`
- Modify: `tests/page.test.tsx`
- Modify: `tests/seo.test.ts`

- [x] **Step 1: Write failing page and SEO tests**

Require `/guides` to have one H1, canonical/social metadata, CollectionPage JSON-LD, separate Rule and How-to sections, links to all published guides, a reset-desk CTA, and inclusion in the route manifest and sitemap. Require the homepage to expose one `Browse all guides` link without listing every new guide.

The route manifest must add a dedicated `collection` kind and validate `/guides` separately instead of allowing it to fall through to the `/guides/{slug}` guide validator.

The homepage regression must require exactly one `/guides` hub link, retain the four existing direct guide links, and assert that none of the six new guide slugs are linked directly from the homepage.

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/page.test.tsx tests/seo.test.ts --maxWorkers=1`

Expected: FAIL because `app/guides/page.tsx` and the guide-index route do not exist.

- [x] **Step 3: Implement the minimal static hub**

Render cards from the validated `guides` collection, group by `rule` and `operation`, reuse the existing visual language, and add only a compact homepage link.

- [x] **Step 4: Run the focused tests**

Run: `npx vitest run tests/page.test.tsx tests/seo.test.ts --maxWorkers=1`

Expected: PASS.

### Task 4: Verify the entire static site

**Files:**
- Verify all modified files

- [x] **Step 1: Run the full test suite**

Run: `npx vitest run --maxWorkers=1`

Expected: all tests pass.

- [x] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit 0 with no warnings.

- [x] **Step 3: Build and validate the export**

Run: `npm run build`

Expected: static export includes `/guides` and all ten guide routes.

Run: `node scripts/validate-export.mjs`

Expected: every indexable route has unique metadata, canonical URL, JSON-LD, valid links, and a matching sitemap URL.

- [x] **Step 4: Perform browser QA**

Verify `/guides` and at least one new rule and operation page at desktop and mobile widths. Confirm no horizontal overflow, no console errors, and that the homepage remains compact.

- [x] **Step 5: Review the final diff**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; pre-existing quota-parser changes remain intact and are not overwritten.
