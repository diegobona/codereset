# CodeReset SEO Growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 CodeReset 建成可持续更新、事实可追溯、能通过工具产生自然传播的 Codex reset/usage 英文主题站；90 天内容容量上限为 35–50 个 URL，但实际发布数量完全由需求、证据与独特价值门槛决定。

**Architecture:** 保持 Next.js 16 App Router 静态导出和 Cloudflare Pages，不为 SEO 引入运行时服务器。内容使用本地 Markdown + 严格 frontmatter schema 在构建期生成；实时公共信号和邮件订阅作为独立 Cloudflare Worker 服务，避免破坏静态站的可靠性。所有页面由一个共享 SEO/Schema 层、来源注册表和自动质量门约束。

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Markdown/remark, Zod, Cloudflare Pages, optional Cloudflare Worker + D1/KV, Google Search Console, Cloudflare Web Analytics.

**Specification:** `docs/seo-growth-spec.md`

---

## File map

### 修改

- `app/layout.tsx` — 全站 canonical、站点级 metadata 与默认分享图。
- `app/page.tsx` — 首页自引用 canonical、WebSite/SoftwareApplication/FAQ schema、内容导航和真实订阅入口。
- `app/sitemap.ts` — 从内容索引读取 URL 与真实修改日期。
- `app/robots.ts` — 保持主域名 sitemap 声明。
- `components/reset-desk.tsx` — 工具事件、ICS 品牌信息、可下载分享卡入口。
- `lib/reset.ts` — 可测试的时区换算与分享卡数据模型。
- `package.json` — SEO 校验、内容校验和审计脚本。

### 创建

- `lib/site.ts` — 域名、品牌、默认描述和社交账号常量。
- `lib/seo/metadata.ts` — 页面 metadata/canonical 生成器。
- `lib/seo/schema.ts` — WebSite、SoftwareApplication、Article、FAQ、Breadcrumb schema。
- `lib/content/schema.ts` — frontmatter 与来源字段校验。
- `lib/content/load.ts` — 构建期 Markdown 加载、索引和相关内容选择。
- `lib/content/route-manifest.ts` — 所有正式可索引 URL 的唯一发布清单；驱动静态参数与 sitemap。
- `content/{errors,rules,limits,guides,reset-time,updates}/*.md` — 内容源文件。
- `content/sources.json` — 官方来源注册表与复查周期。
- `components/article/article-layout.tsx` — 统一文章模板。
- `components/article/source-box.tsx` — 来源、事实状态和复查日期。
- `components/article/breadcrumbs.tsx` — 可见面包屑。
- `components/tools/reset-time-converter.tsx` — 时区换算与 ICS。
- `components/tools/share-card.tsx` — 浏览器本地生成图片卡片。
- `lib/analytics/events.ts` — 事件 allowlist、无敏感数据 payload 与客户端发送。
- `functions/api/events.ts` — 把经过校验的匿名事件写入 Cloudflare Analytics Engine。
- `app/errors/[slug]/page.tsx` — 报错意图模板。
- `app/rules/[slug]/page.tsx` — 规则意图模板。
- `app/limits/page.tsx`、`app/limits/[slug]/page.tsx` — 限额数据库。
- `app/reset-time/page.tsx`、`app/reset-time/[timezone]/page.tsx` — 时间意图模板。
- `app/updates/[slug]/page.tsx` — 更新与事件档案。
- `app/not-found.tsx` — 有用的 404 与核心入口。
- `app/{about,methodology,privacy,corrections}/page.tsx` — 信任、来源方法、隐私与更正政策。
- `public/og-default.png`、`public/og-guides.png` — 分享图。
- `scripts/validate-content.mjs` — 内容、来源新鲜度和唯一性检查。
- `scripts/validate-export.mjs` — 静态产物、canonical、索引与链接检查。
- `tests/seo.test.ts`、`tests/content-loader.test.ts`、`tests/reset-time.test.ts` — 回归测试。
- `docs/seo-scorecard.md` — 每周 GSC/CWV/转化记录。

### 独立后续子项目

- `worker/` — 公开信号读取、双重确认订阅与 Email-only 提醒；先生成并评审独立 implementation plan，再按本路线图中的接口和门槛实施。
- `extensions/` — Chrome/VS Code/Raycast 等分发。核心数据源稳定后分别写计划。

---

## Phase 0 — 技术与测量基础（第 1–2 天）

### Task 0: 立即隐藏未验证的价格与 SMS 承诺

**Files:**
- Create: `lib/features.ts`
- Create: `components/alert-offer.tsx`
- Modify: `app/page.tsx`
- Test: `tests/page.test.tsx`

- [ ] **Step 1: 写失败测试，要求默认公开首页不出现 `$9`、SMS 或可购买 live alert 的表述，并保留 `PRODUCT PREVIEW`；另测显式启用时原 `$9/SMS` offer 仍能渲染**
- [ ] **Step 2: 把现有 `$9/SMS` 卡片原样抽到 `AlertOffer`，由服务端构建变量 `NEXT_PUBLIC_SHOW_ALERT_OFFER === "true"` 控制；默认 false 时组件返回 null，不向前端 HTML/JS 输出隐藏文案**
- [ ] **Step 2A: 在真实订阅端点上线前，公开页面只保留不收集数据的 coming-later 提示；不得用 CSS `display:none` 暗藏可被索引的价格文案**
- [ ] **Step 3: 运行 `npm test -- tests/page.test.tsx && npm run build`**
- [ ] **Step 4: 提交并部署，避免未验证服务继续被索引**

```bash
git add app/page.tsx components/alert-offer.tsx lib/features.ts tests/page.test.tsx
git commit -m "fix: gate unvalidated alert offer"
```

### Task 1: 统一 canonical 域名与站点常量

