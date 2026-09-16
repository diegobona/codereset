---
title: How to make Codex usage last longer
description: Apply OpenAI's documented ways to reduce unnecessary context and use a better-matched model before your next five-hour or weekly reset.
slug: make-codex-usage-last-longer
eyebrow: HOW TO / 10
intent: operation
primaryQuery: how to make Codex usage last longer
reviewedAt: 2026-09-16
reviewAfter: 2026-09-30
demandEvidence:
  type: user-report
  reference: recurring-codex-usage-efficiency-question-2026-09-16
uniqueValue:
  type: troubleshooting-tree
  reference: usage-efficiency-checklist
claims:
  - id: official-efficiency-actions
    statement: OpenAI recommends focused prompts, limited source material, scoped outputs, lean AGENTS.md files, fewer unnecessary MCP servers, and smaller models to make usage last longer.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-16
    reviewAfter: 2026-09-30
  - id: usage-is-variable
    statement: OpenAI says apparently similar tasks can consume different amounts because model, context, reasoning, tools, retrieval, and caching affect usage.
    sourceIds:
      - openai-codex-pricing
    factStatus: official
    verifiedAt: 2026-09-16
    reviewAfter: 2026-09-30
---

## Quick answer

Reduce irrelevant context before reducing the quality of the task. OpenAI recommends focused prompts, limited source material, scoped outputs, lean AGENTS.md files, fewer unnecessary MCP servers, and smaller models to make usage last longer. :claim[official-efficiency-actions]

## Steps

:::evidence{#usage-efficiency-checklist}
### Before the task

- State the required outcome and separate it from optional improvements.
- Attach only relevant files, folders, and date ranges.
- Trim duplicated or overly broad instructions from AGENTS.md.
- Disable MCP servers that are not needed for this task.
- Choose a smaller model when the work is bounded and routine.

### During and after the task

Ask for the output format and length you actually need. Split unrelated goals into separate tasks, and check `/status` after representative work instead of estimating from message count.

OpenAI says apparently similar tasks can consume different amounts because model, context, reasoning, tools, retrieval, and caching affect usage. :claim[usage-is-variable]
:::

## Boundary conditions

Efficiency is workload-dependent. A smaller model or shorter prompt is not automatically cheaper if it causes repeated failed attempts, and CodeReset cannot predict the cost of an unfinished task.

## FAQ

### Should I remove all project instructions?

No. Keep instructions that prevent mistakes and remove only duplicated, stale, or irrelevant context. The goal is a focused task, not an under-specified one.

### Should I disable every MCP server?

Disable servers that are not needed for the current work. Keep the integrations required to complete the task correctly.

## Related

- [What counts toward Codex usage?](/guides/what-counts-toward-codex-usage)
- [Can switching Codex models save usage?](/guides/switch-codex-models-save-usage)

