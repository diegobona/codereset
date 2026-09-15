import { describe, expect, it } from "vitest";
import { guides } from "@/lib/content";

describe("guide content", () => {
  it("covers the four required search intents", () => {
    expect(guides.map((guide) => guide.slug).sort()).toEqual([
      "5-hour-limit",
      "banked-resets",
      "check-codex-usage",
      "weekly-limit",
    ]);
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