**Files:**
- Create: `lib/site.ts`
- Create: `lib/seo/metadata.ts`
- Modify: `app/layout.tsx` — 只保留 `metadataBase` 与真正的全局默认值，不设置会被子页面继承的 canonical。
- Modify: `app/page.tsx` — 首页自引用 canonical。
- Modify: `app/guides/[slug]/page.tsx` — 每个现有指南自引用 canonical。
- Test: `tests/seo.test.ts`
- Cloudflare dashboard: Bulk Redirect `codereset.pages.dev/*` → `https://codereset.dev/:splat`
- Cloudflare dashboard: Bulk Redirect `www.codereset.dev/*` → `https://codereset.dev/:splat`; enable Always Use HTTPS.

- [ ] **Step 1: 写失败测试，要求首页 metadata 有自引用 canonical**

```ts
import { describe, expect, it } from "vitest";
import { buildMetadata } from "@/lib/seo/metadata";

describe("buildMetadata", () => {
  it("emits the canonical codereset.dev URL", () => {
    expect(buildMetadata({ path: "/", title: "CodeReset", description: "Reset desk" })
      .alternates?.canonical).toBe("https://codereset.dev/");
  });
});
```

- [ ] **Step 2: 运行测试并确认因模块不存在失败**

Run: `npm test -- tests/seo.test.ts`

Expected: FAIL with module-not-found for `lib/seo/metadata`.

- [ ] **Step 3: 创建站点常量与 metadata 生成器**

```ts
// lib/site.ts
export const SITE = {
  name: "CodeReset",
  origin: "https://codereset.dev",
  locale: "en_US",
} as const;
```

```ts
// lib/seo/metadata.ts
import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export function absoluteUrl(path: string) {
  return new URL(path, `${SITE.origin}/`).toString();
}

export function buildMetadata(input: { path: string; title: string; description: string }): Metadata {
  const canonical = absoluteUrl(input.path);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    openGraph: { title: input.title, description: input.description, url: canonical, images: ["/og-default.png"] },
    twitter: { card: "summary_large_image", title: input.title, description: input.description, images: ["/og-default.png"] },
  };
}
```

- [ ] **Step 4: 根布局只设置 `metadataBase`；在首页和每个路由的 `generateMetadata` 设置与实际 pathname 完全一致的自引用 canonical**

- [ ] **Step 5: 运行测试与构建**

Run: `npm test -- tests/seo.test.ts && npm run build`

Expected: PASS; every exported HTML page contains exactly one self-referencing canonical matching its pathname.

- [ ] **Step 6: 在 Cloudflare 配置 301**

按 Cloudflare Bulk Redirect 创建两条规则：

1. source `https://codereset.pages.dev` → target `https://codereset.dev`。
2. source `https://www.codereset.dev` → target `https://codereset.dev`。

两条均启用 subpath matching、preserve path suffix、preserve query string，状态 301；同时在 SSL/TLS 开启 Always Use HTTPS。

- [ ] **Step 7: 验证并提交**

Run:

```powershell
curl.exe -I https://codereset.pages.dev/guides/weekly-limit
curl.exe -I https://www.codereset.dev/guides/weekly-limit
curl.exe -I http://codereset.dev/guides/weekly-limit
```

Expected: all return one canonical redirect chain ending at `https://codereset.dev/guides/weekly-limit`.

```bash
git add app/layout.tsx app/page.tsx app/guides/[slug]/page.tsx lib/site.ts lib/seo/metadata.ts tests/seo.test.ts
git commit -m "feat: consolidate SEO canonicals"
```

### Task 2: 补齐结构化数据与分享图

**Files:**
- Create: `lib/seo/schema.ts`
- Create: `public/og-default.png`
- Create: `public/og-guides.png`
- Modify: `app/page.tsx`
- Modify: `app/guides/[slug]/page.tsx`
- Test: `tests/seo.test.ts`

- [ ] **Step 1: 写失败测试，要求 schema 与页面正文一致**
- [ ] **Step 2: 运行 `npm test -- tests/seo.test.ts` 确认失败**
- [ ] **Step 3: 实现纯函数 `websiteSchema()`、`softwareApplicationSchema()`、`articleSchema()`、`faqSchema()`、`breadcrumbSchema()`**
- [ ] **Step 4: 首页注入 WebSite + SoftwareApplication + 可见 FAQ 对应的 FAQPage JSON-LD**
- [ ] **Step 5: 指南页加入 BreadcrumbList，并用共享函数替代内联 schema**
- [ ] **Step 6: 生成 1200×630 默认 OG 图片；图上仅出现品牌、产品一句话和域名**
- [ ] **Step 7: 构建后检查每页只有一个 canonical、一个 H1，JSON-LD 可解析**
- [ ] **Step 8: 用 Google Rich Results Test 手动检查首页和一篇指南**
- [ ] **Step 9: 提交**

```bash
git add app lib/seo public/og-default.png public/og-guides.png tests/seo.test.ts
git commit -m "feat: add complete search metadata"
```

### Task 3: 建立唯一发布路由清单与 SEO 自动质量门

**Files:**
- Create: `lib/content/route-manifest.ts`
- Create: `scripts/validate-export.mjs`
- Modify: `app/guides/[slug]/page.tsx`
- Modify: `app/sitemap.ts`
- Modify: `package.json`
- Test: `tests/seo.test.ts`

