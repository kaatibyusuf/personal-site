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
    if (!clock) return;
    try {
      clock.textContent = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Lagos', hour: 'numeric', minute: '2-digit'
      }).format(new Date());
    } catch (e) { clock.textContent = ''; }
  }
  tick();
  setInterval(tick, 30000);

  // GitHub contribution graph (public data, cached for a day)
  (function () {
    var user = 'kaatibyusuf', grid = document.getElementById('ghGrid'), total = document.getElementById('ghTotal');
    if (!grid) return;
    var KEY = 'gh-contrib-v3', MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function fail() {
      var f = grid.closest('.gh').querySelector('.gh-scroll');
      f.innerHTML = '<p class="gh-msg">The graph could not load right now. You can see my activity on GitHub.</p>';
    }
    function draw(d) {
      var days = (d.contributions || []).slice(-371);
      if (!days.length || !days.some(function (x) { return x.count > 0; })) throw new Error('empty');
      var first = new Date(days[0].date + 'T00:00:00Z').getUTCDay(), html = '', cols = 0, lastM = -1, lastAt = -9, i;
      var cells = [], k;
      for (k = 0; k < first; k++) cells.push(null);
      days.forEach(function (x) { cells.push(x); });
      for (i = 0; i < cells.length; i += 7) {
        var wk = cells[i] || cells[i + 1] || cells[i + 2] || cells[i + 3] || cells[i + 4] || cells[i + 5] || cells[i + 6], m = wk ? new Date(wk.date + 'T00:00:00Z').getUTCMonth() : -1;
        var lab = m >= 0 && m !== lastM && cols - lastAt >= 4;
        html += '<span class="m">' + (lab ? MON[m] : '') + '</span>';
        if (lab) lastAt = cols;
        if (m >= 0) lastM = m;
        for (var j = 0; j < 7; j++) {
          var x = cells[i + j];
          html += x ? '<span class="c l' + Math.min(4, x.level | 0) + '" title="' + x.count + ' contribution' + (x.count === 1 ? '' : 's') + ' on ' + x.date + '"></span>' : '<span class="c pad"></span>';
        }
        cols++;
      }
      grid.innerHTML = html;
      var n = d.total && (d.total.lastYear != null ? d.total.lastYear : Object.keys(d.total).reduce(function (a, y) { return a + d.total[y]; }, 0));
      if (n == null) n = days.reduce(function (a, x) { return a + x.count; }, 0);
      total.textContent = n.toLocaleString('en-US') + ' contributions in the last year';
      grid.setAttribute('aria-label', n + ' GitHub contributions in the last year');
      var sc = document.getElementById('ghScroll'); sc.scrollLeft = sc.scrollWidth;
    }
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (cached && cached.t && Date.now() - cached.t < 864e5) { try { return draw(cached.d); } catch (e) {} }
    fetch('contributions.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .catch(function () { return fetch('https://github-contributions-api.jogruber.de/v4/' + user + '?y=last').then(function (r) { if (!r.ok) throw 0; return r.json(); }); })
      .then(function (d) { draw(d); try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} })
      .catch(function () { try { if (cached) return draw(cached.d); } catch (e) {} fail(); });
  })();

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
