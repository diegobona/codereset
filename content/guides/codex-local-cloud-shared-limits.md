---
title: Do Codex local and cloud tasks share limits?
description: Learn how local Codex messages and cloud tasks use the same included plan allowance and where to verify your current remaining usage.
slug: codex-local-cloud-shared-limits
eyebrow: USAGE RULE / 07
intent: rule
primaryQuery: do Codex local and cloud tasks share usage limits
reviewedAt: 2026-09-16
reviewAfter: 2026-09-30
demandEvidence:
  type: user-report
  reference: recurring-local-cloud-limit-question-2026-09-16
uniqueValue:
  type: decision-table
  reference: shared-allowance-checklist
claims:
  - id: local-cloud-share-allowance
    statement: OpenAI says local messages and cloud tasks share the included usage allowance for a ChatGPT plan.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-16
    reviewAfter: 2026-09-30
  - id: dashboard-shows-current-limits
    statement: OpenAI directs users to the usage dashboard for current limits and reset times and to /status for remaining usage in an active CLI session.
    sourceIds:
      - openai-codex-pricing
      - openai-developer-commands
    factStatus: official
    verifiedAt: 2026-09-16
    reviewAfter: 2026-09-30
---

## Quick answer

Yes for included plan usage: OpenAI says local messages and cloud tasks share the included usage allowance for a ChatGPT plan. :claim[local-cloud-share-allowance]

## Steps

:::evidence{#shared-allowance-checklist}
### Plan local and cloud work together

Do not create separate budgets that assume local CLI work cannot affect the allowance available for cloud tasks. Before a long cloud run, check what recent local sessions have already consumed.

### Verify the combined result

OpenAI directs users to the usage dashboard for current limits and reset times and to `/status` for remaining usage in an active CLI session. :claim[dashboard-shows-current-limits]

Use the dashboard when you need the clearest account-level view. Use `/status` while working in the CLI, then copy the labeled quota rows into CodeReset if you want local countdowns.
:::

## Boundary conditions

API-key billing is different from included ChatGPT plan usage. Do not mix API rate limits or API charges with the percentages shown for your ChatGPT Codex allowance.

## FAQ

### Does moving a task to the cloud create a fresh allowance?

No. The cited OpenAI pricing documentation says local messages and cloud tasks share the included usage allowance.

### Does API-key usage share the same percentage?

API-key usage is billed at API rates. Treat it separately from the included ChatGPT plan meter shown in the Codex usage dashboard.

## Related

- [How to check remaining Codex usage](/guides/check-codex-usage)
- [Why Codex shows multiple usage limits](/guides/why-codex-shows-multiple-limits)