- [ ] **Step 1: 写失败测试，要求发布清单中的 URL 与 sitemap 双向完全相等**
- [ ] **Step 2: 创建 `route-manifest.ts`；每条记录包含 `pathname`、`kind`、`slug`、`lastModified`、`indexable`，只导出校验通过且允许索引的内容**
- [ ] **Step 3: 让现有 `/guides/[slug]` 的 `generateStaticParams` 从清单读取，并导出 `export const dynamicParams = false`**
- [ ] **Step 4: 让 `app/sitemap.ts` 只从同一发布清单生成，不维护第二份 URL 列表**
- [ ] **Step 5: 写失败测试，构造重复 title、缺 canonical、断链和 sitemap 只进不出/只出不进 fixture**
- [ ] **Step 6: 实现产物检查器，扫描 `out/**/*.html`，同时解析 `out/sitemap.xml`**
- [ ] **Step 7: 检查 title/description 唯一性、canonical、noindex、H1、内部链接、OG image、JSON-LD 解析，并要求每个 indexable HTML 恰好在 sitemap 出现一次、每个 sitemap URL 都有静态文件**
- [ ] **Step 8: 添加命令 `"seo:check": "npm run build && node scripts/validate-export.mjs"`**
- [ ] **Step 9: 运行 `npm test && npm run lint && npm run seo:check`**
- [ ] **Step 10: 提交**

```bash
git add package.json lib/content/route-manifest.ts app/guides/[slug]/page.tsx app/sitemap.ts scripts/validate-export.mjs tests/seo.test.ts
git commit -m "test: enforce publish manifest and SEO quality"
```

### Task 4: 建立测量基线

**Files:**
- Create: `docs/seo-scorecard.md`
- Create: `app/privacy/page.tsx`
- Create: `lib/analytics/events.ts`
- Create: `functions/api/events.ts`
- Create: `tests/analytics.test.ts`
- Modify: `lib/content/route-manifest.ts`
- Modify: `app/sitemap.ts`
- Modify: `README.md`
- Cloudflare dashboard: Web Analytics
- Cloudflare dashboard: Analytics Engine binding `SEO_EVENTS`
- GSC: property, sitemap, URL inspection

- [ ] **Step 1: 记录 GSC property、Sitemap 提交日和首批 5 个 URL**
- [ ] **Step 2: 开启 Cloudflare Web Analytics，仅用于 pageview 和 Web Vitals，确认不重复加载脚本**
- [ ] **Step 3: 写失败测试，要求事件端点拒绝未知事件、用户粘贴文本、百分比、reset timestamp、任意 visitor ID 和超长 payload**
- [ ] **Step 4: 定义 allowlist：`first_visit`、`desk_start`、`manual_setup_start`、`manual_setup_complete`、`parser_attempt`、`parser_success`、`desk_complete`、`ics_download`、`share_card_download`、`guide_pageview`、`guide_to_desk_click`、`return_7d`、`return_30d`；允许字段仅为 page kind 与粗粒度 device class**
- [ ] **Step 5: 实现 `/api/events` Pages Function 写入 Analytics Engine；同一会话事件客户端去重并使用 `navigator.sendBeacon`，失败时静默，不阻塞产品**
- [ ] **Step 6: 7/30 回访只在本地保存首次日期和已发送标志；达到窗口后发送一次布尔事件，服务端不得接收稳定标识符**
- [ ] **Step 7: 在启用事件前发布 `/privacy`，列出 localStorage keys、事件字段、保留期限、退出开关和联系邮箱；页面设置自引用 canonical，并作为 indexable trust page 加入 route manifest 与 sitemap**
- [ ] **Step 8: 在 scorecard 写明公式：index rate、parser success rate、desk/manual completion rate、guide-to-desk rate、ICS/share rate、7/30 return event rate及各自分母**
- [ ] **Step 9: 记录初始 CWV/Lighthouse；目标 LCP ≤ 2.5s、INP < 200ms、CLS < 0.1；性能预算为任一指标不得较基线恶化 10% 以上**
- [ ] **Step 10: README 写明每周一复盘流程和 Analytics Engine 查询**
- [ ] **Step 11: 在 Cloudflare preview 和 production 两个环境绑定 `SEO_EVENTS`，再部署 preview；使用测试事件确认 Analytics Engine 有一条合法记录且无敏感字段**
- [ ] **Step 12: 提交**

```bash
git add README.md docs/seo-scorecard.md app/privacy/page.tsx lib/analytics/events.ts functions/api/events.ts lib/content/route-manifest.ts app/sitemap.ts tests/analytics.test.ts
git commit -m "feat: add privacy-safe SEO measurement"
```

---

## Phase 1 — 可信内容引擎（第 3–5 天）

### Task 5: 将内容迁移为带来源和新鲜度的 Markdown

**Files:**
- Create: `lib/content/schema.ts`
- Create: `lib/content/load.ts`
- Create: `content/sources.json`
- Create: `content/guides/*.md`
- Create: `scripts/validate-content.mjs`
- Modify: `lib/content.ts`
- Modify: `package.json`
- Test: `tests/content-loader.test.ts`

- [ ] **Step 1: 安装构建期内容依赖**

Run: `npm install gray-matter zod unified remark-parse remark-directive remark-rehype rehype-sanitize rehype-stringify`

- [ ] **Step 2: 写失败测试，要求缺来源、未知 source ID、official claim 引用非一级来源、未引用 claim、重复 slug、过期 `reviewAfter`、重复 search intent 或缺 unique-value 证据时拒绝构建**
- [ ] **Step 3: 定义 frontmatter schema**

```ts
export const contentMetaSchema = z.object({
  title: z.string().min(20).max(65),
  description: z.string().min(80).max(165),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  intent: z.enum(["error", "time", "rule", "limit", "operation", "update"]),
  primaryQuery: z.string(),
  reviewedAt: z.coerce.date(),
  reviewAfter: z.coerce.date(),
  demandEvidence: z.object({ type: z.enum(["existing-route", "gsc-query", "user-report", "support-log"]), reference: z.string() }),
  uniqueValue: z.object({ type: z.enum(["calculator", "decision-table", "verified-screenshot", "troubleshooting-tree", "change-log", "download"]), reference: z.string() }),
  claims: z.array(z.object({
    id: z.string(),
    statement: z.string(),
    sourceIds: z.array(z.string()).min(1),
    factStatus: z.enum(["official", "observed", "inference", "unknown"]),
    verifiedAt: z.coerce.date(),
    reviewAfter: z.coerce.date(),
  })),
});
```

