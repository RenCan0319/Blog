// 熵 Blog — main.js
// Theme toggle (persisted), mobile nav, back-to-top, share modal.

(function () {
  'use strict';

  // ---- Theme ----
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  var saved = null;
  try { saved = localStorage.getItem('shang-theme'); } catch (e) {}
  if (saved) {
    root.setAttribute('data-theme', saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  }
  function syncIcon() {
    if (toggle) toggle.textContent = root.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  }
  syncIcon();
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('shang-theme', next); } catch (e) {}
      syncIcon();
    });
  }

  // ---- Mobile nav ----
  var burger = document.getElementById('navBurger');
  var links = document.getElementById('navLinks');
  if (burger && links) {
    burger.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.addEventListener('click', function (e) {
      if (e.target.classList.contains('nav-link')) links.classList.remove('open');
    });
  }

  // ---- Back to top ----
  var toTop = document.getElementById('toTop');
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Share modal ----
  var modal = document.getElementById('shareModal');
  window.sharePost = function () {
    if (modal) { modal.style.display = 'flex'; }
  };
  window.closeModal = function () {
    if (modal) { modal.style.display = 'none'; }
  };
  window.copyShare = function () {
    var inp = document.getElementById('shareUrl');
    if (inp && navigator.clipboard) {
      navigator.clipboard.writeText(inp.value).then(function () {
        var btn = document.querySelector('#shareModal .btn-primary');
        if (btn) { btn.textContent = '已复制'; setTimeout(function () { btn.textContent = '复制'; }, 1500); }
      });
    }
  };
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }

  // ---- Hero: 文字逐字 + 背景连线粒子动效 ----
  var hero = document.getElementById('hero');
  if (hero) {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 标题逐字拆分（保留 <br>），逐个延迟
    var title = document.getElementById('heroTitle');
    if (title && !reduceMotion) {
      var segs = title.innerHTML.split(/<br\s*\/?>/i);
      var ci = 0, out = '';
      segs.forEach(function (seg, si) {
        if (si > 0) out += '<br>';
        Array.from(seg).forEach(function (ch) {
          if (ch === ' ') out += '<span class="char space"> </span>';
          else out += '<span class="char" style="transition-delay:' + (0.12 + ci * 0.04) + 's">' + ch + '</span>';
          ci++;
        });
      });
      title.innerHTML = out;
    }

    // 文字入场：依次延迟（标题由 .char 自行控制）
    var anims = Array.prototype.slice.call(hero.querySelectorAll('.hero-anim'));
    anims.forEach(function (el, i) { el.style.transitionDelay = (i * 0.14) + 's'; });

    // 触发入场
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add('is-in'); });
    });

    // 背景：连线粒子（云/数据节点），鼠标轻微吸引
    var canvas = document.getElementById('heroCanvas');
    if (!reduceMotion && canvas && canvas.getContext) {
      var ctx = canvas.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var hw, hh, nodes;
      function resize() {
        var r = hero.getBoundingClientRect();
        hw = r.width; hh = r.height;
        canvas.width = hw * dpr; canvas.height = hh * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var count = Math.max(16, Math.min(44, Math.round(hw / 28)));
        nodes = [];
        for (var i = 0; i < count; i++) {
          nodes.push({
            x: Math.random() * hw, y: Math.random() * hh,
            vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
            r: Math.random() * 1.5 + 0.7
          });
        }
      }
      var mouse = { x: -999, y: -999 };
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      });
      hero.addEventListener('mouseleave', function () { mouse.x = -999; mouse.y = -999; });
      function accent() {
        return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3b82f6';
      }
      function tick() {
        ctx.clearRect(0, 0, hw, hh);
        var col = accent();
        for (var i = 0; i < nodes.length; i++) {
          var n = nodes[i];
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > hw) n.vx *= -1;
          if (n.y < 0 || n.y > hh) n.vy *= -1;
          var dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
          if (d < 150) { n.x += dx / d * 0.4; n.y += dy / d * 0.4; }
          for (var j = i + 1; j < nodes.length; j++) {
            var m = nodes[j], dd = Math.hypot(n.x - m.x, n.y - m.y);
            if (dd < 118) {
              ctx.globalAlpha = (1 - dd / 118) * 0.16;
              ctx.strokeStyle = col; ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
            }
          }
          ctx.globalAlpha = 0.55; ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(tick);
      }
      resize();
      window.addEventListener('resize', resize);
      tick();
    }
  }

  // ---- Scroll reveal (progressive enhancement) ----
  // 核心内容（正文等）默认在 CSS 中可见；只有 JS 成功加载后才加 .reveal-init
  // 进入"先隐藏再淡入"状态，从而 JS 失败/被拦截时内容仍可读。
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function showReveal(el) { el.classList.remove('reveal-init'); el.classList.add('is-visible'); }
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          showReveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el, i) {
      el.classList.add('reveal-init');   // 隐藏，待进入视口再淡入
      el.style.transitionDelay = (Math.min(i, 6) * 60) + 'ms';
      io.observe(el);
    });
    // 安全网：阈值/极长元素等极端情况下，若观察器未触发，超时后强制显示，
    // 避免内容（尤其正文这类核心阅读区）永久停留在隐藏态。
    setTimeout(function () {
      reveals.forEach(function (el) {
        if (el.classList.contains('reveal-init')) showReveal(el);
      });
    }, 1500);
  } else {
    reveals.forEach(showReveal);
  }
})();
