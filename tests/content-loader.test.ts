import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import {
  validateContentDocuments,
  validateLimitRows,
  validateSourceRegistry,
} from "@/lib/content/load";

const NOW = new Date("2026-09-15T12:00:00.000Z");

const officialSource = {
  id: "openai-pricing",
  publisher: "OpenAI",
  tier: 1,
  checkedAt: "2026-09-15",
  evidenceType: "web-page",
  url: "https://learn.chatgpt.com/docs/pricing",
};

const observedSource = {
  id: "independent-observation",
  publisher: "CodeReset",
  tier: 2,
  checkedAt: "2026-09-15",
  evidenceType: "web-page",
  url: "https://codereset.dev/methodology",
};

function validMeta(overrides: Record<string, unknown> = {}) {
  return {
    title: "How to check a Codex five-hour reset",
    description:
      "Use the reset timestamp shown by Codex, distinguish the active windows, and verify the result safely in your own account.",
    slug: "five-hour-reset",
    eyebrow: "WINDOW NOTE / TEST",
    intent: "operation",
    primaryQuery: "how to check codex five hour reset",
    reviewedAt: "2026-09-15",
    reviewAfter: "2026-09-22",
    demandEvidence: {
      type: "existing-route",
      reference: "/guides/five-hour-reset",
    },
    uniqueValue: {
      type: "troubleshooting-tree",
      reference: "reset-checklist",
    },
    claims: [
      {
        id: "account-reset-time",
        statement: "The usage dashboard shows current reset times.",
        sourceIds: ["openai-pricing"],
        factStatus: "official",
        verifiedAt: "2026-09-15",
        reviewAfter: "2026-09-22",
      },
    ],
    ...overrides,
  };
}

function validBody(options: { claimMarkers?: number; evidenceId?: string } = {}) {
  const marker = Array.from(
    { length: options.claimMarkers ?? 1 },
    () => ":claim[account-reset-time]",
  ).join("\n");
  return `## Quick answer

Use the current reset time shown for your account. ${marker}

## Steps

:::evidence{#${options.evidenceId ?? "reset-checklist"}}
### Read the official status

Open the usage view and copy its current reset time.

- Keep the timezone with the timestamp.
- Verify the meter after the countdown ends.
:::

## Boundary conditions

The local countdown does not read your account again.

## FAQ

### Does this page reset my quota?

No. It only explains and tracks a time supplied by you.

## Related

- [Weekly reset guide](/guides/weekly-limit)
`;
}

function document(
  metaOverrides: Record<string, unknown> = {},
  body = validBody(),
) {
  const meta = validMeta(metaOverrides) as Record<string, unknown>;
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined) delete meta[key];
  }
  return {
    filePath: `${String(meta.slug ?? "guide")}.md`,
    source: matter.stringify(body, meta),
  };
}

function validate(
  documents = [document()],
  sources: unknown = [officialSource, observedSource],
) {
  return validateContentDocuments({ documents, sources, now: NOW });
}

describe("source-backed content validation", () => {
  it("rejects a claim without a source", () => {
    expect(() =>
      validate([
        document({
          claims: [
            {
              ...validMeta().claims[0],
              sourceIds: [],
            },
          ],
        }),
      ]),
    ).toThrow(/source/i);
  });

  it("rejects an unknown source ID", () => {
    expect(() =>
      validate([
        document({
          claims: [
            {
              ...validMeta().claims[0],
              sourceIds: ["missing-source"],
            },
          ],
        }),
      ]),
    ).toThrow(/unknown source.*missing-source/i);
  });

  it("allows official claims only from OpenAI primary evidence", () => {
    expect(() =>
      validate([
        document({
          claims: [
            {
              ...validMeta().claims[0],
              sourceIds: ["independent-observation"],
            },
          ],
        }),
      ]),
    ).toThrow(/official.*primary.*OpenAI/i);
  });

  it("requires every claim marker exactly once in the Markdown AST", () => {
    expect(() => validate([document({}, validBody({ claimMarkers: 0 }))])).toThrow(
      /account-reset-time.*exactly once/i,
    );
    expect(() => validate([document({}, validBody({ claimMarkers: 2 }))])).toThrow(
      /account-reset-time.*exactly once/i,
    );
  });

  it("rejects duplicate slugs and normalized primary search intents", () => {
    expect(() => validate([document(), document()])).toThrow(/duplicate slug/i);
    expect(() =>
      validate([
        document(),
        document({
          slug: "another-guide",
          demandEvidence: {
            type: "existing-route",
            reference: "/guides/another-guide",
          },
          primaryQuery: "  HOW TO CHECK CODEX FIVE HOUR RESET  ",
        }),
      ]),
    ).toThrow(/duplicate primary.*query/i);
  });

  it("rejects expired page and claim review dates", () => {
    expect(() => validate([document({ reviewAfter: "2026-09-14" })])).toThrow(
      /page.*reviewAfter.*expired/i,
    );
    expect(() =>
      validate([
        document({
          claims: [
            { ...validMeta().claims[0], reviewAfter: "2026-09-14" },
          ],
        }),
      ]),
    ).toThrow(/claim.*reviewAfter.*expired/i);
  });

  it("enforces 14-day official and 7-day observed freshness", () => {
    expect(() =>
      validate([
        document({
          claims: [
            { ...validMeta().claims[0], verifiedAt: "2026-09-01" },
          ],
        }),
      ]),
    ).not.toThrow();
    expect(() =>
      validate([
        document({
          claims: [
            { ...validMeta().claims[0], verifiedAt: "2026-08-31" },
          ],
        }),
      ]),
    ).toThrow(/official.*14 days/i);

    const observedClaim = {
      ...validMeta().claims[0],
      sourceIds: ["independent-observation"],
      factStatus: "observed",
      verifiedAt: "2026-09-08",
    };
    expect(() => validate([document({ claims: [observedClaim] })])).not.toThrow();
    expect(() =>
      validate([
        document({
          claims: [{ ...observedClaim, verifiedAt: "2026-09-07" }],
        }),
      ]),
    ).toThrow(/observed.*7 days/i);
  });

  it("requires a unique value backed by an existing evidence directive", () => {
    expect(() => validate([document({ uniqueValue: undefined })])).toThrow(
      /uniqueValue/i,
    );
    expect(() =>
      validate([
        document(
          {
            uniqueValue: {
              type: "troubleshooting-tree",
              reference: "missing-evidence",
            },
          },
          validBody(),
        ),
      ]),
    ).toThrow(/uniqueValue.*missing-evidence.*evidence/i);
  });

  it("sanitizes raw HTML and dangerous Markdown links while retaining claim evidence", () => {
    const loaded = validate([
      document(
        {},
        `${validBody()}\n<script>alert(1)</script>\n[unsafe](javascript:alert(1))`,
      ),
    ])[0];

    expect(loaded.html).not.toMatch(/<script|javascript:|alert\(1\)/i);
    expect(loaded.html).toContain('data-claim-id="account-reset-time"');
    expect(loaded.evidence[0]).toMatchObject({
      id: "account-reset-time",
      factStatus: "official",
      verifiedAt: "2026-09-15",
      reviewAfter: "2026-09-22",
      sources: [{ id: "openai-pricing", publisher: "OpenAI", tier: 1 }],
    });
  });
});