- [ ] **Step 4: 给 `content/sources.json` 中每个来源定义稳定 ID、publisher、tier、checkedAt 与证据类型；网页证据使用 URL，本地产品 UI 证据使用 dated screenshot path + capturedAt + SHA-256，二者至少存在一个**
- [ ] **Step 5: 实现仅在构建期读取 Markdown 的 loader，并用 `remark-directive` 解析 `:claim[claim-id]` 标记、用 `rehype-sanitize` 输出安全 HTML**
- [ ] **Step 6: 校验每条时效性 claim 在正文中恰好引用一次；`official` claim 只能引用 OpenAI 一级网页来源或带日期与 checksum 的本地官方产品 UI 截图；source box 显示 claim 状态、来源、verifiedAt 和 reviewAfter**
- [ ] **Step 7: limits 数据行采用同样字段：`sourceIds`、`factStatus`、`verifiedAt`、`reviewAfter`；禁止继承页面级状态**
- [ ] **Step 8: 把现有 4 篇指南迁移到 Markdown，保持 URL 不变，并以 `existing-route` 作为 demand evidence**
- [ ] **Step 9: 每篇加入官方来源、最后核验、快速答案、步骤、边界条件、FAQ 和可验证 `uniqueValue`**
- [ ] **Step 10: 内容校验加入 `npm run build` 前置质量门；官方来源过期 14 天、observed 来源过期 7 天时失败**
- [ ] **Step 11: 运行所有测试与静态构建**
- [ ] **Step 12: 提交**

```bash
git add content lib/content scripts package.json package-lock.json tests
git commit -m "feat: add source-backed content engine"
```

### Task 6: 建立统一文章模板

**Files:**
- Create: `components/article/article-layout.tsx`
- Create: `components/article/source-box.tsx`
- Create: `components/article/breadcrumbs.tsx`
- Create: `app/about/page.tsx`
- Create: `app/methodology/page.tsx`
- Create: `app/corrections/page.tsx`
- Modify: `app/guides/[slug]/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/page.test.tsx`

- [ ] **Step 1: 写失败测试，要求文章显示 quick answer、reviewed date、source links、事实状态、breadcrumbs 和 related links**
- [ ] **Step 2: 实现组件并迁移现有指南模板**
- [ ] **Step 3: 发布 About、Methodology、Corrections 页面，公开站点归属、事实分级、更新周期、利益关系和更正联系渠道**
- [ ] **Step 4: 每篇文章页链接到 Methodology 与 Corrections，站点页使用自引用 canonical 并进入发布清单**
- [ ] **Step 5: 在移动端检查目录不遮挡正文、来源链接可点击**
- [ ] **Step 6: 运行 `npm test && npm run lint && npm run seo:check`**
- [ ] **Step 7: 提交**

```bash
git add components/article app/guides app/about app/methodology app/corrections app/globals.css tests/page.test.tsx
git commit -m "feat: add evidence-first article template"
```

---

## Phase 2 — 第一批高意图页面（第 2–5 周；所有内容合计每周最多发布 2 页）

### Task 7: 发布 3 个报错意图页面

**Files:**
- Create: `app/errors/[slug]/page.tsx`
- Create: `content/errors/*.md`
- Modify: `app/sitemap.ts`
- Test: `tests/content-loader.test.ts`

首批候选 slug（是候选池，不要求全部发布；通过证据门槛后跨周分批）：

- `codex-weekly-limit-reached`
- `codex-usage-not-restored-after-reset`
- `codex-reset-not-available`

- [ ] **Step 1: 收集真实界面截图/原文；没有证据的错误名称不发布**
- [ ] **Step 2: 为每页写唯一 quick answer、原因树、恢复检查清单、何时联系支持、禁止操作和官方来源**
- [ ] **Step 3: 写失败测试，要求错误页原文、症状、解决步骤和 source box**
- [ ] **Step 4: 只有存在 `demandEvidence` 和有效 `uniqueValue` 的候选才能进入发布清单**
- [ ] **Step 5: 实现错误页静态模板；`generateStaticParams` 从发布清单读取，并导出 `dynamicParams = false`**
- [ ] **Step 6: 添加到首页“Common Codex limit messages”入口与相关指南内链**
- [ ] **Step 7: 运行 SEO 检查；确认三页不是只换关键词的重复正文，并确认页面与 sitemap 双向一致**
- [ ] **Step 8: 提交并在 GSC 请求索引**

```bash
git add app/errors content/errors app/sitemap.ts tests
git commit -m "feat: publish Codex limit error guides"
```

### Task 8: 发布 3 个规则意图页面

**Files:**
- Create: `app/rules/[slug]/page.tsx`
- Create: `content/rules/*.md`
- Modify: `app/sitemap.ts`
- Test: `tests/content-loader.test.ts`

首批候选 slug（是候选池，不要求全部发布；通过证据门槛后跨周分批）：

- `does-a-banked-reset-change-weekly-reset-date`
- `do-codex-subagents-count-toward-usage`
- `how-model-and-reasoning-affect-codex-usage`

