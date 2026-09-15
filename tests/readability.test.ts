import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

function ruleFor(selector: string) {
  const start = styles.indexOf(`${selector} {`);
  if (start === -1) return "";
  return styles.slice(start, styles.indexOf("}", start) + 1);
}

describe("site readability", () => {
  it("does not declare interface text smaller than 12px", () => {
    const shorthandSizes = [...styles.matchAll(/font:\s*[^;{}]*?\b(\d+(?:\.\d+)?)px\s*\//g)]
      .map((match) => Number(match[1]));
    const explicitSizes = [...styles.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)]
      .map((match) => Number(match[1]));

    expect([...shorthandSizes, ...explicitSizes].filter((size) => size < 12))
      .toEqual([]);
  });

  it("gives the primary and sample actions explicit dark text", () => {
    expect(ruleFor(".button-primary")).toMatch(/color:\s*var\(--ink\)/);
    expect(ruleFor(".text-button")).toMatch(/color:\s*var\(--ink\)/);
  });
});
