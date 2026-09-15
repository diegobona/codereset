# CodeReset Product Brief

## Product

Build the first locally runnable version of `codereset.dev` as an English-language Next.js product for overseas AI coding-tool users.

## Audience

- Codex power users who need to know when their personal five-hour or weekly window recovers.
- Teams that want a clear, shareable view of quota status.
- Search visitors asking about errors, reset timing, quota rules, plan limits, and usage commands.

## Product promise

Turn an opaque quota screen into a calm, trustworthy reset desk: users paste their own status, get a private local countdown, understand the difference between personal and global resets, and can export a reminder.

## First-release requirements

- A polished, responsive English landing page with a distinctive operational/radar visual system.
- A privacy-first personal reset tracker stored only in the browser.
- A parser for common pasted Codex usage output, with manual fallback.
- Countdown and usage pacing UI for five-hour and weekly windows.
- Calendar reminder export.
- A public signal/timeline preview that is explicitly labeled as preview data and never presented as a verified live feed.
- A paid alert product teaser suitable for later email/SMS/phone integration.
- Search-oriented guide pages for five-hour limits, weekly limits, banked resets, and checking usage.
- Metadata, structured data, sitemap, robots, and web-app manifest.
- Automated tests for parsing, countdown formatting, and calendar generation.
- Local run documentation.

## Guardrails

- Do not claim access to the user's OpenAI account.
- Do not imply that a public reset is the same as a personal quota-window reset.
- Use honest labels for illustrative or preview data.
- State that the project is independent and not affiliated with OpenAI.
- Avoid unsupported absolute quota numbers.

## Success criteria

- `npm test` passes.
- `npm run lint` passes.
- `npm run build` completes.
- The home page, guide pages, sitemap, robots file, and manifest are generated.
- The reset tracker works without sign-in and persists data locally.