- [ ] **Step 1: 为每个问题建立 official/observed/unknown 证据矩阵**
- [ ] **Step 2: 页面开头直接回答；官方未确认的部分显式标 `Unknown`**
- [ ] **Step 3: 增加对比表和至少一个可操作示例**
- [ ] **Step 4: 要求每页有 `demandEvidence` 和有效 `uniqueValue` 后才加入发布清单**
- [ ] **Step 5: 写测试并实现静态模板；`generateStaticParams` 从发布清单读取，并导出 `dynamicParams = false`**
- [ ] **Step 6: 互链至 five-hour、weekly、banked-reset 页面**
- [ ] **Step 7: 运行质量门，确认页面与 sitemap 双向一致并提交**

```bash
git add app/rules content/rules app/sitemap.ts tests
git commit -m "feat: publish Codex usage rule guides"
```

### Task 9: 发布 Limits 数据库第一版

**Files:**
- Create: `app/limits/page.tsx`
- Create: `content/limits/index.md`
- Create: `content/data/limits.json`
- Create: `content/data/limit-history.json`
- Test: `tests/content-loader.test.ts`

- [ ] **Step 1: 定义每一行数据字段：plan、model、range、window、effectiveFrom、sourceIds[]、factStatus、verifiedAt、reviewAfter；不允许页面级继承**
- [ ] **Step 2: 写失败测试，禁止 sourceIds 为空、source ID 不存在、official 行引用非一级来源、无 effective/review date、过期数据或把估计范围写成固定额度**
- [ ] **Step 3: 首发只实现 `/limits` 单一页面，在同页呈现当前限额表、模型效率对比和简明历史时间线**
- [ ] **Step 4: 表格每一行显示来源及核验日期；过期数据醒目标黄**
- [ ] **Step 5: 不把 Chat 的 GPT 限额与 Work/Codex shared allowance 混在同一数字中**
- [ ] **Step 6: 暂不创建 `/limits/[slug]`；只有 GSC 查询或用户支持记录形成 `demandEvidence` 且子页有独立 `uniqueValue` 时，才在 Task 12 拆分**
- [ ] **Step 7: 运行质量门、提交并请求索引**

```bash
git add app/limits content/limits content/data tests
git commit -m "feat: add versioned Codex limits database"
```

---

## Phase 3 — 时间意图与可分享工具（第 4–6 周，与内容发布节奏独立）

### Task 10: 建立 Reset Time 页面与时区换算器

**Files:**
- Create: `app/reset-time/page.tsx`
- Create only after evidence gate: `app/reset-time/[timezone]/page.tsx`
- Create: `components/tools/reset-time-converter.tsx`
- Modify: `lib/reset.ts`
- Test: `tests/reset-time.test.ts`

- [ ] **Step 1: 写 DST、UTC offset、无效时间和跨日换算失败测试**
- [ ] **Step 2: 实现基于 IANA timezone 的纯函数，禁止手写固定 offset**
- [ ] **Step 3: 创建主页面 `/reset-time`，允许粘贴 reset timestamp、选择时区、生成 ICS**
- [ ] **Step 4: 首发只发布 `/reset-time`；UTC、Pacific、Eastern、London、Tokyo 仅作为页面内选项，不产生独立 URL**
- [ ] **Step 5: 运行至少 28 天后，某时区相关查询在 GSC 达到 50 impressions，或累计 5 条可追溯用户请求时，记录 `demandEvidence`**
- [ ] **Step 6: 只有通过门槛的时区才创建子页；每页还必须包含独立 DST 说明、跨日示例、当地格式和互动输出作为 `uniqueValue`**
- [ ] **Step 7: 若创建 `[timezone]` 路由，必须从发布清单生成 `generateStaticParams`、导出 `dynamicParams = false`，并由同一清单进入 sitemap**
- [ ] **Step 8: 首页、5-hour 和 weekly 指南链接到换算器**
- [ ] **Step 9: 运行测试、SEO 检查和移动端 QA**
- [ ] **Step 10: 提交**

```bash
git add app/reset-time components/tools/reset-time-converter.tsx lib/reset.ts tests/reset-time.test.ts
git commit -m "feat: add Codex reset time converter"
```

### Task 11: 加强 ICS 与本地分享卡

**Files:**
- Create: `components/tools/share-card.tsx`
- Modify: `components/reset-desk.tsx`
- Modify: `lib/reset.ts`
- Test: `tests/reset-desk.test.tsx`

- [ ] **Step 1: 写测试，要求 ICS 包含稳定 UID、域名、官方核验提示和 5 分钟提醒**
- [ ] **Step 2: 写测试，要求分享卡默认隐藏账户标识和完整粘贴文本**
- [ ] **Step 3: 使用浏览器 Canvas/SVG 本地生成 1200×630 PNG，不上传用户数据**
- [ ] **Step 4: 卡片只显示用户主动选择的信息：窗口类型、剩余比例、倒计时、域名**
- [ ] **Step 5: 埋点仅记录 `ics_download`、`share_card_download`，不记录额度值**
- [ ] **Step 6: 运行测试与浏览器 QA**
- [ ] **Step 7: 提交**

```bash
git add components/tools/share-card.tsx components/reset-desk.tsx lib/reset.ts tests
git commit -m "feat: add private reset sharing tools"
```

---

## Phase 4 — 第二批内容与内部链接（第 6–12 周；所有内容合计每周最多发布 2 页）

### Task 12: 扩展规则与操作集群

**Files:**
- Create: `content/rules/*.md`
- Create: `content/guides/*.md`
- Create only after evidence gate: `app/limits/[slug]/page.tsx`
- Create only after evidence gate: `content/limits/{plus,pro,business,model-comparison,history}.md`
- Modify: `app/page.tsx`
- Modify: `app/sitemap.ts`

候选规则页：web search、tools、cache/compaction、credits vs reset、paid reset、shared Work/Codex allowance。

候选操作页：使用 banked reset、购买 instant reset、切换更省额度模型、reset 后未恢复、联系支持所需信息。

