# Jeff 的个人博客

Apple 风格的个人博客（纯静态），文章聚焦 **Zendesk / Amazon Connect Customer Profiles / 随想 / 工程笔记**。
支持分板块长文、按主题浏览、暗色模式，并内置 **Decap CMS** 作为内容后台。

## 内容如何同步到 Git 与上线

两条路径，最终都靠 **GitHub 上的 commit 触发 Cloudflare 自动构建部署**：

- **写文章（后台）**：打开 `/admin` → 登录 GitHub → 写文 → 点 **Publish**。Decap 会用你的 GitHub 身份调用 API，把文章写成 `posts/*.md` **自动提交到 `main` 分支**，随即触发 Cloudflare 重新构建并上线。你只需点一下 Publish，无需手敲 git。
- **改代码（手动）**：改 `index.template.html` / `posts/*.md` / 样式等，然后 `git add -A && git commit && git push`，同样自动重新部署。

> Git 里存的是"源"（模板 + Markdown + 资源 + 配置）；生成的 HTML（`index.html`、`archive.html`、`category/`、`posts/*.html`）被 `.gitignore` 忽略，是 Cloudflare 云端 `node build.js` 现生成的——所以仓库里看不到它们，但访问站点永远是最新的。

## 技术栈

- 纯 HTML + CSS + 原生 JS（无前端框架、无运行时依赖）
- `build.js`（Node 零依赖）：把 `posts/*.md` 编译成 HTML，并自动生成首页文章网格、分类页、归档页、文章内"相关文章"
- 部署：**Cloudflare Pages**，构建命令 `node build.js`，输出目录 `.`
- 后台：**Decap CMS**（`/admin`），文章以 Markdown 形式存于 `posts/`

## 本地开发

```bash
node build.js            # 生成所有页面（index.html / archive.html / category/*.html / posts/*.html）
npx serve .              # 本地预览（或 python -m http.server 8080）
```

> 构建产物（`index.html`、`archive.html`、`category/`、`posts/*.html`）已被 `.gitignore` 忽略，
> **不要手改**——改 `index.template.html` 或 `posts/*.md`，然后重新 `node build.js`。

## 部署到 Cloudflare Pages（推荐：Git 集成）

1. 打开 [Cloudflare Dashboard → Workers & Pages → Create](https://dash.cloudflare.com/?to=/:account/workers-and-pages)，选 **Pages** → **Connect to Git**。
2. 授权 GitHub，选择本仓库 **`RenCan0319/Blog`**。
3. 构建设置：
   - **Framework preset**：`None`
   - **Build command**：`node build.js`
   - **Build output directory**：`.`（根目录，因为构建产物就写在仓库根）
4. 点击 **Save and Deploy**。之后每次 `git push` 到 `main` 都会自动重新构建并发布。

> 也可用 CLI：先 `npm install -g wrangler`，再 `npm run deploy`（= `node build.js && wrangler pages deploy .`）。

## 可选：开启 Decap CMS 后台（/admin）

Decap 在 Cloudflare 上没有内置登录（那是 Netlify 专属），需自建一个 OAuth Worker：

1. 在 GitHub 创建一个 **OAuth App**（Settings → Developer settings → OAuth Apps），
   Authorization callback URL 填你稍后部署的 Worker 地址 `https://<oauth-worker>.workers.dev/callback`。
2. 部署 OAuth Worker：
   ```bash
   cd decap-oauth
   wrangler deploy          # 首次会让你登录
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   ```
3. 修改 `admin/config.yml`：把 `repo` 改成 `RenCan0319/Blog`，`base_url` 改成你的 Worker 地址。
4. 访问 `https://<你的站点>/admin`，用 GitHub 登录即可在浏览器里写文章、传图。

## 目录结构

```
.
├── index.template.html   # 首页模板（含 <!-- POSTS --> 占位）
├── category.template.html# 分类页模板
├── about.html            # 关于页（静态）
├── build.js              # 构建脚本：MD → HTML，生成首页/分类/归档
├── posts/                # 文章源（Markdown，Decap 管理）
├── assets/               # CSS / JS / 图片
├── admin/                # Decap CMS 后台
├── decap-oauth/          # GitHub OAuth Worker（无服务器）
├── wrangler.toml         # Cloudflare 配置
├── _headers              # 安全响应头 + 缓存
└── DESIGN.md             # 设计系统文档
```

## 设计风格

见 [`DESIGN.md`](./DESIGN.md)：Apple 风格（系统字体栈、纯白 + 浅灰分区、Apple 蓝 `#0066CC`、毛玻璃导航、药丸按钮、大留白）。
