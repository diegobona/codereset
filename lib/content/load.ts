import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import matter from "gray-matter";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import {
  contentMetaSchema,
  limitRowSchema,
  sourceRegistrySchema,
  type ContentClaim,
  type ContentMeta,
  type ContentSource,
  type LimitRow,
} from "./schema";

type AstNode = {
  type: string;
  name?: string;
  depth?: number;
  value?: string;
  url?: string;
  attributes?: Record<string, string>;
  children?: AstNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
};

export type ContentDocument = { filePath: string; source: string };

export type ClaimEvidence = ContentClaim & { sources: ContentSource[] };

export type LoadedGuide = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  answer: string;
  lastReviewed: string;
  reviewAfter: string;
  intent: ContentMeta["intent"];
  primaryQuery: string;
  demandEvidence: ContentMeta["demandEvidence"];
  uniqueValue: ContentMeta["uniqueValue"];
  sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>;
  faqs: Array<{ question: string; answer: string }>;
  related: string[];
  html: string;
  evidence: ClaimEvidence[];
};

const OPENAI_PRIMARY_HOSTS = new Set([
  "learn.chatgpt.com",
  "developers.openai.com",
  "platform.openai.com",
]);

const DAY_MS = 24 * 60 * 60 * 1000;

function fail(message: string): never {
  throw new Error(`Content validation failed: ${message}`);
}

function dateAtUtcStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function utcDate(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function ensureNotFuture(value: string, label: string, now: Date) {
  if (dateAtUtcStart(value) > utcDate(now)) fail(`${label} is in the future`);
}

function ensureReviewCurrent(value: string, label: string, now: Date) {
  if (dateAtUtcStart(value) < utcDate(now)) fail(`${label} reviewAfter is expired`);
}

function ensureFresh(
  verifiedAt: string,
  factStatus: ContentClaim["factStatus"],
  label: string,
  now: Date,
) {
  ensureNotFuture(verifiedAt, `${label} verifiedAt`, now);
  const maxDays = factStatus === "observed" ? 7 : factStatus === "official" ? 14 : null;
  if (maxDays === null) return;
  const age = (utcDate(now).valueOf() - dateAtUtcStart(verifiedAt).valueOf()) / DAY_MS;
  if (age > maxDays) fail(`${label} ${factStatus} evidence is older than ${maxDays} days`);
}

function isOpenAiPrimary(source: ContentSource) {
  if (source.publisher !== "OpenAI" || source.tier !== 1) return false;
  if (source.evidenceType === "product-ui-screenshot") return true;
  return OPENAI_PRIMARY_HOSTS.has(new URL(source.url).hostname.toLowerCase());
}

function plainText(node: AstNode): string {
  if (node.type === "textDirective" && node.name === "claim") return "";
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(plainText).join("").trim();
}

function walk(node: AstNode, visit: (node: AstNode) => void) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

function parseDirectiveIds(tree: AstNode) {
  const claimIds: string[] = [];
  const evidenceIds = new Set<string>();
  walk(tree, (node) => {
    if (node.type === "textDirective" && node.name === "claim") {
      const id = plainText({ ...node, type: "directive-label" });
      if (!/^[a-z0-9-]+$/.test(id)) fail(`invalid claim marker ${id || "(empty)"}`);
      claimIds.push(id);
    }
    if (node.type === "containerDirective" && node.name === "evidence") {
      const id = node.attributes?.id;
      if (!id || !/^[a-z0-9-]+$/.test(id)) fail("evidence directive requires a stable id");
      if (evidenceIds.has(id)) fail(`duplicate evidence directive ${id}`);
      evidenceIds.add(id);
    }
  });
  return { claimIds, evidenceIds };
}

function directiveToHtml() {
  return (tree: AstNode) => {
    walk(tree, (node) => {
      if (node.type === "textDirective" && node.name === "claim") {
        const id = plainText({ ...node, type: "directive-label" });
        node.data = {
          hName: "sup",
          hProperties: { dataClaimId: id, ariaLabel: `Source for ${id}` },
        };
        node.children = [{ type: "text", value: "[source]" }];
      }
      if (node.type === "containerDirective" && node.name === "evidence") {
        node.data = {
          hName: "div",
          hProperties: { dataEvidenceId: node.attributes?.id },
        };
      }
    });
  };
}

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div ?? []), "dataEvidenceId"],
    sup: [
      ...(defaultSchema.attributes?.sup ?? []),
      "dataClaimId",
      "ariaLabel",
    ],
  },
};

function renderHtml(source: string) {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(directiveToHtml)
      .use(remarkRehype)
      .use(rehypeSanitize, sanitizeSchema)
      .use(rehypeStringify)
      .processSync(source),
  );
}

function processBodyChildren(
  nodes: AstNode[],
  onNode: (node: AstNode) => void,
) {
  for (const node of nodes) {
    if (node.type === "containerDirective") {
      processBodyChildren(node.children ?? [], onNode);
    } else {
      onNode(node);
    }
  }
}

