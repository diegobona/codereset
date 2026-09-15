---
title: How to check remaining Codex usage
description: Find the five-hour and weekly meters, understand the percentages, and create a private reset countdown.
slug: check-codex-usage
eyebrow: STATUS NOTE / 04
intent: operation
primaryQuery: how to check remaining Codex usage
reviewedAt: 2026-09-15
reviewAfter: 2026-09-22
demandEvidence:
  type: existing-route
  reference: /guides/check-codex-usage
uniqueValue:
  type: troubleshooting-tree
  reference: usage-capture-checklist
claims:
  - id: official-usage-tools
    statement: OpenAI documents the usage dashboard for current usage and reset times and the Codex CLI /status command for session information.
    sourceIds:
      - openai-codex-pricing
      - openai-codex-cli
    factStatus: official
    verifiedAt: 2026-09-15
    reviewAfter: 2026-09-29
  - id: usage-varies-by-work
    statement: OpenAI says usage varies with the task, model, context, reasoning, and tools involved.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-15
    reviewAfter: 2026-09-29
  - id: client-output-variation
    statement: A parser may not recognize every client output format, so the official displayed values must remain the fallback.
    sourceIds:
      - openai-codex-pricing
      - openai-codex-cli
    factStatus: inference
    verifiedAt: 2026-09-15
    reviewAfter: 2026-09-22
---

## Quick answer

OpenAI documents the usage dashboard for current usage and reset times and the Codex CLI /status command for session information. :claim[official-usage-tools] Copy only the quota values and timestamps you need.

## Steps

:::evidence{#usage-capture-checklist}
### Capture the useful fields

- Five-hour percentage remaining.
- Five-hour reset date, time, and timezone.
- Weekly percentage remaining.
- Weekly reset date, time, and timezone.

Do not paste credentials, API keys, conversation text, or unrelated terminal output.

### Paste locally or use manual setup

A parser may not recognize every client output format, so the official displayed values must remain the fallback. :claim[client-output-variation]

If parsing fails, enter the values manually. Saved values remain in this browser's local storage; clearing site data or using another device starts with an empty desk.
:::

## Boundary conditions

OpenAI says usage varies with the task, model, context, reasoning, and tools involved. :claim[usage-varies-by-work] A remaining percentage is therefore not a fixed published number of prompts, and CodeReset cannot predict exact task capacity.

## FAQ

### Does CodeReset upload pasted status text?

No. Parsing and storage happen in the browser in this release.

### Why did the parser miss my output?

Client output can vary. Use manual setup and enter the exact values from the official usage view.

## Related

- [How the five-hour limit resets](/guides/5-hour-limit)
- [When the weekly limit resets](/guides/weekly-limit)
