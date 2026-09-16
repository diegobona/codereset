import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { BrandMark } from "@/components/icons";

function projectFile(...parts: string[]) {
  return join(process.cwd(), ...parts);
}

function readPngSize(path: string) {
  const bytes = readFileSync(path);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

describe("CodeReset brand assets", () => {
  it("uses one high-contrast reset-and-terminal mark in the interface", () => {
    const markup = renderToStaticMarkup(<BrandMark />);

    expect(markup).toContain('data-brand-mark="codereset"');
    expect(markup).toContain("#c7ff3c");
    expect(markup).toContain("#10120f");
  });

  it("ships browser, Apple, and installable app icons at their declared sizes", () => {
    expect(readPngSize(projectFile("app", "icon.png"))).toEqual({
      width: 512,
      height: 512,
    });
    expect(readPngSize(projectFile("app", "apple-icon.png"))).toEqual({
      width: 180,
      height: 180,
    });
    expect(readPngSize(projectFile("public", "icons", "icon-192.png"))).toEqual({
      width: 192,
      height: 192,
    });
    expect(readPngSize(projectFile("public", "icons", "icon-512.png"))).toEqual({
      width: 512,
      height: 512,
    });

    const favicon = readFileSync(projectFile("app", "favicon.ico"));
    expect([...favicon.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
  });

  it("publishes the generated icons through the web app manifest", () => {
    expect(manifest().icons).toEqual([
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);
  });
});
