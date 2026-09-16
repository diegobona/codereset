---
title: Why does Codex show multiple usage limits?
description: Understand separate five-hour, weekly, and model-specific Codex meters without combining unrelated percentages or reset times.
slug: why-codex-shows-multiple-limits
eyebrow: USAGE RULE / 06
intent: rule
primaryQuery: why does Codex show multiple usage limits
reviewedAt: 2026-09-16
reviewAfter: 2026-09-30
demandEvidence:
  type: user-report
  reference: recurring-multiple-limit-output-2026-09-16
uniqueValue:
  type: decision-table
  reference: multiple-meter-checklist
claims:
  - id: multiple-windows-apply
    statement: OpenAI says a rolling five-hour usage period can be accompanied by weekly usage limits.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-16
    reviewAfter: 2026-09-30
  - id: spark-has-separate-limit
    statement: OpenAI says GPT-5.3-Codex-Spark has a separate usage limit that may be adjusted with demand.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-16
    reviewAfter: 2026-09-30
  - id: read-each-labeled-meter
    statement: When Codex labels several quota rows, the safest interpretation is to track each labeled window and timestamp separately.
    sourceIds:
      - openai-codex-pricing
    factStatus: inference
    verifiedAt: 2026-09-16
    reviewAfter: 2026-09-30
---

## Quick answer

Codex can show more than one active quota scope. When Codex labels several quota rows, the safest interpretation is to track each labeled window and timestamp separately. :claim[read-each-labeled-meter]

## Steps

:::evidence{#multiple-meter-checklist}
### Separate windows by label

OpenAI says a rolling five-hour usage period can be accompanied by weekly usage limits. :claim[multiple-windows-apply]

For each displayed row, capture its label, remaining percentage, reset date, reset time, and timezone. Do not average percentages or reuse one reset time for another row.

### Keep model-specific meters separate

OpenAI says GPT-5.3-Codex-Spark has a separate usage limit that may be adjusted with demand. :claim[spark-has-separate-limit]

If `/status` groups rows under a model name, preserve that model label. CodeReset can display the general weekly meter and model-specific five-hour or weekly meters as separate cards.
:::

## Boundary conditions

Labels and available models can change across plans, clients, and staged releases. This guide explains how to read the rows; it does not claim that every account receives the same set of meters.

## FAQ

### Should I add the remaining percentages together?

No. The rows can represent different windows or model scopes, so adding them would create a percentage with no useful meaning.

### Which reset time should I use?

Use the reset time attached to the specific quota you need. If several rows matter, create a separate countdown for each one.

## Related

- [How the Codex 5-hour limit resets](/guides/5-hour-limit)
- [When does the Codex weekly limit reset?](/guides/weekly-limit)

