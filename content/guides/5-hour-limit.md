---
title: How the Codex 5-hour limit resets
description: Understand the short Codex usage window, find its real reset time, and avoid starting the wrong countdown.
slug: 5-hour-limit
eyebrow: WINDOW NOTE / 01
intent: rule
primaryQuery: how does the Codex 5-hour limit reset
reviewedAt: 2026-09-15
reviewAfter: 2026-09-22
demandEvidence:
  type: existing-route
  reference: /guides/5-hour-limit
uniqueValue:
  type: troubleshooting-tree
  reference: five-hour-reset-checklist
claims:
  - id: five-hour-estimate
    statement: Codex usage limits are estimated in rolling five-hour periods, and weekly limits may also apply.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-15
    reviewAfter: 2026-09-29
  - id: dashboard-reset-time
    statement: The Codex usage dashboard shows current usage and reset times.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-15
    reviewAfter: 2026-09-29
  - id: account-timestamp-inference
    statement: A reliable personal countdown should use the reset timestamp displayed for that account rather than assume a universal wall-clock reset.
    sourceIds:
      - openai-codex-pricing
    factStatus: inference
    verifiedAt: 2026-09-15
    reviewAfter: 2026-09-22
---

## Quick answer

A reliable personal countdown should use the reset timestamp displayed for that account rather than assume a universal wall-clock reset. :claim[account-timestamp-inference]

## Steps

:::evidence{#five-hour-reset-checklist}
### Use the timestamp Codex gives you

The Codex usage dashboard shows current usage and reset times. :claim[dashboard-reset-time]

Copy the displayed time together with its date and timezone. CodeReset stores the timestamp you enter and turns it into a local countdown. When the clock reaches zero, return to Codex to confirm the meter actually recovered.

### Read both meters

Codex usage limits are estimated in rolling five-hour periods, and weekly limits may also apply. :claim[five-hour-estimate]

- Track the five-hour and weekly reset times separately.
- Treat remaining percentage as a share of the window, not a fixed message count.
- Re-check after a reset instead of assuming the displayed percentage is live.
:::

## Boundary conditions

The countdown only tracks the time you provide. It cannot read the account again or guarantee that quota has recovered.

## FAQ

### Does the five-hour window always reset five hours from now?

Do not calculate from the moment you open this page. Use the reset time displayed for your account.

### Can CodeReset confirm the reset happened?

No. It can remind you at the stored time; the official Codex usage screen confirms the actual state.

## Related

- [When the weekly limit resets](/guides/weekly-limit)
- [How to check remaining Codex usage](/guides/check-codex-usage)
