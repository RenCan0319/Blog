# 部署到 Cloudflare Pages

熵 是一个静态站点（HTML + CSS + JS）。内容由 `posts/*.md` 经 `build.js` 生成，编辑文章通过 **Decap CMS** 后台完成。

## 目录结构

```
.
├── index.template.html   # 首页模板（含 <!-- POSTS --> 占位 + 主题卡）
├── index.html            # 由 build.js 生成（勿手改）
├── about.html            # 关于页（静态）
├── archive.html          # 全部文章页（由 build.js 生成，勿手改）
├── category.template.html# 分类页模板
├── category/             # 各分类页（由 build.js 生成，勿手改）
│   └── <slug>.html
├── build.js              # 构建脚本：MD → HTML，生成首页/分类/归档/相关文章
├── posts/                # 文章源（Markdown，Decap CMS 管理）
│   ├── *.md              # 源文件
│   └── *.html            # 由 build.js 生成（勿手改）
├── assets/               # CSS / JS / 图片
├── admin/                # Decap CMS 后台（/admin）
├── decap-oauth/          # GitHub OAuth Worker（无服务器）
├── wrangler.toml         # 站点：Cloudflare Pages 配置
└── _headers              # 安全响应头 + 缓存
```

> 首页的「按主题浏览」卡片、每个 `category/<slug>.html` 分类页、`archive.html` 全部文章页，以及文章页底部的「相关文章」都由 `build.js` 自动生成，**无需手动创建或编辑**。改文章只需编辑 `posts/*.md`（或 Decap 后台）。

## 方式一：Git 集成（推荐，自动 CI/CD）

1. 推送仓库到 GitHub：
   ```bash
   git init && git add . && git commit -m "Jeff blog initial"
   git remote add origin <你的仓库地址> && git push -u origin main
   ```
2. Cloudflare Dashboard → Pages → **Create a project** → **Connect to Git**。
3. 配置：
   - **Framework preset**: `None`
   - **Build command**: `node build.js`
   - **Build output directory**: `.`
4. 每次 `git push`（包括 Decap CMS 的提交）都会自动重新构建并部署。

## 方式二：CLI 直接上传（wrangler）

```bash
npm install -g wrangler
wrangler login
node build.js            # 先本地生成 HTML
wrangler pages deploy .  # 再上传
```

## 自定义域名

Pages 项目 → **Custom domains** → 添加域名（如 `blog.example.com`），按提示加 DNS 记录（CNAME 指向 `*.pages.dev`），Cloudflare 自动签发免费 SSL。

## 内容后台：Decap CMS（/admin）

Decap CMS 让你在浏览器里写文章、传图，提交后自动推到 Git 并触发重新部署——无需服务器，站点仍是静态。

### 一次性设置（三步）

1. **创建 GitHub OAuth App**（GitHub → Settings → Developer settings → OAuth Apps）
   - Homepage URL: `https://<你的 Pages 地址>`
   - Authorization callback URL: `https://<你的 OAuth Worker 地址>/callback`
   - 记下 `Client ID` 与 `Client Secret`。

2. **部署 OAuth Worker**（`decap-oauth/`）
   ```bash
   cd decap-oauth
   wrangler login
   wrangler secret put GITHUB_CLIENT_ID      # 粘贴 Client ID
   wrangler secret put GITHUB_CLIENT_SECRET  # 粘贴 Client Secret
   # 编辑 wrangler.toml 的 CMS_BASE 为你的 Pages 地址
   wrangler deploy
   ```

3. **改两处占位**
   - `admin/config.yml`：`repo` 改成你的仓库；`base_url` 改成上一步的 Worker 地址。
   - （如需本地预览 CMS：`npx decap-cms-proxy-server` 或本地起 Worker。）

完成后访问 `https://<你的 Pages 地址>/admin`，用 GitHub 登录即可发文。新文章存为 `posts/*.md`，图片进 `assets/img/`。

### 写作约定
- 用 `<h2>` 划分板块；`build.js` 会自动生成"本文结构"目录与 `01 / 02 …` 编号。
- 封面图字段填 `/assets/img/xxx.jpg`（在后台上传即自动生成路径）。
- 分类可选：Zendesk / Amazon Connect / 随想 / 工程笔记。

## 注意事项

- 字体使用系统字体栈（SF Pro 观感），无需 web font 请求，加载更快。
- 图片已本地化存放在 `assets/img/`，随站点一起部署，无外部依赖；替换时直接覆盖同名文件即可。
- `index.html` 与 `posts/*.html` 由 `build.js` 生成，修改请改 `index.template.html` 或 `posts/*.md`，不要手改生成结果。
- 暗色模式偏好与切换状态保存在 `localStorage`（键名 `jeff-theme`）。