- [ ] **Step 1: 用 GSC 查询和真实支持问题为候选打分：意图强度、证据质量、独特价值、转化关联**
- [ ] **Step 2: 页面只有在 `demandEvidence` 可追溯，且至少包含一个 schema 可验证的 `uniqueValue` 时进入发布清单；不得用字数或关键词替代独特价值**
- [ ] **Step 3: 每页加入官方来源、核验日期、操作步骤和边界情况**
- [ ] **Step 4: 从 pillar 页面加入描述性锚文本，避免孤儿页**
- [ ] **Step 5: 如果拆分 `/limits/[slug]`，从发布清单生成 `generateStaticParams`、导出 `dynamicParams = false`，并确保数据行独立携带 source/fact/verified/review 字段**
- [ ] **Step 6: 运行重复内容检测和 SEO 检查，验证 sitemap 双向覆盖**
- [ ] **Step 7: 分两次提交，每批不超过 6 页，以便观察索引质量**

### Task 13: 建立自动相关内容与 Topic Hub

**Files:**
- Create: `app/errors/page.tsx`
- Create: `app/rules/page.tsx`
- Create: `app/guides/page.tsx`
- Modify: `lib/content/load.ts`
- Modify: `components/article/article-layout.tsx`
- Test: `tests/content-loader.test.ts`

- [ ] **Step 1: 写失败测试，确保每个正式页面至少有一个入链和两个相关出链**
- [ ] **Step 2: 按 intent、entities、relatedSlugs 生成相关内容，不仅按关键词匹配**
- [ ] **Step 3: Hub 页面提供决策导航和摘要，不做单纯链接列表**
- [ ] **Step 4: Sitemap 与 breadcrumbs 纳入 Hub**
- [ ] **Step 5: 运行 SEO 检查并提交**

```bash
git add app/errors/page.tsx app/rules/page.tsx app/guides/page.tsx lib/content components/article tests
git commit -m "feat: add Codex reset topic hubs"
```

### Task 13A: 建立经核验的 Updates/Events 档案

**Files:**
- Create: `app/updates/page.tsx`
- Create: `app/updates/[slug]/page.tsx`
- Create: `content/updates/*.md`
- Modify: `lib/content/route-manifest.ts`
- Modify: `app/sitemap.ts`
- Test: `tests/content-loader.test.ts`

- [ ] **Step 1: 写失败测试，要求 update slug 为 `{yyyy-mm-dd}-{topic}`，且必须包含 `occurredAt`、至少一个一级 source ID、逐条 claims 和更正状态**
- [ ] **Step 2: 实现 updates index，按事件发生时间排序，并清楚区分 announcement、confirmed reset、product change、correction**
- [ ] **Step 3: 实现 `[slug]` 模板；从发布清单生成 `generateStaticParams`，导出 `dynamicParams = false`**
- [ ] **Step 4: 首批只迁入 2–3 个能由官方来源核验的历史事件；第三方传闻不得创建可索引事件页**
- [ ] **Step 5: 每页显示 event time、source time、last verified、影响范围、个人账户仍需核验和后续更正记录**
- [ ] **Step 6: 验证 updates 与 sitemap 双向一致、日期不在未来、过期来源触发失败**
- [ ] **Step 7: 运行 `npm test && npm run lint && npm run seo:check`**
- [ ] **Step 8: 提交**

```bash
git add app/updates content/updates lib/content/route-manifest.ts app/sitemap.ts tests
git commit -m "feat: add verified Codex reset update archive"
```

---

## Phase 5 — 实时信号与邮件候补（第 6–8 周，单独实施计划）

### Task 14: 先写 Worker 子项目规格，不直接接入付费

**Files:**
- Create: `docs/public-reset-signal-spec.md`
- Create: `docs/superpowers/plans/YYYY-MM-DD-public-reset-worker.md`

- [ ] **Step 1: 定义允许的官方来源、抓取频率、事件去重、来源快照和人工核验规则**
- [ ] **Step 2: 定义状态 `rumor`、`observed`、`official`、`expired`，只有 `official` 可触发提醒**
- [ ] **Step 3: 定义 API：`GET /signals/latest`、`GET /signals/history`、`POST /subscriptions`、`GET /subscriptions/confirm?token=`、`GET /subscriptions/unsubscribe?token=` 和用于 List-Unsubscribe-One-Click 的 `POST /subscriptions/unsubscribe`**
- [ ] **Step 4: 设计 Cloudflare Worker + D1/KV、Cron、Turnstile、双重确认、退订和速率限制**
- [ ] **Step 5: 设定上线门槛：30 天 precision ≥ 95%、误报率 < 2%、可用率 ≥ 99%**
- [ ] **Step 6: 计划评审通过后才实现**

### Task 15: 实现 Email-only 双重确认候补与退订

**Files:**
- Create: `worker/package.json`
- Create: `worker/package-lock.json`
- Create: `worker/wrangler.jsonc`
- Create: `worker/migrations/0001_subscriptions.sql`
- Create: `worker/src/index.ts`
- Create: `worker/src/subscriptions.ts`
- Create: `worker/src/mailer.ts`
- Create: `worker/src/webhooks.ts`
- Create: `worker/tests/subscriptions.test.ts`
- Create: `worker/tests/webhooks.test.ts`
- Modify: `app/page.tsx`
- Modify: `app/privacy/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/page.test.tsx`

