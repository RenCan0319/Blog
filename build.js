/*
 * Jeff Blog — build.js
 * Reads posts/*.md (Decap CMS output) and generates:
 *   - posts/<slug>.html       (each article, with auto TOC + numbered sections + related)
 *   - index.html              (home: hero + topic cards + article grid)
 *   - category/<slug>.html    (one per category)
 *   - archive.html            (all posts)
 * Cloudflare Pages build command: `node build.js`
 *
 * Note: uses `marked` (listed in package.json dependencies) to turn Decap's
 * markdown body into HTML. Existing posts that already contain HTML tags are
 * passed through marked's parser, which preserves inline HTML.
 */
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const crypto = require('crypto');
const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'posts');
const TPL = path.join(ROOT, 'index.template.html');
const CAT_TPL = path.join(ROOT, 'category.template.html');
const OUT_INDEX = path.join(ROOT, 'index.html');

// Category metadata (must match the `category:` values in posts/*.md)
const CATEGORIES = {
  'Zendesk':        { slug: 'zendesk',        desc: '梳理支持工作流、触发器与自动化，把工单系统真正用对。' },
  'Amazon Connect': { slug: 'amazon-connect', desc: '云端联络中心与 Customer Profiles，把分散的数据拼成完整的人。' },
  '随想':           { slug: 'musings',        desc: '工作之外的思考——效率、节奏，与一点人生观察。' },
};

const read = (f) => fs.readFileSync(f, 'utf8');
const write = (f, c) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, c); };

// ---- Cache-busting for static assets ----
// /assets/* is served with `Cache-Control: immutable` (see _headers), so the
// browser/CDN never revalidates a given URL. To make CSS/JS/image updates take
// effect, we append a content hash as a query string (?v=...). When the file
// changes the hash changes -> the URL changes -> clients fetch the new file;
// unchanged files keep their year-long immutable cache.
function assetHash(rel) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 10);
}
function bustAsset(html, rel) {
  const h = assetHash(rel);
  // Escape regex special chars in the filename.
  const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(escaped + '(\\?v=[^"\\s]*)?', 'g');
  return html.replace(re, rel + '?v=' + h);
}
function bustAssets(html) {
  // CSS & JS
  html = bustAsset(html, 'assets/css/styles.css');
  html = bustAsset(html, 'assets/js/main.js');
  // Images under assets/img
  const IMG_DIR = path.join(ROOT, 'assets', 'img');
  if (fs.existsSync(IMG_DIR)) {
    fs.readdirSync(IMG_DIR).forEach((f) => {
      const fp = path.join(IMG_DIR, f);
      if (fs.statSync(fp).isFile()) {
        html = bustAsset(html, 'assets/img/' + f);
      }
    });
  }
  return html;
}

