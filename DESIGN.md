# DESIGN.md — Jeff

> Personal blog of Jeff. Apple-inspired: calm, precise, content-first. Built for Cloudflare Pages (static).
> Topics: Zendesk · Amazon Connect Customer Profiles · 随想 (musings) · 工程笔记 (engineering notes).
> References: Apple (SF typography, frosted nav, restrained depth) + Stripe (component precision).

---

## 1. Visual Theme & Atmosphere

A personal blog that feels like an Apple product page: quiet confidence, impeccable whitespace, one blue thread running through it. The system font does the work; color stays almost monochrome so writing leads. Frosted navigation, pill buttons, and soft depth complete the feel.

- **视觉基调**: 极简、克制、科技人文（Apple-clean）
- **核心视觉特征**: `apple-clean` · `system-font` · `monochrome+blue` · `frosted-nav` · `pill-cta`
- **光影与质感**: 纯扁平 + 极轻阴影；毛玻璃导航（backdrop blur）；浅灰分区（#F5F5F7）制造节奏。支持明暗双主题（light default / dark optional）。

---

## 2. Color Palette & Roles

### Light Theme

| Role | HEX | CSS Variable | Usage |
|------|-----|--------------|-------|
| Background | `#FFFFFF` | `--color-bg` | Page background |
| Surface | `#FFFFFF` | `--color-surface` | Cards, header bar |
| Surface alt (gray) | `#F5F5F7` | `--color-surface-alt` | Section bands, tags bg, code |
| Ink (near-black) | `#1D1D1F` | `--color-ink` | Headings, body |
| Ink soft | `#424245` | `--color-ink-soft` | Secondary text |
| Muted (gray) | `#86868B` | `--color-muted` | Meta, captions |
| Accent (Apple blue) | `#0066CC` | `--color-accent` | Links, buttons, focus |
| Accent hover | `#0077ED` | `--color-accent-hover` | Hover/active accent |
| Accent soft | `#E8F1FD` | `--color-accent-soft` | Tag bg, focus ring |
| Border | `#D2D2D7` | `--color-border` | Dividers, card borders |
| Border strong | `#C6C6CB` | `--color-border-strong` | Input borders |

### Dark Theme

| Role | HEX | CSS Variable | Usage |
|------|-----|--------------|-------|
| Background | `#000000` | `--color-bg` | Page background |
| Surface | `#1D1D1F` | `--color-surface` | Cards, header |
| Surface alt | `#161617` | `--color-surface-alt` | Section bands, code |
| Ink | `#F5F5F7` | `--color-ink` | Headings, body |
| Ink soft | `#D2D2D7` | `--color-ink-soft` | Secondary text |
| Muted | `#86868B` | `--color-muted` | Meta |
| Accent | `#2997FF` | `--color-accent` | Links, buttons |
| Accent hover | `#47A6FF` | `--color-accent-hover` | Hover/active |
| Accent soft | `#0A2A4A` | `--color-accent-soft` | Focus ring, tag bg |
| Border | `#38383C` | `--color-border` | Dividers |
| Border strong | `#48484A` | `--color-border-strong` | Input borders |

### Semantic Colors

```css
--color-success: #248A3D;  /* published */
--color-warning: #B25000;  /* draft */
--color-danger:  #D70015;  /* error */
--color-info:    #0066CC;  /* external */
```

### Shadow Colors

```css
--shadow-color: rgba(0, 0, 0, 0.08);
--shadow-color-strong: rgba(0, 0, 0, 0.14);
```

---

## 3. Typography Rules

- **Font Family**: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif`
- **Note**: Apple's SF Pro feel comes from the system stack on Apple devices; falls back gracefully elsewhere. No serif.
- **Load**: System fonts only — no web-font request needed (faster, more Apple).

### Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Notes |
|-------|------|--------|-------------|----------------|-------|
| Display Hero | 72px | 600 | 1.05 | -0.02em | Home hero (clamp down on mobile) |
| H1 | 48px | 600 | 1.08 | -0.015em | Post title |
| H2 | 36px | 600 | 1.12 | -0.010em | Section headings |
| H3 | 24px | 600 | 1.25 | -0.005em | Card / sub headings |
| H4 | 19px | 600 | 1.30 | 0 | Small headings |
| Body Large | 19px | 400 | 1.50 | 0 | Lead paragraph |
| Body | 17px | 400 | 1.47 | 0 | Default body (Apple base size) |
| Small | 14px | 400 | 1.45 | 0.01em | Meta, captions |
| Nano (label) | 12px | 600 | 1.40 | 0.06em | Uppercase eyebrow labels |

**设计哲学**: 全系统字体（SF Pro 观感），无衬线、无装饰。大字号用 600 字重 + 负字距收紧（Apple 标志性的紧排），正文 17px / 行高 1.47 保证长阅读。颜色几乎单色，仅以 Apple 蓝 `#0066CC` 点睛——链接、按钮、聚焦环统一用蓝，克制不喧宾夺主。

