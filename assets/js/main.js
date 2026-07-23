// Jeff Blog — main.js
// Theme toggle (persisted), mobile nav, back-to-top, share modal.

(function () {
  'use strict';

  // ---- Theme ----
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  var saved = null;
  try { saved = localStorage.getItem('jeff-theme'); } catch (e) {}
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
      try { localStorage.setItem('jeff-theme', next); } catch (e) {}
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

  // ---- Scroll reveal (entrance, staggered) ----
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el, i) {
      // 同组相邻元素轻微错峰
      el.style.transitionDelay = (Math.min(i, 6) * 60) + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();