function listValues(node: AstNode) {
  return (node.children ?? []).map((item) => plainText(item)).filter(Boolean);
}

function linksIn(node: AstNode) {
  const links: string[] = [];
  walk(node, (child) => {
    if (child.type === "link" && child.url) links.push(child.url);
  });
  return links;
}

function parseGuideStructure(tree: AstNode, filePath: string) {
  let area = "";
  let answer = "";
  let currentSection: LoadedGuide["sections"][number] | null = null;
  let currentFaq: LoadedGuide["faqs"][number] | null = null;
  const sections: LoadedGuide["sections"] = [];
  const faqs: LoadedGuide["faqs"] = [];
  const related: string[] = [];
  const requiredAreas = new Set<string>();

  processBodyChildren(tree.children ?? [], (node) => {
    if (node.type === "heading" && node.depth === 2) {
      area = plainText(node).toLowerCase();
      requiredAreas.add(area);
      currentSection = null;
      currentFaq = null;
      if (area === "boundary conditions") {
        currentSection = { heading: "Boundary conditions", paragraphs: [] };
        sections.push(currentSection);
      }
      return;
    }

    if (node.type === "heading" && node.depth === 3) {
      if (area === "faq") {
        currentFaq = { question: plainText(node), answer: "" };
        faqs.push(currentFaq);
      } else if (area === "steps" || area === "boundary conditions") {
        currentSection = { heading: plainText(node), paragraphs: [] };
        sections.push(currentSection);
      }
      return;
    }

    if (node.type === "paragraph") {
      const text = plainText(node).trim();
      if (!text) return;
      if (area === "quick answer" && !answer) answer = text;
      else if (area === "faq" && currentFaq) {
        currentFaq.answer = [currentFaq.answer, text].filter(Boolean).join(" ");
      } else if (currentSection) currentSection.paragraphs.push(text);
      return;
    }

    if (node.type === "list") {
      if (area === "related") {
        for (const url of linksIn(node)) {
          const match = /^\/guides\/([a-z0-9-]+)$/.exec(url);
          if (match) related.push(match[1]);
        }
      } else if (currentSection) {
        currentSection.bullets = listValues(node);
      }
    }
  });

  for (const required of ["quick answer", "steps", "boundary conditions", "faq", "related"]) {
    if (!requiredAreas.has(required)) fail(`${filePath} is missing the ${required} section`);
  }
  if (!answer) fail(`${filePath} has no quick answer`);
  if (!sections.length) fail(`${filePath} has no steps`);
  if (!faqs.length || faqs.some((faq) => !faq.question || !faq.answer)) {
    fail(`${filePath} has an incomplete FAQ`);
  }
  if (!related.length) fail(`${filePath} has no related guides`);

  return { answer, sections, faqs, related };
}

export function validateSourceRegistry(
  input: unknown,
  options: { rootDir?: string } = {},
) {
  const parsed = sourceRegistrySchema.safeParse(input);
  if (!parsed.success) fail(`source registry: ${parsed.error.message}`);

  const ids = new Set<string>();
  for (const source of parsed.data) {
    if (ids.has(source.id)) fail(`duplicate source ID ${source.id}`);
    ids.add(source.id);
    if (source.evidenceType === "product-ui-screenshot") {
      const rootDir = resolve(options.rootDir ?? process.cwd());
      const evidencePath = resolve(rootDir, source.screenshot.path);
      if (!evidencePath.startsWith(`${rootDir}${sep}`) || !existsSync(evidencePath)) {
        fail(`screenshot does not exist for source ${source.id}`);
      }
      const actual = createHash("sha256")
        .update(readFileSync(evidencePath))
        .digest("hex");
      if (actual.toLowerCase() !== source.screenshot.sha256.toLowerCase()) {
        fail(`SHA-256 mismatch for source ${source.id}`);
      }
    }
  }
  return parsed.data;
}

type FactReference = Pick<
  ContentClaim,
  "sourceIds" | "factStatus" | "verifiedAt" | "reviewAfter"
>;

function validateFactReference(
  fact: FactReference,
  sourceMap: Map<string, ContentSource>,
  now: Date,
  label: string,
) {
  ensureReviewCurrent(fact.reviewAfter, label, now);
  ensureFresh(fact.verifiedAt, fact.factStatus, label, now);
  for (const sourceId of fact.sourceIds) {
    const source = sourceMap.get(sourceId);
    if (!source) fail(`${label} references unknown source ${sourceId}`);
    ensureNotFuture(source.checkedAt, `source ${sourceId} checkedAt`, now);
    ensureFresh(source.checkedAt, fact.factStatus, `source ${sourceId}`, now);
    if (fact.factStatus === "official" && !isOpenAiPrimary(source)) {
      fail(`${label} official fact must cite primary OpenAI evidence`);
    }
  }
}

