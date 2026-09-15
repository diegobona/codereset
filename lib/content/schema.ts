import { z } from "zod";

const dateString = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "must be a YYYY-MM-DD date")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
    }, "must be a real calendar date"),
);

const sha256 = z.string().regex(/^[a-f0-9]{64}$/i, "must be a SHA-256 checksum");

const sourceBase = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  publisher: z.string().min(1),
  tier: z.number().int().min(1).max(3),
  checkedAt: dateString,
});

export const webSourceSchema = sourceBase
  .extend({
    evidenceType: z.literal("web-page"),
    url: z.string().url(),
  })
  .strict();

export const screenshotSourceSchema = sourceBase
  .extend({
    evidenceType: z.literal("product-ui-screenshot"),
    screenshot: z
      .object({
        path: z.string().min(1),
        capturedAt: z.string().datetime({ offset: true }),
        sha256,
      })
      .strict(),
  })
  .strict();

export const sourceSchema = z.discriminatedUnion("evidenceType", [
  webSourceSchema,
  screenshotSourceSchema,
]);

export const sourceRegistrySchema = z.array(sourceSchema).min(1);

export const factStatusSchema = z.enum([
  "official",
  "observed",
  "inference",
  "unknown",
]);

export const claimSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    statement: z.string().min(1),
    sourceIds: z.array(z.string().min(1)).min(1),
    factStatus: factStatusSchema,
    verifiedAt: dateString,
    reviewAfter: dateString,
  })
  .strict();

export const contentMetaSchema = z
  .object({
    title: z.string().min(20).max(65),
    description: z.string().min(80).max(165),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    eyebrow: z.string().min(1),
    intent: z.enum(["error", "time", "rule", "limit", "operation", "update"]),
    primaryQuery: z.string().trim().min(1),
    reviewedAt: dateString,
    reviewAfter: dateString,
    demandEvidence: z
      .object({
        type: z.enum(["existing-route", "gsc-query", "user-report", "support-log"]),
        reference: z.string().min(1),
      })
      .strict(),
    uniqueValue: z
      .object({
        type: z.enum([
          "calculator",
          "decision-table",
          "verified-screenshot",
          "troubleshooting-tree",
          "change-log",
          "download",
        ]),
        reference: z.string().regex(/^[a-z0-9-]+$/),
      })
      .strict(),
    claims: z.array(claimSchema).min(1),
  })
  .strict();

export const limitRowSchema = z
  .object({
    plan: z.string().min(1),
    model: z.string().min(1),
    range: z.string().min(1),
    window: z.string().min(1),
    effectiveFrom: dateString,
    sourceIds: z.array(z.string().min(1)).min(1),
    factStatus: factStatusSchema,
    verifiedAt: dateString,
    reviewAfter: dateString,
  })
  .strict();

export type ContentMeta = z.infer<typeof contentMetaSchema>;
export type ContentSource = z.infer<typeof sourceSchema>;
export type ContentClaim = z.infer<typeof claimSchema>;
export type LimitRow = z.infer<typeof limitRowSchema>;