- [ ] **Step 1: 写 Worker 失败测试：无效邮箱、Turnstile 失败、频率超限、重复订阅、过期确认 token、重复使用 token、一次点击退订**
- [ ] **Step 2: 创建 D1 schema：地址状态 `pending/confirmed/unsubscribed`、通知状态 `waitlist/shadow/beta/paused`、`is_synthetic`、`beta_opted_in_at`、随机 nonce 的 AES-GCM 加密邮箱、用于可靠查重的 keyed email HMAC、确认 token hash、unsubscribe token hash、created/confirmed/unsubscribed 时间和 deliveries 幂等表；不得存储用户额度数据**
- [ ] **Step 3: 实现 `POST /subscriptions`，验证 Turnstile、规范化邮箱、速率限制、写 pending 并通过 Resend 发送 24 小时确认链接**
- [ ] **Step 4: 实现 `GET /subscriptions/confirm?token=` 一次性确认、`GET /subscriptions/unsubscribe?token=` 浏览器退订页和 `POST /subscriptions/unsubscribe` RFC 8058 one-click 退订；三者与 Task 14 API 合同一致**
- [ ] **Step 5: 邮箱使用随机 nonce AES-GCM 加密后落库；规范化邮箱另用独立 secret 计算 HMAC 用于查重。两把密钥只使用 Worker secrets，日志不得打印 email/token/HMAC**
- [ ] **Step 5A: 写选择器测试：普通 waitlist 即使地址 confirmed 也不可投递；shadow 只选择 `is_synthetic=true AND notification_state=shadow`；beta 只选择 `is_synthetic=false AND notification_state=beta AND beta_opted_in_at IS NOT NULL`**
- [ ] **Step 6: 首页把 mailto 和 Email+SMS 文案替换为真实 Email-only 表单、Turnstile、提交/确认/重复/失败状态；SMS 标记为未来候选而非当前承诺**
- [ ] **Step 7: 写 webhook 失败测试，覆盖签名无效、重复 event ID、delivered/opened/clicked/complained/bounced/unsubscribed 状态和未知 recipient**
- [ ] **Step 8: 实现邮件服务商 webhook：先验证签名和事件幂等性，再更新 D1；Analytics Engine 只写 aggregate event type 和 message category，不写 email、subscriber ID、token 或 HMAC**
- [ ] **Step 9: Privacy 页面写明处理目的、服务商、open/click tracking、保留期、退订和删除请求；表单旁链接 Privacy**
- [ ] **Step 10: 在 scorecard 定义：waitlist confirm rate、delivered rate、unique open rate、unique click rate、complaint rate、unsubscribe rate，并明确分母**
- [ ] **Step 11: 本地和 preview 验证**

先生成并提交 lockfile：

```powershell
npm --prefix worker install
```

然后运行：

```powershell
Push-Location worker
try {
  npm ci
  npm test
  npx wrangler dev
} finally {
  Pop-Location
}
```

Expected: Worker tests pass; test inbox receives one confirmation email; confirmation and unsubscribe each work once.

- [ ] **Step 12: 配置并部署 Worker**

```powershell
Push-Location worker
try {
  npx wrangler secret put RESEND_API_KEY
  npx wrangler secret put SUBSCRIPTION_ENCRYPTION_KEY
  npx wrangler secret put EMAIL_LOOKUP_HMAC_KEY
  npx wrangler secret put TURNSTILE_SECRET
  npx wrangler secret put RESEND_WEBHOOK_SIGNING_SECRET
  npx wrangler d1 migrations apply codereset --remote
  npx wrangler deploy
} finally {
  Pop-Location
}
```

- [ ] **Step 13: 在 Cloudflare Pages preview/production 配置 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`；Worker 初始变量设置 `DELIVERY_MODE=shadow` 和 `ALERT_FROM_EMAIL=alerts@codereset.dev`**
- [ ] **Step 14: 在 Resend 验证 `codereset.dev` 发件域并确认 SPF/DKIM；将 webhook URL 指向 Worker，使用 `RESEND_WEBHOOK_SIGNING_SECRET` 验签**
- [ ] **Step 15: 将 `api.codereset.dev` 绑定 Worker；设置只允许 `https://codereset.dev` 的 CORS，并做生产烟测**
- [ ] **Step 16: 运行站点与 Worker 全部测试后分别提交**

```bash
git add worker app/page.tsx app/privacy/page.tsx app/globals.css tests/page.test.tsx
git commit -m "feat: add double-opt-in reset alert waitlist"
```

### Task 15A: 将 Preview 转换为可核验实时面板

**Files:**
- Create: `worker/src/signals.ts`
- Create: `worker/src/source-ingest.ts`
- Create: `worker/src/delivery.ts`
- Create: `worker/src/metrics.ts`
- Create: `worker/tests/signals.test.ts`
- Create: `worker/tests/delivery.test.ts`
- Modify: `worker/wrangler.jsonc`
- Modify: `app/page.tsx`
- Modify: `lib/content.ts`

