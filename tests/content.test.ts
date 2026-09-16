import { describe, expect, it } from "vitest";
import { guides } from "@/lib/content";

describe("guide content", () => {
  it("covers the complete first-priority rule and operation cluster", () => {
    expect(guides.map((guide) => guide.slug).sort()).toEqual([
      "5-hour-limit",
      "banked-resets",
      "check-codex-usage",
      "codex-limit-reached",
      "codex-local-cloud-shared-limits",
      "make-codex-usage-last-longer",
      "switch-codex-models-save-usage",
      "weekly-limit",
      "what-counts-toward-codex-usage",
      "why-codex-shows-multiple-limits",
    ]);

    const intents = Object.fromEntries(
      guides.map((guide) => [guide.slug, guide.intent]),
    );
    expect(intents).toMatchObject({
      "what-counts-toward-codex-usage": "rule",
      "why-codex-shows-multiple-limits": "rule",
      "codex-local-cloud-shared-limits": "rule",
      "switch-codex-models-save-usage": "rule",
      "codex-limit-reached": "operation",
      "make-codex-usage-last-longer": "operation",
    });
    expect(guides.filter((guide) => guide.intent === "rule")).toHaveLength(7);
    expect(guides.filter((guide) => guide.intent === "operation")).toHaveLength(3);
  });

  it("has unique titles and descriptions", () => {
    expect(new Set(guides.map((guide) => guide.title)).size).toBe(guides.length);
    expect(new Set(guides.map((guide) => guide.description)).size).toBe(guides.length);
  });

  it("includes complete article and FAQ fields", () => {
    for (const guide of guides) {
      expect(guide.eyebrow.length).toBeGreaterThan(3);
      expect(guide.answer.length).toBeGreaterThan(80);
      expect(guide.sections.length).toBeGreaterThanOrEqual(2);
      expect(guide.faqs.length).toBeGreaterThanOrEqual(2);
      expect(guide.related.length).toBeGreaterThanOrEqual(2);
      expect(guide.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
