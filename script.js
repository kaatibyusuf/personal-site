(function () {
  var root = document.documentElement;

  // Theme toggle
  var btn = document.getElementById('theme');
  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#0A0A0A' : '#FAF9F6');
  });

  // Mobile menu
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  document.getElementById('menu').addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setMenu(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Local time in Lagos
  var clock = document.getElementById('clock');
  function tick() {
    try {
      clock.textContent = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Lagos', hour: 'numeric', minute: '2-digit'
      }).format(new Date());
    } catch (e) { clock.textContent = ''; }
  }
  tick();
  setInterval(tick, 30000);

  // Terminal intro, shown once per session
  var intro = document.getElementById('intro');
  if (!intro || root.classList.contains('no-intro')) return;

  var items = Array.prototype.slice.call(intro.querySelectorAll('[data-type]'));
  var finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    intro.classList.add('done');
    try { sessionStorage.setItem('intro', '1'); } catch (e) {}
    setTimeout(function () { intro.style.display = 'none'; }, 600);
  }
  intro.addEventListener('click', finish);
  document.addEventListener('keydown', finish, { once: true });

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function type(el, text, speed) {
    el.classList.add('caret');
    for (var i = 0; i < text.length; i++) {
      if (finished) return;
      el.textContent = text.slice(0, i + 1);
      await wait(speed);
    }
    el.classList.remove('caret');
  }

  (async function run() {
    await wait(300);
    for (var i = 0; i < items.length; i++) {
      if (finished) return;
      var el = items[i];
      var isCmd = el.classList.contains('cmd');
      await type(el, el.getAttribute('data-type'), isCmd ? 55 : 28);
      await wait(isCmd ? 220 : 320);
    }
    await wait(500);
    finish();
  })();
})();
