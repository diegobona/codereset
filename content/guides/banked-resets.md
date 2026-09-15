---
title: Codex banked resets, explained
description: Learn how a redeemable banked reset differs from recurring quota windows and public reset events.
slug: banked-resets
eyebrow: RESET NOTE / 03
intent: rule
primaryQuery: what are Codex banked resets
reviewedAt: 2026-09-15
reviewAfter: 2026-09-22
demandEvidence:
  type: existing-route
  reference: /guides/banked-resets
uniqueValue:
  type: decision-table
  reference: banked-reset-checklist
claims:
  - id: historical-banked-promotion
    statement: OpenAI documents a historical banked-reset promotion with eligibility, redemption, and expiration rules.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-15
    reviewAfter: 2026-09-29
  - id: current-account-availability
    statement: Whether a banked reset is currently available to a particular account must be checked in that account's Codex interface.
    sourceIds:
      - openai-codex-pricing
    factStatus: unknown
    verifiedAt: 2026-09-15
    reviewAfter: 2026-09-22
---

## Quick answer

Whether a banked reset is currently available to a particular account must be checked in that account's Codex interface. :claim[current-account-availability] Treat it as separate from recurring windows and public announcements.

## Steps

:::evidence{#banked-reset-checklist}
### Separate the concepts

OpenAI documents a historical banked-reset promotion with eligibility, redemption, and expiration rules. :claim[historical-banked-promotion]

A banked reset is not the recurring five-hour or weekly recovery. Keep each item separate so a one-time benefit is not mistaken for an automatic window.

### Check before taking action

- Confirm the benefit is visible on the account you intend to use.
- Read the current eligibility and expiry language in the official interface.
- Record the meter before and after redemption if you need to verify the effect.
:::

## Boundary conditions

This guide cannot confirm present eligibility, expiry, or the result of a redemption for any account. CodeReset does not connect to Codex and does not provide a redeem button.

## FAQ

### Can an old account claim past banked resets?

Do not assume so. Current eligibility must be verified in the official account interface.

### Can CodeReset redeem a reset for me?

No. CodeReset has no account connection and cannot change, bypass, or refill quota.

## Related

- [When the weekly limit resets](/guides/weekly-limit)
- [How to check remaining Codex usage](/guides/check-codex-usage)