---

## 4. Component Stylings

### Buttons (pill CTA)

```css
.btn { display:inline-flex; align-items:center; gap:8px; font:400 15px/1 var(--font-body);
  padding:12px 22px; border-radius:980px; border:1px solid transparent; cursor:pointer;
  transition:background .18s ease, border-color .18s ease, transform .12s ease; }
.btn:active { transform:translateY(1px); }

.btn-primary { background:var(--color-accent); color:#fff; }
.btn-primary:hover { background:var(--color-accent-hover); color:#fff; }

.btn-secondary { background:var(--color-surface); color:var(--color-accent);
  border-color:var(--color-border-strong); }
.btn-secondary:hover { border-color:var(--color-accent); }

.btn-ghost { background:transparent; color:var(--color-accent); }
.btn-ghost:hover { text-decoration:underline; }

.btn-danger { background:var(--color-danger); color:#fff; }
.btn-danger:hover { filter:brightness(0.94); color:#fff; }
```

### Cards

```css
.card { background:var(--color-surface); border:1px solid var(--color-border);
  border-radius:18px; padding:0; overflow:hidden;
  box-shadow:0 1px 2px rgba(0,0,0,.04), 0 6px 18px rgba(0,0,0,.05);
  transition:transform .25s ease, box-shadow .25s ease; }
.card:hover { transform:translateY(-4px);
  box-shadow:0 2px 4px rgba(0,0,0,.05), 0 14px 36px rgba(0,0,0,.09); }
.card-body { padding:24px; }
```

### Inputs

```css
.input { width:100%; font:400 15px/1.5 var(--font-body); color:var(--color-ink);
  background:var(--color-surface); border:1px solid var(--color-border-strong);
  border-radius:12px; padding:12px 14px; transition:border-color .15s ease, box-shadow .15s ease; }
.input::placeholder { color:var(--color-muted); }
.input:focus { outline:none; border-color:var(--color-accent);
  box-shadow:0 0 0 4px var(--color-accent-soft); }
```

### Navigation (frosted)

```css
.nav { position:sticky; top:0; z-index:50;
  background:rgba(255,255,255,0.72); backdrop-filter:saturate(180%) blur(20px);
  -webkit-backdrop-filter:saturate(180%) blur(20px); border-bottom:1px solid rgba(0,0,0,.08); }
.nav-link { color:var(--color-ink-soft); font:400 14px/1 var(--font-body); padding:8px 2px;
  transition:color .15s ease; }
.nav-link:hover { color:var(--color-ink); }
.nav-link.active { color:var(--color-accent); }
```

### Badges / Tags

```css
.badge { display:inline-flex; align-items:center; font:600 12px/1 var(--font-body);
  letter-spacing:.03em; color:var(--color-accent); background:var(--color-accent-soft);
  padding:5px 12px; border-radius:980px; }
```

### Modals / Dialogs

```css
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4);
  backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center;
  opacity:0; animation:overlay-in .2s ease forwards; z-index:100; padding:16px; }
.modal { background:var(--color-surface); border-radius:20px; padding:32px;
  box-shadow:0 30px 70px rgba(0,0,0,.25); max-width:480px; width:100%;
  transform:translateY(8px) scale(.98); animation:modal-in .24s cubic-bezier(.2,.8,.2,1) forwards; }
@keyframes overlay-in { to { opacity:1; } }
@keyframes modal-in { to { transform:translateY(0) scale(1); } }
```

---

## 5. Layout Principles

- **Spacing System**: 基数 `8px`，序列 `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128`px。
- **Grid System**: 12 列，gutter `24px`（移动端 `16px`）。
- **Container**: `max-width: 1024px`，左右 `padding: 24px`（移动端 `20px`）。阅读正文列 `max-width: 720px`。
- **Section Spacing**: 区块间垂直间距 `100px`（桌面）/ `64px`（移动）。浅灰 `#F5F5F7` 分区带交替营造节奏。
- **留白哲学**: Apple 式大留白——hero 上下留白充足（140px），区块间用浅灰带分隔；正文行高 1.47，段落间距克制。

---

## 6. Depth & Elevation

### Shadow System

```css
--shadow-xs: 0 1px 2px  rgba(0,0,0,.04);
--shadow-sm: 0 1px 3px  rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
--shadow-md: 0 4px 12px rgba(0,0,0,.08);
--shadow-lg: 0 12px 30px rgba(0,0,0,.10);
--shadow-xl: 0 24px 48px rgba(0,0,0,.12);
--shadow-2xl: 0 40px 80px rgba(0,0,0,.16);
```

### Surface Layers

