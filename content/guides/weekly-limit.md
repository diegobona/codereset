---
title: When does the Codex weekly limit reset?
description: Find your account-specific weekly recovery time and plan work without assuming a universal Monday reset.
slug: weekly-limit
eyebrow: WINDOW NOTE / 02
intent: rule
primaryQuery: when does the Codex weekly limit reset
reviewedAt: 2026-09-15
reviewAfter: 2026-09-22
demandEvidence:
  type: existing-route
  reference: /guides/weekly-limit
uniqueValue:
  type: decision-table
  reference: weekly-planning-checklist
claims:
  - id: weekly-limits-may-apply
    statement: OpenAI says weekly limits may apply in addition to the rolling five-hour usage period.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-15
    reviewAfter: 2026-09-29
  - id: dashboard-current-reset
    statement: The usage dashboard is the official place to see current usage and reset times.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-15
    reviewAfter: 2026-09-29
  - id: no-universal-monday
    statement: The available official documentation does not establish one universal Monday or midnight reset for every account.
    sourceIds:
      - openai-codex-pricing
    factStatus: inference
    verifiedAt: 2026-09-15
    reviewAfter: 2026-09-22
---

## Quick answer

The available official documentation does not establish one universal Monday or midnight reset for every account. :claim[no-universal-monday] Use the current reset time shown in your own usage view.

## Steps

:::evidence{#weekly-planning-checklist}
### Find the current weekly time

The usage dashboard is the official place to see current usage and reset times. :claim[dashboard-current-reset]

Save the displayed date, time, and timezone. If a timezone abbreviation is ambiguous, confirm the offset before creating a reminder.

### Plan around both windows

OpenAI says weekly limits may apply in addition to the rolling five-hour usage period. :claim[weekly-limits-may-apply]

- Move critical work earlier than the final quota hours.
- Keep a buffer for reviews, fixes, and unexpected context growth.
- Re-check the dashboard after the countdown ends.
:::

## Boundary conditions

A local timer does not refresh account data. A public reset announcement also does not prove what happened to one private account; verify the usage view before changing plans.

## FAQ

### Does every Codex account reset on Monday?

The cited official page does not publish that universal rule. Use the date and time shown for your account.

### Will a public reset change my weekly anchor?

That account-level effect is unknown without checking the account after the event.

## Related

- [How the five-hour limit resets](/guides/5-hour-limit)
- [Banked resets explained](/guides/banked-resets)