function parseFM(raw) {
  const m = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { data: {}, body: raw.trim() };
  const fm = m[1];
  const body = raw.slice(m[0].length).trim();
  const data = {};
  fm.split(/\r?\n/).forEach((line) => {
    const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (mm) {
      let v = mm[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      data[mm[1]] = v;
    }
  });
  return { data, body };
}

function fmtDate(iso) {
  if (!iso) return '1970-01-01';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toISOString().slice(0, 10);
}

// Split an HTML body into numbered <section> blocks (one per <h2>) and build a TOC.
function buildSections(body) {
  const h2re = /<h2>([\s\S]*?)<\/h2>/g;
  const segs = [];
  let last = 0, m;
  while ((m = h2re.exec(body))) {
    segs.push({ pre: body.slice(last, m.index), head: null });
    segs.push({ pre: '', head: m[1] });
    last = h2re.lastIndex;
  }
  segs.push({ pre: body.slice(last), head: null });

  let out = segs[0].pre || '';
  const toc = [];
  let secN = 0, open = false;
  for (let i = 1; i < segs.length; i++) {
    const s = segs[i];
    if (s.head === null) {
      out += s.pre || '';
    } else {
      if (open) out += '</section>';
      secN++;
      const id = 's' + secN;
      const title = s.head.replace(/<[^>]+>/g, '').trim();
      toc.push({ id, title });
      out += `<section class="section-block" id="${id}"><div class="sec-eyebrow"><span class="sec-num">${String(secN).padStart(2, '0')}</span> 节</div><h2>${s.head}</h2>`;
      open = true;
    }
  }
  if (open) out += '</section>';

  let tocHtml = '';
  if (toc.length) {
    tocHtml = '<nav class="toc" aria-label="本文结构"><h4>本文结构</h4><ol>' +
      toc.map((t) => `<li><a href="#${t.id}">${t.title}</a></li>`).join('') + '</ol></nav>';
  }
  return { html: out, tocHtml };
}

function readingMinutes(body) {
  const text = body.replace(/<[^>]+>/g, ' ');
  return Math.max(1, Math.round(text.length / 350));
}

// Article card. `base` is the path prefix to reach root ('' at root, '../' in subdirs).
function cardHtml(p, base) {
  const a = p.data;
  const cat = a.category || '笔记';
  const catSlug = CATEGORIES[cat] ? CATEGORIES[cat].slug : '';
  let cover = (a.cover || '').replace(/^\//, '').trim();
  if (!cover && catSlug) cover = `assets/img/${catSlug}.jpg`;
  const coverSrc = base + cover;
  const mins = readingMinutes(p.body);
  const href = base + 'posts/' + p.slug + '.html';
  return `      <a href="${href}" class="card" style="display:block">
        <img class="card-cover" src="${coverSrc}" alt="${a.title || ''}" loading="lazy" />
        <div class="card-body">
          <span class="badge">${cat}</span>
          <h3 class="card-title">${a.title || ''}</h3>
          <p class="card-excerpt">${a.excerpt || ''}</p>
          <div class="post-meta mt-16"><span class="avatar">${(a.author || 'Jeff')[0].toUpperCase()}</span><span>${a.author || 'Jeff'} · ${p.date} · ${mins} 分钟</span></div>
        </div>
      </a>`;
}

function renderPost(p, slug, allPosts) {
  const a = p.data;
  const author = a.author || 'Jeff';
  const avatar = (author[0] || 'J').toUpperCase();
  const cat = a.category || '笔记';
  const catSlug = CATEGORIES[cat] ? CATEGORIES[cat].slug : '';
  let cover = (a.cover || '').replace(/^\//, '').trim();
  if (!cover && catSlug) cover = `assets/img/${catSlug}.jpg`;
  const coverSrc = '../' + cover;
  const date = fmtDate(a.date);
  const mins = readingMinutes(p.body);
  // Decap CMS markdown body -> HTML; existing HTML-rich posts pass through.
  const bodyProcessed = marked.parse(p.body || '');
  const { html, tocHtml } = buildSections(bodyProcessed);
  const bodyHtml = tocHtml ? tocHtml + html : html;

  // Related: same category first; if none, fall back to latest other posts
  let rel = allPosts.filter((x) => x.slug !== slug && (x.data.category || '') === cat).slice(0, 3);
  let relTitle = '相关文章';
  if (!rel.length) {
    rel = allPosts.filter((x) => x.slug !== slug).slice(0, 3);
    relTitle = '更多文章';
  }
  let relatedHtml = '';
  if (rel.length) {
    const cards = rel.map((x) => cardHtml(x, '../')).join('\n');
    relatedHtml = `<hr class="divider mt-40 mb-24" />
    <h3 style="margin-bottom:8px">${relTitle}</h3>
    <div class="grid grid-2 mt-16">
${cards}
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${a.title || slug} — Jeff</title>
  <meta name="description" content="${a.excerpt || ''}" />
  <link rel="stylesheet" href="../assets/css/styles.css" />
</head>
<body>
  <header class="nav">
    <div class="container nav-inner">
      <a href="../index.html" class="brand"><span class="mark">J</span>Jeff</a>
      <nav class="nav-links" id="navLinks">
        <a href="../index.html" class="nav-link">首页</a>
        <a href="../index.html#latest" class="nav-link">文章</a>
        <a href="../about.html" class="nav-link">关于</a>
      </nav>
      <div class="nav-right">
        <button class="theme-toggle" id="themeToggle" aria-label="切换深浅色">🌙</button>
        <button class="nav-burger" id="navBurger" aria-label="菜单">☰</button>
      </div>
    </div>
  </header>

  <article class="section-sm container read-col">
    <a href="../index.html#latest" class="nav-link reveal" style="display:inline-block;margin-bottom:24px">← 返回文章</a>
    <div class="reveal">
      <span class="badge">${cat}</span>
      <h1 style="margin-top:14px;font-family:var(--font-serif)">${a.title || ''}</h1>
      <div class="post-meta mt-16">
        <span class="avatar">${avatar}</span>
        <span>${author} · ${date} · ${mins} 分钟阅读</span>
      </div>
    </div>
    <img class="post-cover reveal" src="${coverSrc}" alt="${a.title || ''}" loading="lazy" />
    <div class="post-body reveal">${bodyHtml}</div>
    <div class="post-tags reveal"><span class="badge">${cat}</span></div>
    <hr class="divider mt-40 mb-24" />
    <div class="flex items-center justify-between reveal">
      <div class="post-meta"><span class="avatar">${avatar}</span><span>${author}</span></div>
      <div class="flex gap-8">
        <button class="btn btn-secondary" onclick="sharePost()">分享</button>
        <a href="../about.html" class="btn btn-ghost">关于作者</a>
      </div>
    </div>
${relatedHtml}
  </article>

  <footer class="footer band">
    <div class="container">
      <div class="footer-bottom" style="border:0;margin-top:0">
        <span>© 2026 Jeff. 用心写，慢慢更。</span>
        <button class="to-top" id="toTop" aria-label="回到顶部">↑</button>
      </div>
    </div>
  </footer>

  <div class="modal-overlay" id="shareModal" style="display:none">
    <div class="modal" role="dialog" aria-modal="true">
      <h3>分享这篇文章</h3>
      <p class="text-muted">复制下方链接，分享给想读的人即可。</p>
      <div class="field-row mt-16">
        <input class="input" id="shareUrl" value="https://employless.cc.cd/posts/${slug}.html" readonly />
        <button class="btn btn-primary" onclick="copyShare()">复制</button>
      </div>
      <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">关闭</button></div>
    </div>
  </div>

  <script src="../assets/js/main.js"></script>
</body>
</html>`;
}

function topicCardHtml(key, c, base) {
  const initial = key.trim().charAt(0);
  return `    <a href="${base}category/${c.slug}.html" class="topic-card reveal">
      <span class="topic-badge">${initial}</span>
      <h3>${key}</h3>
      <p>${c.desc}</p>
      <span class="topic-link">查看全部 →</span>
    </a>`;
}
function main() {
  if (!fs.existsSync(POSTS_DIR)) { console.log('No posts/ dir, nothing to build.'); process.exit(0); }
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  const posts = files.map((f) => {
    const slug = f.replace(/\.md$/, '');
    const { data, body } = parseFM(read(path.join(POSTS_DIR, f)));
    return { slug, data, body, date: fmtDate(data.date) };
  });
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));

  // Generate article pages
  posts.forEach((p) => {
    write(path.join(ROOT, 'posts', p.slug + '.html'), bustAssets(renderPost(p, p.slug, posts)));
  });
  console.log(`Built ${posts.length} article page(s).`);

  // Topic cards (Reolink Popular Service style) + latest 4 posts
  const topicCards = Object.keys(CATEGORIES)
    .map((key) => topicCardHtml(key, CATEGORIES[key], ''))
    .join('\n\n');
  const homeCards = posts.slice(0, 4).map((p) => cardHtml(p, '')).join('\n');
  write(
    OUT_INDEX,
    bustAssets(
      read(TPL)
        .replace('<!-- TOPIC_POSTS -->', topicCards)
        .replace('<!-- POSTS -->', homeCards)
    )
  );
  console.log('Rebuilt index.html grid.');

  // Category pages + archive (reuse category template; archive strips the ../ prefix)
  const catTpl = read(CAT_TPL);
  Object.keys(CATEGORIES).forEach((key) => {
    const c = CATEGORIES[key];
    const list = posts.filter((p) => (p.data.category || '') === key);
    const cards = list.map((p) => cardHtml(p, '../')).join('\n');
    const html = catTpl
      .split('{{TITLE}}').join(key)
      .split('{{DESC}}').join(c.desc)
      .replace('<!-- POSTS -->', cards || '<p class="text-muted">该分类下还没有文章。</p>');
    write(path.join(ROOT, 'category', c.slug + '.html'), bustAssets(html));
  });
  console.log(`Built ${Object.keys(CATEGORIES).length} category page(s).`);

  const archTpl = catTpl.split('../').join('');
  const archCards = posts.map((p) => cardHtml(p, '')).join('\n');
  const archHtml = archTpl
    .split('{{TITLE}}').join('全部文章')
    .split('{{DESC}}').join('这里收录 Jeff 写过的所有文章，按时间倒序排列。')
    .replace('<!-- POSTS -->', archCards);
  write(path.join(ROOT, 'archive.html'), bustAssets(archHtml));
  console.log('Built archive.html.');

  // about.html is a static page (not generated from a template); keep its asset
  // references versioned too so it also benefits from cache-busting.
  write(path.join(ROOT, 'about.html'), bustAssets(read(path.join(ROOT, 'about.html'))));
  console.log('Re-wrote about.html with versioned asset URLs.');
}

main();
