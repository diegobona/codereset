# CodeReset Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, locally runnable Next.js launch site for `codereset.dev` with a privacy-first personal quota tracker, useful reset education, and strong SEO foundations.

**Architecture:** Use the Next.js App Router with server-rendered marketing and guide surfaces, plus one focused client-side reset desk for local parsing, persistence, countdowns, and calendar export. Keep domain logic in small framework-independent modules so it is covered by Vitest, and keep all public reset data explicitly labeled as preview content until a verified feed is connected.

**Tech Stack:** Next.js, React, TypeScript, CSS, Vitest, Testing Library, Lucide React.

---

## File structure

- `app/layout.tsx`: global metadata, fonts, and application shell.
- `app/page.tsx`: primary marketing and product landing page.
- `app/globals.css`: visual system, responsive layout, and component styling.
- `app/guides/[slug]/page.tsx`: statically generated long-tail SEO guides.
- `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`: discovery and install metadata.
- `components/reset-desk.tsx`: interactive local quota tracker.
- `components/icons.tsx`: small brand and interface glyphs.
- `lib/reset.ts`: parsing, countdown, pacing, and calendar domain logic.
- `lib/content.ts`: typed guide and sample signal content.
- `tests/reset.test.ts`: unit coverage for domain behavior.
- Configuration files: project scripts, TypeScript, Next.js, ESLint, and Vitest setup.

### Task 1: Bootstrap and domain tests

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/reset.test.ts`
- Create: `lib/reset.ts`

- [ ] **Step 1: Create project configuration and a failing unit test suite**

Write tests for percentage parsing, reset timestamp parsing, remaining-time formatting, pacing state, and ICS generation before the domain module exists. Parser fixtures must cover `5h limit: 73% left · resets Sep 15, 2026 18:30`, `Weekly limit: 41% left · resets 2026-09-20T09:00:00+08:00`, a combined multiline form, and malformed text returning no windows rather than invented values.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test`

Expected: FAIL because `lib/reset.ts` cannot be resolved.

- [ ] **Step 3: Implement the minimum domain module**

Export `parseUsageStatus`, `formatCountdown`, `getPaceState`, and `createCalendarEvent` with deterministic inputs and no browser dependencies.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test`

Expected: all domain tests pass.

### Task 2: App shell and landing surface

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `components/icons.tsx`
- Create: `lib/content.ts`
- Create: `tests/page.test.tsx`

- [ ] **Step 1: Add a failing server-render test for the landing page's core claims**

Assert that the page contains the product promise, privacy claim, public-vs-personal reset distinction, and independent-project disclaimer.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/page.test.tsx`

Expected: FAIL because the page does not exist.

- [ ] **Step 3: Implement the shell and landing page**

Build the navigation, hero status console, reset explainer, preview signal timeline, paid alert teaser, guide index, FAQ, and footer. Use a high-contrast ink/paper palette, acid-lime signal color, monospace telemetry, subtle grid texture, and restrained motion.

- [ ] **Step 4: Add responsive and accessibility-safe styling**

Ensure keyboard-visible focus, reduced-motion behavior, semantic headings, sufficient contrast, and layouts without horizontal overflow from 360px mobile through desktop widths.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm test -- tests/page.test.tsx`

Expected: landing test passes.

### Task 3: Personal reset desk

**Files:**
- Create: `components/reset-desk.tsx`
- Create: `tests/reset-desk.test.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add failing interaction tests**

Cover paste parsing, manual values, local-save confirmation, and countdown rendering using browser-like test APIs.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/reset-desk.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the client component**

Provide paste and manual setup tabs, five-hour and weekly meters, localStorage persistence, a ticking countdown, clear-data control, and downloadable ICS reminder.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- tests/reset-desk.test.tsx`

Expected: interaction tests pass.

### Task 4: Search and install surfaces

**Files:**
- Create: `app/guides/[slug]/page.tsx`
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Create: `app/manifest.ts`
- Create: `public/icon.svg`
- Create: `tests/content.test.ts`
- Modify: `lib/content.ts`

- [ ] **Step 1: Add a failing guide-content test**

Verify unique metadata and complete content exist for these four fixed slugs: `5-hour-limit`, `weekly-limit`, `banked-resets`, and `check-codex-usage`. Each guide contract includes slug, eyebrow, title, description, answer, sections, FAQs, related links, and last-reviewed date.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/content.test.ts`

Expected: FAIL until content and routes are implemented.

- [ ] **Step 3: Implement guides and metadata surfaces**

Generate guides from the typed `lib/content.ts` records, add Article and FAQ structured data, include every fixed slug in the sitemap, and expose robots, manifest, and an SVG app icon.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- tests/content.test.ts`

Expected: content tests pass.

### Task 5: Documentation and release verification

**Files:**
- Create: `README.md`
- Modify: any file implicated by verification failures.

- [ ] **Step 1: Document local setup, scripts, privacy model, and live-data handoff**

Include `npm install`, `npm run dev`, test, lint, and build commands plus the boundary between preview signals and a future verified backend.

- [ ] **Step 2: Run the full automated test suite**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 3: Run static analysis**

Run: `npm run lint`

Expected: zero ESLint errors.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: Next.js reports a successful production build and generated routes.

- [ ] **Step 5: Inspect the rendered home page at desktop and mobile widths**

Start the local app, capture the page at representative viewport sizes, and correct any overflow, contrast, or hierarchy defects before delivery.