function validateReferences(
  claims: ContentClaim[],
  sources: ContentSource[],
  now: Date,
  label: string,
) {
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const claimIds = new Set<string>();
  for (const claim of claims) {
    if (claimIds.has(claim.id)) fail(`${label} has duplicate claim ${claim.id}`);
    claimIds.add(claim.id);
    validateFactReference(claim, sourceMap, now, `claim ${claim.id}`);
  }
  return sourceMap;
}

export function validateContentDocuments(input: {
  documents: ContentDocument[];
  sources: unknown;
  now?: Date;
  rootDir?: string;
}) {
  const now = input.now ?? new Date();
  const sources = validateSourceRegistry(input.sources, { rootDir: input.rootDir });
  const slugs = new Set<string>();
  const queries = new Set<string>();

  return input.documents.map(({ filePath, source }) => {
    const parsedMatter = matter(source);
    const parsedMeta = contentMetaSchema.safeParse(parsedMatter.data);
    if (!parsedMeta.success) fail(`${filePath} frontmatter: ${parsedMeta.error.message}`);
    const meta = parsedMeta.data;
    if (slugs.has(meta.slug)) fail(`duplicate slug ${meta.slug}`);
    slugs.add(meta.slug);
    const normalizedQuery = meta.primaryQuery.trim().toLowerCase().replace(/\s+/g, " ");
    if (queries.has(normalizedQuery)) fail(`duplicate primary query ${meta.primaryQuery}`);
    queries.add(normalizedQuery);

    ensureNotFuture(meta.reviewedAt, `${filePath} reviewedAt`, now);
    ensureReviewCurrent(meta.reviewAfter, `page ${filePath}`, now);
    if (
      meta.demandEvidence.type === "existing-route" &&
      meta.demandEvidence.reference !== `/guides/${meta.slug}`
    ) {
      fail(`${filePath} existing-route demand evidence must match its guide URL`);
    }

    const tree = unified().use(remarkParse).use(remarkDirective).parse(parsedMatter.content) as AstNode;
    const { claimIds, evidenceIds } = parseDirectiveIds(tree);
    const knownClaimIds = new Set(meta.claims.map((claim) => claim.id));
    for (const marker of claimIds) {
      if (!knownClaimIds.has(marker)) fail(`${filePath} references unknown claim ${marker}`);
    }
    for (const claim of meta.claims) {
      const count = claimIds.filter((id) => id === claim.id).length;
      if (count !== 1) fail(`claim ${claim.id} must appear exactly once in ${filePath}`);
    }
    if (!evidenceIds.has(meta.uniqueValue.reference)) {
      fail(`uniqueValue ${meta.uniqueValue.reference} has no matching evidence directive`);
    }

    const sourceMap = validateReferences(meta.claims, sources, now, filePath);
    const structure = parseGuideStructure(tree, filePath);
    if (structure.related.includes(meta.slug)) fail(`${filePath} cannot relate to itself`);

    return {
      slug: meta.slug,
      eyebrow: meta.eyebrow,
      title: meta.title,
      description: meta.description,
      answer: structure.answer,
      lastReviewed: meta.reviewedAt,
      reviewAfter: meta.reviewAfter,
      intent: meta.intent,
      primaryQuery: meta.primaryQuery,
      demandEvidence: meta.demandEvidence,
      uniqueValue: meta.uniqueValue,
      sections: structure.sections,
      faqs: structure.faqs,
      related: structure.related,
      html: renderHtml(parsedMatter.content),
      evidence: meta.claims.map((claim) => ({
        ...claim,
        sources: claim.sourceIds.map((sourceId) => sourceMap.get(sourceId)!),
      })),
    } satisfies LoadedGuide;
  });
}

export function validateLimitRows(input: {
  rows: unknown[];
  sources: unknown;
  now?: Date;
  rootDir?: string;
}) {
  const now = input.now ?? new Date();
  const sources = validateSourceRegistry(input.sources, { rootDir: input.rootDir });
  const parsedRows = input.rows.map((row, index) => {
    const parsed = limitRowSchema.safeParse(row);
    if (!parsed.success) fail(`limits row ${index}: ${parsed.error.message}`);
    return parsed.data;
  });
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  parsedRows.forEach((row, index) =>
    validateFactReference(row, sourceMap, now, `limits row ${index}`),
  );
  return parsedRows satisfies LimitRow[];
}

export function loadGuides(options: {
  contentDir?: string;
  sourcesFile?: string;
  now?: Date;
  rootDir?: string;
} = {}) {
  const rootDir = resolve(options.rootDir ?? process.cwd());
  const contentDir = resolve(options.contentDir ?? join(rootDir, "content", "guides"));
  const sourcesFile = resolve(options.sourcesFile ?? join(rootDir, "content", "sources.json"));
  const documents = readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => ({
      filePath: join(contentDir, entry.name),
      source: readFileSync(join(contentDir, entry.name), "utf8"),
    }));
  if (!documents.length) fail(`no Markdown guides found in ${contentDir}`);
  const sources = JSON.parse(readFileSync(sourcesFile, "utf8")) as unknown;
  return validateContentDocuments({ documents, sources, now: options.now, rootDir });
}