- [ ] **Step 1: 写失败测试覆盖 source allowlist、事件去重、时间戳、状态转换、过期、错误来源和误报更正**
- [ ] **Step 2: Worker 只摄取规格允许的一级来源，保存来源 URL、原始发布时间、抓取时间和内容摘要 hash**
- [ ] **Step 3: `GET /signals/latest` 返回明确状态与来源；rumor/observed 不触发邮件**
- [ ] **Step 4: 写 delivery 失败测试：Cron 只选择 confirmed 且未退订订阅者、只发送 official 事件、同一 subscriber+signal 只发送一次、provider 失败可重试、退订者永不发送、邮件包含 one-click unsubscribe headers**
- [ ] **Step 5: 实现 Worker `scheduled()`：领取未发送 official signal；`DELIVERY_MODE=shadow` 时只选 synthetic+shadow，`DELIVERY_MODE=beta` 时只选非 synthetic+beta 且 `beta_opted_in_at` 非空；解密邮箱、调用 Resend、按 `subscriber_id + signal_id` 写 deliveries 幂等记录；失败使用有限重试和 dead-letter 状态**
- [ ] **Step 6: 为影子期配置 `is_synthetic=true, notification_state=shadow` 的测试订阅者；每个 official signal 只发往测试邮箱，所有真实 confirmed 用户保持 `notification_state=waitlist`**
- [ ] **Step 7: 逐次人工核验并计算：`precision = verified true positives / all official signals emitted`；`false_positive_rate = false alerts / all official signals emitted`；`delivery_availability = synthetic emails accepted by provider within 5 minutes / eligible synthetic deliveries`**
- [ ] **Step 8: 连续影子运行 30 天；只有 precision ≥ 95%、false-positive rate < 2%、delivery availability ≥ 99% 时，才允许把 Worker 配置候选切到 `DELIVERY_MODE=beta`**
- [ ] **Step 9: 免费 beta 开启前发送一次独立邀请；用户点击带签名的一次性 beta opt-in 链接后才写 `notification_state=beta` 与 `beta_opted_in_at`，早期 confirmed waitlist 不自动转入 beta**
- [ ] **Step 9A: 切换 beta 前运行选择器集成测试，证明 waitlist 用户为 0 recipients、仅再次确认用户进入 beta recipients；随后才部署 `DELIVERY_MODE=beta`**
- [ ] **Step 10: 首页移除 `PRODUCT PREVIEW` 前，实时面板必须显示来源 URL、发布时间、抓取时间、信号状态和“个人额度仍以账户为准”；失败或超过 freshness TTL 时回退为静态说明，不能显示陈旧状态为 live**
- [ ] **Step 11: 部署后用一个测试订阅从注册、确认、官方测试信号、Cron delivery 到 one-click unsubscribe 做完整烟测**
- [ ] **Step 12: 付费功能继续关闭，直到免费 beta 的送达、投诉与退订指标通过单独商业化评审**

---

## Phase 6 — 平台分发与链接资产（第 9–12 周，按门槛启动）

### Task 16: 先做可引用的数据资产

- [ ] **Step 1: 发布 limits 历史 JSON/CSV 下载和变更日志**
- [ ] **Step 2: 为公开信号提供 README badge 和只读 JSON endpoint**
- [ ] **Step 3: 写方法论页面解释数据来源与更正流程**
- [ ] **Step 4: 向相关 GitHub README、Reddit/X 讨论提供真正有用的数据链接，不批量灌水**

### Task 17: 用验证门槛决定扩展市场

只有当网站达到以下任一门槛才启动第一个扩展：每月 1,000 次 Reset Desk 完成、500 次 ICS 下载或 250 个双重确认订阅。

优先顺序：

1. Chrome extension：读取用户主动粘贴的状态并显示倒计时。
2. VS Code extension：状态栏倒计时和 usage 指南入口。
3. Raycast extension：快速查看本地保存的 reset 时间。
4. Slack/Discord bot：只同步公开信号，不上传个人账户数据。
5. npm/Homebrew/MCP：只有存在真实 CLI/API 功能后上架，不创建空壳包。

每个平台必须单独建计划、隐私说明、商店关键词页和归因参数。

---

## 90-day operating cadence

### 每周一：数据复盘

- [ ] 导出 GSC 最近 28 天与前一周期对比。
- [ ] 检查 discovered/crawled currently not indexed、重复 canonical 和 404。
- [ ] 对部署满 30 天的 URL cohort 使用 URL Inspection 抽样核对 user-declared canonical 与 Google-selected canonical，并计算该 cohort 的有效索引率；新 URL 不进入分母。
- [ ] 把查询放入四个队列：优化现有页、新页面候选、FAQ 候选、产品需求。
- [ ] 更新 `docs/seo-scorecard.md`，记录动作而不仅是数字。

### 每周二至周四：内容与产品

- [ ] 更新 2 个已有页面，发布不超过 2 个新页面。
- [ ] 每页经过事实审核、来源复查、重复内容检查和移动端 QA。
- [ ] 优先新增工具/表格/示例，不为了字数扩写。

### 每周五：分发与学习

- [ ] 发布一条基于真实数据的 X/Reddit/社区内容。
- [ ] 检查分享卡、ICS 和邮件候补漏斗。
- [ ] 记录用户原话和错误截图，进入下一周候选池。

### 30/60/90 天检查点

- **Day 30:** 技术 SEO 完成；内容容量 envelope 最多 12–16 个高质量 URL，实际可更少；只对已部署满 30 天的 URL cohort 计算有效索引率目标 ≥ 80%；建立非品牌曝光基线。
- **Day 60:** 内容容量 envelope 最多 24–32 个 URL，实际可更少；limits 数据库与 reset-time 工具上线；至少 30% 已发布满 30 天的内容页获得真实 GSC impressions。
- **Day 90:** 页面总数最多规划到 35–50 个，但允许因证据门槛明显少于该范围；根据 GSC 删除/合并零价值页面；只有达到信号质量门槛才开放提醒付费测试。

---

## Final release verification

- [ ] `npm test` — all tests pass.
- [ ] `npm run lint` — zero warnings.
- [ ] `npm run seo:check` — no duplicate metadata, broken links, missing canonical or stale sources.
- [ ] `npm run build` — static export succeeds and `out/` contains every sitemap URL.
- [ ] `curl.exe -I https://codereset.dev/sitemap.xml` — 200 and `application/xml`.
- [ ] `curl.exe -I https://codereset.pages.dev/` — 301 to `https://codereset.dev/`.
- [ ] 发布前只验证 HTML 中的 user-declared canonical；Google-selected canonical 移到部署满 30 天后的 cohort 监控，不作为发布阻塞条件。
- [ ] Rich Results Test reports no critical errors for homepage and each content template.
- [ ] Mobile and desktop smoke tests show no horizontal overflow or blocked interaction.
