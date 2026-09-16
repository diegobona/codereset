---
title: What to do when you reach a Codex usage limit
description: Check which Codex meter was exhausted, preserve active work, choose a documented continuation option, and set the correct reset reminder.
slug: codex-limit-reached
eyebrow: HOW TO / 09
intent: operation
primaryQuery: what to do when Codex usage limit is reached
reviewedAt: 2026-09-16
reviewAfter: 2026-09-30
demandEvidence:
  type: user-report
  reference: recurring-codex-limit-reached-question-2026-09-16
uniqueValue:
  type: troubleshooting-tree
  reference: limit-reached-checklist
claims:
  - id: current-turn-can-finish
    statement: OpenAI says an agent may finish a turn already in progress when a usage limit is reached, subject to fair-use restrictions.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-16
    reviewAfter: 2026-09-30
  - id: documented-continuation-options
    statement: OpenAI documents extra credits for eligible plans, smaller models, and API-key local chats as possible ways to continue or stretch usage.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-16
    reviewAfter: 2026-09-30
---

## Quick answer

First identify which labeled meter reached zero and save the work already in progress. OpenAI says an agent may finish a turn already in progress when a usage limit is reached, subject to fair-use restrictions. :claim[current-turn-can-finish]

## Steps

:::evidence{#limit-reached-checklist}
### Preserve and diagnose

1. Let the active turn finish if Codex continues running.
2. Save or commit useful work before starting a replacement workflow.
3. Open `/status` or the usage dashboard.
4. Record the exhausted meter and its exact reset timestamp.

### Choose the least disruptive option

OpenAI documents extra credits for eligible plans, smaller models, and API-key local chats as possible ways to continue or stretch usage. :claim[documented-continuation-options]

- Wait for the displayed reset when the task is not urgent.
- Use a smaller available model for bounded work.
- Purchase credits only if the account offers them and the work justifies the cost.
- Use an API key for additional local work only after accepting separate API billing.
:::

## Boundary conditions

CodeReset cannot refill, bypass, or verify recovery of an account limit. A countdown is a reminder to check the official meter again, not proof that usage has returned.

## FAQ

### Should I restart Codex when a limit appears?

Not automatically. First see whether the current turn completes, save the result, and identify the meter and reset time shown by the official client.

### Can CodeReset buy credits or reset the limit?

No. Purchases and account changes must happen through the official account interface; CodeReset only tracks values you provide.

## Related

- [How to check remaining Codex usage](/guides/check-codex-usage)
- [How the Codex 5-hour limit resets](/guides/5-hour-limit)

