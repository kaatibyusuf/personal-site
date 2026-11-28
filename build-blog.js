/* Builds the blog. No installs needed. Run:  node build-blog.js
   Write posts as posts/my-post.md. Output goes to blog/ (commit it). */
const fs = require('fs'), path = require('path');
const SITE = 'https://www.kaatibyusuf.com';          // used only for the RSS feed and share links
const ROOT = __dirname, POSTS = path.join(ROOT, 'posts'), OUT = path.join(ROOT, 'blog');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const safeUrl = u => /^(https?:|mailto:|\/|\.\/|\.\.\/|#)/i.test(u) || !/^[a-z]+:/i.test(u) ? u : '#';

function inline(t) {
  const codes = [];
  t = t.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
  t = esc(t);
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => '<img src="' + safeUrl(u) + '" alt="' + a + '" loading="lazy">');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, a, u) => { const ext = /^https?:/i.test(u); return '<a href="' + safeUrl(u) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + a + '</a>'; });
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => '<code>' + esc(codes[i]) + '</code>');
}

function markdown(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n'); let out = [], i = 0;
  const isBlock = l => /^(#{1,4}\s|>\s?|[-*]\s|\d+\.\s|```|---+\s*$)/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith('```')) { const b = []; i++; while (i < lines.length && !lines[i].startsWith('```')) b.push(lines[i++]); i++; out.push('<pre><code>' + esc(b.join('\n')) + '</code></pre>'); continue; }
    let m = l.match(/^(#{1,4})\s+(.*)/);
    if (m) { const n = Math.min(4, m[1].length + 1); out.push('<h' + n + '>' + inline(m[2]) + '</h' + n + '>'); i++; continue; }
    if (/^---+\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(l)) { const b = []; while (i < lines.length && /^>\s?/.test(lines[i])) b.push(lines[i++].replace(/^>\s?/, '')); out.push('<blockquote>' + markdown(b.join('\n')) + '</blockquote>'); continue; }
    if (/^[-*]\s/.test(l)) { const b = []; while (i < lines.length && /^[-*]\s/.test(lines[i])) b.push('<li>' + inline(lines[i++].replace(/^[-*]\s/, '')) + '</li>'); out.push('<ul>' + b.join('') + '</ul>'); continue; }
    if (/^\d+\.\s/.test(l)) { const st = parseInt(l, 10), b = []; while (i < lines.length && /^\d+\.\s/.test(lines[i])) b.push('<li>' + inline(lines[i++].replace(/^\d+\.\s/, '')) + '</li>'); out.push('<ol' + (st > 1 ? ' start="' + st + '"' : '') + '>' + b.join('') + '</ol>'); continue; }
    const p = []; while (i < lines.length && lines[i].trim() && !isBlock(lines[i])) p.push(lines[i++]); out.push('<p>' + inline(p.join(' ')) + '</p>');
  }
  return out.join('\n');
}

function parse(file) {
  const raw = fs.readFileSync(path.join(POSTS, file), 'utf8').replace(/^﻿/, ''), meta = {}; let body = raw;
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (m) { body = raw.slice(m[0].length); m[1].split(/\r?\n/).forEach(l => { const k = l.match(/^(\w+):\s*(.*)$/); if (k) meta[k[1].toLowerCase()] = k[2].trim().replace(/^["']|["']$/g, ''); }); }
  const slug = file.replace(/\.md$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const words = body.split(/\s+/).filter(Boolean).length;
  return { slug, title: meta.title || slug, date: meta.date || '1970-01-01', summary: meta.summary || '', draft: /^(true|yes)$/i.test(meta.draft || ''), html: markdown(body), mins: Math.max(1, Math.round(words / 200)) };
}
const fmt = d => { const x = new Date(d + 'T00:00:00Z'); return isNaN(x) ? d : x.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };

const head = (title, desc, rel, extra = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="article">
  <meta name="theme-color" content="#FAF9F6">
  <link rel="alternate" type="application/rss+xml" title="Abdulsamad Yusuf" href="${rel}blog/feed.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
  <script>(function(){var d=document.documentElement;d.classList.add('js');var t=null;try{t=localStorage.getItem('theme')}catch(e){}if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.setAttribute('data-theme',t);})();</script>
  <link rel="stylesheet" href="${rel}style.css">${extra}
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="nav" id="nav">
    <a class="brand" href="${rel}index.html" aria-label="Home">~/abdulsamad</a>
    <div class="bar">
      <nav id="menu" aria-label="Primary">
        <a href="${rel}index.html#projects">/projects</a>
        <a href="${rel}index.html#writing">/writing</a>
        <a href="${rel}blog/index.html">/blog</a>
        <a href="${rel}index.html#papers">/papers</a>
        <a href="${rel}index.html#reading">/reading</a>
        <a href="${rel}index.html#about">/about</a>
        <a href="${rel}index.html#contact">/contact</a>
      </nav>
      <button class="theme" id="theme" type="button" aria-label="Switch between light and dark theme">
        <svg class="i-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        <svg class="i-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
      </button>
      <button class="burger" id="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
    </div>
  </header>
`;
const SUBSTACK = 'https://kaatibyuusuf.substack.com/';
const subBox = `<aside class="sub" aria-label="Subscribe by email">
          <p class="sub-t">get new posts in your inbox</p>
          <p class="sub-d">one email when i publish something new. no spam, and you can unsubscribe anytime.</p>
          <a class="pill" href="${SUBSTACK}" target="_blank" rel="noopener">Subscribe by email</a>
        </aside>`;
const foot = rel => `
  <footer class="foot"><div class="wrap">© ${new Date().getFullYear()} Abdulsamad Yusuf</div></footer>
  <script src="${rel}script.js"></script>
</body>
</html>
`;

fs.mkdirSync(POSTS, { recursive: true });
const posts = fs.readdirSync(POSTS).filter(f => f.endsWith('.md')).map(parse).filter(p => !p.draft).sort((a, b) => b.date.localeCompare(a.date));
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });

const list = posts.length ? '<ul class="rows">' + posts.map(p => `
          <li><a class="row" href="${p.slug}.html"><span class="row-title">${esc(p.title)}</span>${p.summary ? '<span class="row-desc">' + esc(p.summary) + '</span>' : ''}<span class="row-tags">${fmt(p.date)} · ${p.mins} min read</span></a></li>`).join('') + '\n        </ul>' : '<p class="prose">No posts yet. Check back soon.</p>';
fs.writeFileSync(path.join(OUT, 'index.html'), head('Blog · Abdulsamad Yusuf', 'Notes on building software, learning and faith by Abdulsamad Yusuf (Kaatib Yusuf).', '../') + `
  <main id="main">
    <section class="block blog-top">
      <div class="wrap">
        <h1 class="page-h">~/blog</h1>
        <p class="prose">Notes on building software, learning and faith.</p>
        ${subBox}
        ${list}
      </div>
    </section>
  </main>` + foot('../'));

posts.forEach((p, i) => {
  const next = posts[i - 1], prev = posts[i + 1];
  fs.writeFileSync(path.join(OUT, p.slug + '.html'), head(p.title + ' · Abdulsamad Yusuf', p.summary || p.title, '../') + `
  <main id="main">
    <article class="block blog-top">
      <div class="wrap post">
        <p class="crumb"><a href="index.html">~/blog</a></p>
        <h1 class="post-h">${esc(p.title)}</h1>
        <p class="meta">${fmt(p.date)} · ${p.mins} min read</p>
        <div class="post-body">
${p.html}
        </div>
        ${subBox}
        <nav class="post-nav" aria-label="More posts">
          ${prev ? `<a href="${prev.slug}.html"><span class="muted">Older</span>${esc(prev.title)}</a>` : '<span></span>'}
          ${next ? `<a class="r" href="${next.slug}.html"><span class="muted">Newer</span>${esc(next.title)}</a>` : '<span></span>'}
        </nav>
      </div>
    </article>
  </main>` + foot('../'));
});

fs.writeFileSync(path.join(OUT, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Abdulsamad Yusuf</title><link>${SITE}/blog/index.html</link><description>Notes on building software, learning and faith.</description>
${posts.map(p => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${p.slug}.html</link><guid>${SITE}/blog/${p.slug}.html</guid><pubDate>${new Date(p.date + 'T08:00:00Z').toUTCString()}</pubDate><description>${esc(p.summary)}</description></item>`).join('\n')}
</channel></rss>
`);
console.log('Built ' + posts.length + ' post' + (posts.length === 1 ? '' : 's') + ' into blog/');

// Keep the "latest post" line on the homepage current
if (posts.length) {
  const idx = path.join(__dirname, 'index.html');
  if (fs.existsSync(idx)) {
    const p = posts[0];
    const line = '<!--latest--><p class="latest">Latest: <a href="blog/' + p.slug + '.html">' + esc(p.title) + '</a> <span class="muted">· ' + fmt(p.date) + '</span></p><!--/latest-->';
    const h = fs.readFileSync(idx, 'utf8');
    const out = h.replace(/<!--latest-->[\s\S]*?<!--\/latest-->/, () => line);
    if (out !== h) fs.writeFileSync(idx, out);
  }
}
