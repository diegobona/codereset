---
title: What counts toward Codex usage?
description: Learn why model choice, task complexity, context, reasoning, tools, retrieval, and caching can change how quickly Codex usage is consumed.
slug: what-counts-toward-codex-usage
eyebrow: USAGE RULE / 05
intent: rule
primaryQuery: what counts toward Codex usage
reviewedAt: 2026-09-16
reviewAfter: 2026-09-30
demandEvidence:
  type: user-report
  reference: recurring-usage-rule-questions-2026-09-16
uniqueValue:
  type: decision-table
  reference: usage-factor-checklist
claims:
  - id: usage-depends-on-work
    statement: OpenAI says Codex usage varies with the model, task size and complexity, context, reasoning, tool use, retrieval, and caching.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-16
    reviewAfter: 2026-09-30
  - id: messages-are-estimates
    statement: OpenAI describes its message ranges as estimates rather than fixed message-count limits.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-16
    reviewAfter: 2026-09-30
---

## Quick answer

There is no single cost per Codex prompt. OpenAI says Codex usage varies with the model, task size and complexity, context, reasoning, tool use, retrieval, and caching. :claim[usage-depends-on-work]

## Steps

:::evidence{#usage-factor-checklist}
### Identify the expensive part of the task

Check what changed before blaming the prompt count:

- A larger or more capable model can consume allowance differently.
- A long conversation carries more context into later turns.
- Deep reasoning, tools, retrieval, and large source sets add work.
- Similar-looking prompts can therefore consume different amounts.

### Use the meter, not a prompt estimate

OpenAI describes its message ranges as estimates rather than fixed message-count limits. :claim[messages-are-estimates]

Run `/status` or open the usage dashboard before and after a representative task. Compare the remaining percentage instead of assuming every message costs the same.
:::

## Boundary conditions

CodeReset can display the percentage and reset time you provide, but it cannot calculate the exact cost of a future task. The official meter remains the source of truth.

## FAQ

### Does a short prompt always use less quota?

No. Prompt length is only one input. Model choice, retained context, reasoning, tools, retrieval, and the requested work can also affect usage.

### Does caching make a request free?

The cited documentation says caching affects usage; it does not establish a universal zero-usage rule for every Codex plan and task.

## Related

- [How to check remaining Codex usage](/guides/check-codex-usage)
- [How to make Codex usage last longer](/guides/make-codex-usage-last-longer)

