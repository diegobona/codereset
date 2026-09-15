# CodeReset SEO Growth Specification

## 1. 目标

在 90 天内把 CodeReset 从 5 个可索引 URL 的产品落地页，建设为一个围绕 Codex usage、limits、reset、banked reset 和排障操作的英文主题站。增长依赖可验证内容、可复用工具与真实产品价值，不依赖批量生成近似页面。

## 2. 成功标准

- 所有正式 URL 自引用 canonical，并且 `codereset.pages.dev`、`www`、HTTP 版本统一 301 到 `https://codereset.dev`。
- Sitemap 只收录 canonical、200、允许索引且有独立价值的 URL。
- 对已提交且至少经过 30 天抓取窗口的 URL cohort，有效索引率目标达到 80% 以上；新 URL 不进入该分母。
- 首页及主要内容模板通过 Rich Results Test、无结构化数据严重错误。
- 真实用户 Core Web Vitals 目标：LCP ≤ 2.5s、INP < 200ms、CLS < 0.1。
- 每一条时效性事实都带来源、事实类型、最后核验时间和下次复查时间。
- 每条时效性声明和 limits 数据行独立绑定来源 ID、事实状态、核验时间与复查期限；页面级来源列表不能替代逐条证据。
- 每个内容页回答一个明确任务，并至少包含一种独特价值：原始截图、计算器、决策表、变更记录、示例输入输出、可下载日历或故障排查树。
- 90 天规划容量上限为 35–50 个高质量 URL；需求、证据与独特价值门槛可以使实际数量明显更少，URL 数量不作为硬 KPI。
- 以 GSC 的非品牌曝光、非品牌点击、有效索引率、平均 CTR 和工具使用率为主指标，不承诺具体排名或流量。

## 3. 用户与搜索意图

核心用户是英语市场的 Codex 高频用户、Plus/Pro 用户、AI 开发团队和在达到额度后需要快速恢复工作的开发者。

优先搜索意图：

1. **报错意图**：用户粘贴或搜索界面原文，需要知道含义与下一步。
2. **时间意图**：用户想知道个人 5-hour/weekly reset 时间，或把显示时区换算为本地时间。
3. **规则意图**：用户想知道模型、reasoning、sub-agent、tool、cache 或 reset 是否影响额度。
4. **数量意图**：用户比较不同计划与模型的当前范围，并需要历史变化。
5. **操作意图**：用户想检查 usage、使用 banked/paid reset、处理未恢复额度或继续工作。

## 4. 内容真实性政策

- OpenAI Help Center、OpenAI 产品界面、OpenAI Status 和 OpenAI 官方公告为一级来源。
- 第三方帖子只能证明“有人观察到/讨论过”，不能证明产品规则。
- 每个关键陈述标记为 `official`、`observed`、`inference` 或 `unknown`。
- 官方信息不明确时直接写“OpenAI does not publicly confirm this”，不得填补答案。
- 价格、额度、资格、到期时间等时效性事实必须设置 `reviewAfter`；过期页面在 CI 中失败，阻止发布。
- 不复制官方帮助中心正文；只做简短引用、解释、示例与原创工具。

## 5. URL 信息架构

保留现有 URL，避免首发后立即迁移：

- `/`
- `/guides/5-hour-limit`
- `/guides/weekly-limit`
- `/guides/banked-resets`
- `/guides/check-codex-usage`

新增结构：

- `/errors/{slug}` — 错误原文与排障
- `/rules/{slug}` — 额度计算规则
- `/limits`、`/limits/{plan-or-topic}` — 限额表与历史；首发只发布 `/limits`，派生页必须有 GSC/用户需求证据
- `/reset-time`、`/reset-time/{timezone}` — 时间换算；首发只发布 `/reset-time`，地区页必须有真实曝光或用户需求证据
- `/guides/{slug}` — 操作教程
- `/updates/{yyyy-mm-dd}-{slug}` — 经核验的重要规则变化与公共 reset 事件

不得为每个城市、每个错误同义词或每个关键词排列组合生成页面。只有 GSC/用户数据证明需求，且页面能提供独特输出时才新增 URL。

## 6. 90 天内容目标

### 第一批：12 个高意图页面

- 4 个现有指南全面补强来源、示例、更新日期和决策表。
- 3 个错误页：weekly limit、usage not restored、reset unavailable。
- 3 个规则页：banked reset 改变 weekly date、sub-agents 是否计入、reasoning/model 对 usage 的影响。
- 1 个 limits 总表；不预先拆分 plan/model 子页。
- 1 个 reset-time 交互页；不预先生成时区子页。

