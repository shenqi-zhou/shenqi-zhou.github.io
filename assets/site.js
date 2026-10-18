(function () {
  var root = document.documentElement;
  root.classList.add('js');      /* set here, not inline, so a failed load leaves the no-JS layout */

  /* Draft view: ?edit (or #edit) shows the hidden "todo" items */
  if (/[?&]edit\b/.test(location.search) || location.hash === '#edit') {
    root.classList.add('show-todo');
    document.querySelectorAll('.todo[hidden], .edit-banner[hidden]').forEach(function (el) { el.hidden = false; });
  }

  /* Theme toggle: follows the system until the visitor picks one */
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    var dark = window.matchMedia('(prefers-color-scheme: dark)');
    var isDark = function () {
      var t = root.getAttribute('data-theme');
      return t ? t === 'dark' : dark.matches;
    };
    var metas = [].slice.call(document.querySelectorAll('meta[name="theme-color"]'));
    var sync = function () {
      toggle.setAttribute('aria-pressed', String(isDark()));
      /* the browser bar follows a theme picked by hand, not only the system one */
      if (root.getAttribute('data-theme')) {
        var c = isDark() ? '#1c1a17' : '#f0ede6';
        metas.forEach(function (m) { m.setAttribute('content', c); });
      }
    };
    toggle.hidden = false;
    sync();
    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      sync();
    });
    if (dark.addEventListener) dark.addEventListener('change', sync);
  }

  /* Photo card: click (or Enter / Space) flips between the photo and the avatar */
  var flip = document.querySelector('.flip');
  if (flip) {
    root.classList.add('flip-ready');
    /* only a working card is announced as a toggle; without JS the button is named by the photo's alt */
    flip.setAttribute('aria-pressed', 'false');
    flip.setAttribute('aria-label', 'Photo of Shenqi Zhou. Show the illustrated avatar');
    flip.addEventListener('click', function () {
      flip.setAttribute('aria-pressed', String(flip.getAttribute('aria-pressed') !== 'true'));
    });
  }

  var bar = document.querySelector('.topbar');
  var big = document.querySelector('.hero .name');
  var side = document.querySelector('.side');
  var wide = window.matchMedia('(min-width: 701px)');

  /* Profile column: sticks below the top bar; if it is taller than the window,
     it scrolls until its last line shows and stops there */
  var placeSide = function () {
    if (!side || !bar) return;
    if (!wide.matches) { root.style.removeProperty('--side-top'); return; }
    var top = bar.offsetHeight + 34;
    var room = window.innerHeight - side.offsetHeight - 24;
    root.style.setProperty('--side-top', Math.round(Math.min(top, room)) + 'px');
  };

  /* Top-bar links: the section being read is marked in ink with the gold underline */
  var links = [].slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var picked = null;     /* a link just clicked keeps its mark when the page cannot scroll any further */
  links.forEach(function (a) { a.addEventListener('click', function () { picked = a; }); });
  links.forEach(function (a) { if (location.hash && a.getAttribute('href') === location.hash) picked = a; });
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { picked = null; }, { passive: true });
  });
  var spy = function () {
    var targets = links.map(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      return el && !el.hidden ? { a: a, el: el } : null;
    }).filter(Boolean);
    if (!targets.length) return;
    /* a section counts once its heading is near the top bar, so News above Manuscript does not light up "Research" */
    var line = Math.min(window.innerHeight * 0.4, bar.offsetHeight + 140), current = null;
    targets.forEach(function (t) { if (t.el.getBoundingClientRect().top <= line) current = t; });
    var atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (window.scrollY < 40) current = null;          /* at the top of the page nothing is marked */
    else if (atEnd && current) {
      targets.forEach(function (t) {
        var r = t.el.getBoundingClientRect();
        var seen = r.top < window.innerHeight && r.bottom > bar.offsetHeight + 40;
        if (seen && (!picked || t.a === picked)) current = t;
      });
    }
    links.forEach(function (a) {
      var on = !!current && current.a === a;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  };

  /* Small name in the top bar: shown once the large name has scrolled out of view */
  var nameState = function () {
    if (bar && big) bar.classList.toggle('scrolled', big.getBoundingClientRect().bottom < bar.offsetHeight);
  };
  if (bar && big) root.classList.add('watch-name');

  var onScroll = function () { nameState(); spy(); };
  var onResize = function () { placeSide(); nameState(); spy(); };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  if (window.ResizeObserver && side) new ResizeObserver(placeSide).observe(side);
  onResize();
})();