```
background  →  --color-bg        (white / black)
surface     →  --color-surface   (cards, nav)
band        →  --color-surface-alt (#F5F5F7 section bands)
elevated    →  --color-surface + --shadow-lg (modal)
overlay     →  rgba(0,0,0,.4) backdrop blur (modal scrim)
```

### Z-index Scale

```
nav: 50 · dropdown: 60 · modal-overlay: 100 · toast: 200
```

### Backdrop Effects

```css
.nav, .modal-overlay { backdrop-filter: blur(20px) saturate(180%); }
```

---

## 7. Do's and Don'ts

**Do's**
1. 全站系统字体（SF Pro 观感），不引入衬线或外部字体。
2. 颜色几乎单色（黑/灰/白），仅以 Apple 蓝 `#0066CC` 点睛所有交互。
3. 主 CTA 用 pill（border-radius 980px）蓝色按钮；次要用描边 pill 或文字链接。
4. 导航毛玻璃：`rgba(255,255,255,.72)` + `blur(20px)`。
5. 用浅灰 `#F5F5F7` 分区带交替，制造 Apple 式呼吸节奏。
6. 大字号 600 字重 + 负字距（-0.01 ~ -0.02em）做紧排。
7. 卡片圆角 18px，hover 仅 4px 上浮 + 阴影加深。

**Don'ts**
1. 不要用第二种强调色，蓝色是唯一交互色。
2. 不要用衬线字体或花哨标题字。
3. 不要重阴影/发光特效；保持克制 depth。
4. 不要用纯黑 `#000` 做浅色模式文字，用 `#1D1D1F`。
5. 不要在浅色模式用纯白卡片配纯白底而无边框——需 1px `#D2D2D7` 描边或浅灰带。
6. 不要在小屏堆 3 列卡片——折叠为单列。
7. 不要动画时长 > 300ms。

---

## 8. Responsive Behavior

- **Breakpoints**: `mobile ≤ 640px` · `tablet 641–1024px` · `desktop 1025–1440px` · `wide ≥ 1441px`
- **Touch Targets**: 最小 `44 × 44px`（按钮、导航项、标签可点区域）。
- **折叠策略**:
  - 导航：桌面横排；移动端折叠为汉堡菜单。
  - 文章网格：桌面 2 列 → 移动 1 列。
  - Hero 标题：`clamp(36px, 8vw, 72px)` 流式缩放。
- **Font Scaling**: Display/H1 用 `clamp()` 平滑过渡，正文固定 17px 不缩。

---

## 9. Agent Prompt Guide

### Quick Reference
- 调色板变量前缀 `--color-*`，明暗双主题靠 `[data-theme]` 切换。
- 字体：系统字体栈（SF Pro 观感），无 web font。
- 间距走 8px 基数；容器 `max-width:1024px`。
- 圆角：按钮/标签 980px(pill)，卡片/输入 18/12px，modal 20px。
- 阴影层级 `--shadow-xs` → `--shadow-2xl`，hover 升一级。

### Component Prompts
1. `生成一个文章卡片 .card（圆角18、overflow hidden），含封面图、分类 badge、标题(H3)、摘要、作者+日期，hover 上浮 4px。`
2. `生成 frosted 顶部导航 .nav，含 logo、首页/文章/关于链接、暗色切换，移动端汉堡。`
3. `生成 newsletter 订阅区，浅灰带背景，含标题(H2)、说明、email .input + 蓝色 pill 提交。`
4. `生成单篇文章页 .post，含 hero 标题(H1)、meta 行、720px 正文、代码块(#F5F5F7)、底部 tags + 分享。`
5. `生成错误/空状态 modal，.modal-overlay + .modal，圆角20，含标题、说明、.btn-secondary 关闭。`
6. `生成 footer，含 4 列链接、社交、版权(Small)、回到顶部按钮，浅灰带背景。`

### Iteration Guide
1. 任何新组件先复用 `--color-*` 变量，禁止硬编码 hex（除一次性阴影）。
2. 新增排版层级必须从 §3 Type Scale 取 token，勿自创尺寸。
3. 暗色模式测试：切 `[data-theme="dark"]` 确认对比度，accent 在暗底提亮为 `#2997FF`。
4. 间距只用 8px 序列值。
5. 圆角统一：按钮/标签 pill，卡片 18、输入 12、modal 20。
6. hover 动效 ≤ 250ms，用 `ease`/`cubic-bezier(.2,.8,.2,1)`。
7. 移动端必过 360px 校验，导航与网格必须折叠。
8. 可访问性：focus 态必须有 `box-shadow` 聚焦环（accent-soft），对比度 ≥ 4.5:1。
9. 图片加 `loading="lazy"` 与 `alt`，封面统一 18px 圆角（卡片内 overflow hidden）。
10. 交付前跑一次 §7 Do's/Don'ts 清单自查。