describe("source registry", () => {
  it("requires stable identity and either a URL or complete local screenshot evidence", () => {
    expect(() =>
      validateSourceRegistry([{ ...officialSource, publisher: undefined }]),
    ).toThrow(/publisher/i);
    expect(() =>
      validateSourceRegistry([{ ...officialSource, url: undefined }]),
    ).toThrow(/url|screenshot/i);
  });

  it("validates local screenshot existence and SHA-256", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "codereset-source-"));
    const screenshotPath = "evidence/openai-usage-2026-09-15.png";
    const bytes = Buffer.from("test-only screenshot fixture");
    const absolutePath = join(rootDir, screenshotPath);
    mkdirSync(join(rootDir, "evidence"), { recursive: true });
    writeFileSync(absolutePath, bytes);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const screenshotSource = {
      id: "openai-ui-screenshot",
      publisher: "OpenAI",
      tier: 1,
      checkedAt: "2026-09-15",
      evidenceType: "product-ui-screenshot",
      screenshot: {
        path: screenshotPath,
        capturedAt: "2026-09-15T08:00:00.000Z",
        sha256,
      },
    };

    expect(() => validateSourceRegistry([screenshotSource], { rootDir })).not.toThrow();
    expect(() =>
      validateSourceRegistry(
        [{ ...screenshotSource, screenshot: { ...screenshotSource.screenshot, sha256: "0".repeat(64) } }],
        { rootDir },
      ),
    ).toThrow(/SHA-256/i);
  });
});

describe("limits data rows", () => {
  const validRow = {
    plan: "Pro",
    model: "Codex",
    range: "Account-specific estimate",
    window: "five-hour",
    effectiveFrom: "2026-09-15",
    sourceIds: ["openai-pricing"],
    factStatus: "official",
    verifiedAt: "2026-09-15",
    reviewAfter: "2026-09-22",
  };

  it("requires source, status, verifiedAt, and reviewAfter on every row", () => {
    for (const field of ["sourceIds", "factStatus", "verifiedAt", "reviewAfter"]) {
      const row = { ...validRow } as Record<string, unknown>;
      delete row[field];
      expect(() =>
        validateLimitRows({ rows: [row], sources: [officialSource], now: NOW }),
      ).toThrow(new RegExp(field, "i"));
    }
  });

  it("does not allow a row to cite an unknown or non-primary source as official", () => {
    expect(() =>
      validateLimitRows({
        rows: [{ ...validRow, sourceIds: ["missing-source"] }],
        sources: [officialSource],
        now: NOW,
      }),
    ).toThrow(/unknown source/i);
    expect(() =>
      validateLimitRows({
        rows: [{ ...validRow, sourceIds: ["independent-observation"] }],
        sources: [officialSource, observedSource],
        now: NOW,
      }),
    ).toThrow(/official.*primary.*OpenAI/i);
  });

  it("validates every limits row independently without page-level inheritance", () => {
    expect(() =>
      validateLimitRows({
        rows: [
          validRow,
          { ...validRow, plan: "Business", window: "weekly" },
        ],
        sources: [officialSource],
        now: NOW,
      }),
    ).not.toThrow();
  });
});

describe("content build gate", () => {
  it("runs the real-time content validator before every Next build", () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(existsSync(join(process.cwd(), "scripts", "validate-content.mjs"))).toBe(
      true,
    );
    expect(packageJson.scripts["content:check"]).toContain(
      "scripts/validate-content.mjs",
    );
    expect(packageJson.scripts.prebuild).toBe("npm run content:check");
    expect(packageJson.scripts["content:check"]).not.toMatch(/npm run build/);
  });
});