### 第二批：12–18 个页面

- 5–7 个经真实截图确认的错误页。
- 4–6 个规则页：web search、tools、cache、credits、paid reset、shared allowance。
- 3–4 个操作页：购买/使用 reset、切换模型、联系支持、额度恢复检查清单。
- 0–5 个高需求时区页，仅覆盖 GSC 出现真实曝光或可验证用户需求的时区。

### 第三批：10–20 个页面

- 计划与模型限额对比、历史变更页。
- 已证实的产品更新和公共 reset 事件档案。
- 基于 GSC 查询缺口新增的页面，不提前凭关键词排列组合扩张。

## 7. 产品增长与裂变

按价值和成本排序：

1. 现有 ICS 下载加入产品域名、来源提示和稳定事件 UID。
2. 生成可下载的 usage/reset 状态卡；默认不上传个人额度数据。
3. 提供公开 reset 状态徽章和只读 JSON endpoint，供 README/直播叠层使用。
4. 邮件提醒先行；只有公开信号准确率和退订流程达标后再增加 SMS。
5. Slack/Discord/VS Code/Chrome/Raycast 分发必须在核心站有稳定数据源后启动。
6. 排行榜、身份标签、梗图和一键求助属于实验，不进入第一阶段。

## 8. 变现门槛

- 免费层：个人倒计时、指南、ICS、公开事件历史。
- 邮箱候补：必须有有效提交端点、双重确认、隐私说明和一键退订。
- 候补邮箱确认只证明地址所有权，不代表同意接收 beta 提醒；必须存在独立 `beta_opted_in_at`，影子模式只能发送到显式标记的合成测试订阅者。
- Pro：只有连续 30 天公共信号 precision ≥ 95%、误报率 < 2%、提醒可用率 ≥ 99% 后才开放付费。
- 首版付费只做 Email；SMS/电话在单位经济模型和合规审查通过后加入。
- 不得把 `PRODUCT PREVIEW` 包装成实时服务收费。

## 9. 指标体系

### 获取

- GSC 非品牌曝光、点击、CTR、平均位置。
- 按 `errors/rules/limits/reset-time/guides` 分组的 URL 表现。
- 有曝光无点击、有点击无转化、已发现未索引三类队列。

### 激活

- 状态解析成功率。
- 手动设置完成率。
- ICS 下载率。
- 指南到 Reset Desk 的回流率。

### 留存与转化

- 7/30 日回访率。
- 邮件候补转化率与双重确认率。
- 提醒打开率、点击率、误报投诉率和退订率。

## 10. 发布质量门

每次发布必须通过：

- 单元测试、内容 schema 校验、内部链接检查、重复 title/description 检查。
- `next build` 静态导出成功。
- Sitemap URL 对应文件存在。
- 无过期一级来源。
- Lighthouse/CWV 预算没有明显回退。
- 页面事实、标题和结构化数据与可见正文一致。

## 11. 指标定义与隐私

- `parser_success_rate = parser_success / parser_attempt`；事件不包含用户粘贴文本、额度比例或 reset 时间。
- `desk_completion_rate = desk_complete / desk_start`；一次页面会话内去重。
- `manual_setup_completion_rate = manual_setup_complete / manual_setup_start`。
- `ics_download_rate = ics_download / desk_complete`。
- `share_download_rate = share_card_download / desk_complete`。
- `guide_to_desk_rate = guide_to_desk_click / guide_pageview`。
- `index_rate = GSC valid indexed canonical URLs / submitted canonical URLs`。
- 7/30 日回访采用浏览器本地日期标记：首次访问记录在本地，达到窗口后只发送一次 `return_7d`/`return_30d` 布尔事件；服务端不接收稳定访客 ID。
- 自定义事件只允许事件名、页面类型和粗粒度设备类别，通过独立 Pages Function 写入 Cloudflare Analytics Engine；未知字段直接拒绝。
- Email 指标由经过签名验证和幂等处理的邮件服务商 webhook 生成；Analytics Engine 只保存 aggregate event type/message category，不保存邮箱、subscriber ID 或 token。`open_rate = unique opens / delivered`、`click_rate = unique clicks / delivered`、`complaint_rate = complaints / delivered`、`unsubscribe_rate = unsubscribes / delivered`。
- `/privacy` 必须在启用自定义事件前上线，说明本地存储、事件字段、保留期和退出方式。
