// Rubric reader: opens Rubric JSON files (see FORMAT.md), renders the interlinear
// book, and prints it. Everything happens in the browser; nothing is uploaded.
(function () {
  const $ = id => document.getElementById(id);
  const RTL = ['he', 'yi', 'ar', 'fa', 'ur', 'ps', 'ckb', 'dv'];
  // Google Fonts family per language; anything else gets Noto Serif (Latin, Cyrillic, Greek, Vietnamese)
  const FONTS = {
    he: 'Frank Ruhl Libre', yi: 'Frank Ruhl Libre', ar: 'Noto Naskh Arabic', fa: 'Noto Naskh Arabic', ur: 'Noto Nastaliq Urdu',
    ja: 'Noto Serif JP', zh: 'Noto Serif SC', 'zh-tw': 'Noto Serif TC', ko: 'Noto Serif KR', hi: 'Noto Serif Devanagari',
    mr: 'Noto Serif Devanagari', ne: 'Noto Serif Devanagari', bn: 'Noto Serif Bengali', ta: 'Noto Serif Tamil', th: 'Noto Serif Thai',
    hy: 'Noto Serif Armenian', ka: 'Noto Serif Georgian', am: 'Noto Serif Ethiopic',
  };
  const EXAMPLE = { dir: 'examples/wizard-of-oz/', chapters: 24, name: 'The Wizard of Oz in Hebrew' };
  const OPENERS = /^[–—«„“‘¿¡(\[]+$/;
  const ROMAN = n => { let r = '', v = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]; for (const [a, s] of v) while (n >= a) { r += s; n -= a; } return r; };
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // notes and the key may use <b> <i> <u> <br> and <t> (target language); everything else is shown as text
  const rich = s => esc(s).replace(/&lt;(\/?)(b|i|u|br)\s*\/?&gt;/g, '<$1$2>')
    .replace(/&lt;t&gt;/g, '<span class="tgt">').replace(/&lt;\/t&gt;/g, '</span>');

  let book = {}, chapters = [], problems = [], fileNames = [];

  function word(t) {
    if (!t.includes('|')) return `<span class="p">${esc(t)}</span>`;
    let [w, g = '', tag = '', rd = ''] = t.split('|'), cls = 'w';
    if (tag[0] === '!') { cls += ' pass'; tag = tag.slice(1); }
    else if (tag[0] === '~') { cls += ' idiom'; tag = tag.slice(1); }
    return `<span class="${cls}"><span class="r">${esc(rd)}</span><span class="h">${esc(w)}</span>` +
      `<span class="g">${esc(g)}</span>${tag ? `<span class="t">${esc(tag)}</span>` : ''}</span>`;
  }

  // glue punctuation onto its word: openers to the next word, the rest to the previous one
  function tokens(ws) {
    const out = []; let pre = '';
    ws.forEach(t => {
      if (typeof t !== 'string') return;
      if (t.includes('|')) { const k = t.split('|'); k[0] = pre + k[0]; out.push(k.join('|')); pre = ''; }
      else if (OPENERS.test(t) || !out.length) pre += /^[–—]$/.test(t) ? t + ' ' : t;
      else { const k = out[out.length - 1].split('|'); k[0] += t; out[out.length - 1] = k.join('|'); }
    });
    if (pre) out.push(pre);
    return out;
  }

  function renderChapter(ch, first) {
    let n = 0, html = `<div class="chhead${first ? ' first' : ''}"><div class="num">Chapter ${ROMAN(+ch.n || 0)}</div>` +
      `<div class="tt">${esc(ch.title || '')}</div>${ch.orig_title ? `<div class="ot">${esc(ch.orig_title)}</div>` : ''}<hr></div>`;
    (ch.paras || []).forEach(p => {
      let tl = '', ln = '', notes = '', pend = [];
      (p.s || []).forEach(s => {
        n++;
        tl += `<span class="vn">${n}</span>` + tokens(s.w || []).map(word).join('');
        // an empty line joins its number onto the previous piece of text
        if (s.line) { const nums = pend.length ? `${pend[0]}–${n}` : n; ln += `<sup class="vn">${nums}</sup>${esc(s.line)} `; pend = []; }
        else if (ln) ln = ln.replace(/<sup class="vn">(\d+)(?:–\d+)?<\/sup>(?![\s\S]*<sup)/, (m, a) => `<sup class="vn">${a}–${n}</sup>`);
        else pend.push(n);
        if (s.note) notes += `<p><span class="vn">${n}</span>${rich(s.note)}</p>`;
      });
      const lnDir = book.mode === 'annotate' ? '' : ` dir="auto"`;
      html += `<div class="para"><div class="tl">${tl}</div><p class="ln"${lnDir}>${ln.trim()}</p>${notes ? `<div class="notes">${notes}</div>` : ''}</div>`;
    });
    return html;
  }

  function check() {
    problems = [];
    if (!chapters.length) problems.push('No chapters found. Is this a Rubric file? See FORMAT.md.');
    chapters.forEach(ch => {
      let n = 0;
      if (!Array.isArray(ch.paras)) return problems.push(`Chapter ${ch.n}: no "paras" list`);
      ch.paras.forEach(p => (p.s || []).forEach(s => {
        n++;
        if (!Array.isArray(s.w)) return problems.push(`Chapter ${ch.n}, sentence ${n}: no "w" token list`);
        s.w.forEach(t => {
          if (typeof t !== 'string') problems.push(`Chapter ${ch.n}, sentence ${n}: a token is not text`);
          else if (t.includes('|') && (!t.split('|')[0].trim() || !(t.split('|')[1] || '').trim())) problems.push(`Chapter ${ch.n}, sentence ${n}: token "${t}" has no word or no gloss`);
          else if (!t.includes('|') && /[\p{L}\p{N}]/u.test(t)) problems.push(`Chapter ${ch.n}, sentence ${n}: "${t}" has no gloss`);
        });
      }));
    });
  }

  function setLanguage() {
    const lang = String(book.lang || '').toLowerCase();
    const base = lang.split('-')[0];
    const fam = FONTS[lang] || FONTS[base] || 'Noto Serif';
    const id = 'tfont';
    if (!$(id) || $(id).dataset.fam !== fam) {
      if ($(id)) $(id).remove();
      const l = document.createElement('link');
      l.id = id; l.rel = 'stylesheet'; l.dataset.fam = fam;
      l.href = `https://fonts.googleapis.com/css2?family=${fam.replace(/ /g, '+')}:wght@400;500;700&display=swap`;
      document.head.appendChild(l);
    }
    const r = document.documentElement.style;
    r.setProperty('--tf', `"${fam}", serif`);
    r.setProperty('--dir', RTL.includes(base) ? 'rtl' : 'ltr');
  }

  function pageCss() {
    const run = (book.orig_title || book.title || '').toUpperCase().replace(/["\\]/g, '');
    $('pagecss').textContent = `@page { size: ${$('paper').value}; margin: 14mm 13mm 14mm;
      @top-left { content: "${run}"; font: 400 7pt Lexend, sans-serif; letter-spacing: .14em; color: #777; }
      @bottom-center { content: counter(page); font: 400 9pt Lexend, sans-serif; color: #444; } }
      @page :first { @top-left { content: none; } }`;
  }

  function render() {
    chapters.sort((a, b) => (+a.n || 0) - (+b.n || 0));
    check();
    setLanguage(); pageCss();
    const b = book, el = $('book');
    let html = '';
    if (b.title || b.orig_title) {
      html += `<div class="title">${b.author ? `<div class="by">${esc(b.author)}${b.year ? ' · ' + esc(b.year) : ''}</div>` : ''}` +
        `<div class="tt">${esc(b.title || '')}</div>${b.orig_title ? `<div class="ot">${esc(b.orig_title)}</div>` : ''}<hr></div>`;
      if (b.key) html += `<p class="key">${rich(b.key)}</p>`;
    }
    chapters.forEach((ch, i) => { html += renderChapter(ch, i === 0); });
    if (b.credit) html += `<p class="colophon">${rich(b.credit)}</p>`;
    el.innerHTML = html;
    const hasRead = chapters.some(ch => (ch.paras || []).some(p => (p.s || []).some(s => (s.w || []).some(t => typeof t === 'string' && (t.split('|')[3] || '').trim()))));
    el.classList.toggle('has-read', hasRead);
    document.querySelector('[data-sw="read"]').parentNode.hidden = !hasRead;
    el.lang = b.gloss_lang || 'en';
    $('sheet').hidden = !chapters.length;
    $('empty').hidden = !!chapters.length;
    const pr = $('problems');
    pr.hidden = !problems.length;
    pr.innerHTML = problems.length ? `<b>${problems.length} problem${problems.length > 1 ? 's' : ''} in these files.</b> The book is shown anyway; ask Claude to fix the files.<ul>${problems.slice(0, 200).map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : '';
    $('files').textContent = fileNames.length ? fileNames.join(', ') : '';
    applySwitches();
    document.title = (b.orig_title || b.title || 'Rubric Reader') + ' · Rubric';
  }

  // merge one parsed file into the book: a chapter seen before gets these paragraphs appended
  function addData(d, name) {
    if (Array.isArray(d)) d = { chapters: d };
    if (d && d.chapters == null && d.paras) d = { chapters: [d] };
    if (!d || typeof d !== 'object') { problems.push(`${name}: not a Rubric file`); return; }
    if (d.book) book = Object.assign({}, d.book, book);
    (d.chapters || []).forEach(ch => {
      const have = chapters.find(c => +c.n === +ch.n);
      if (have) have.paras = (have.paras || []).concat(ch.paras || []);
      else chapters.push(JSON.parse(JSON.stringify(ch)));
    });
    fileNames.push(name);
  }

  function reset() { book = {}; chapters = []; fileNames = []; }

  async function openFiles(list) {
    const files = [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    reset();
    const bad = [];
    for (const f of files) {
      try { addData(JSON.parse(await f.text()), f.name); }
      catch (e) { bad.push(`${f.name}: not valid JSON (${e.message})`); }
    }
    render();
    if (bad.length) { problems = bad.concat(problems); $('problems').hidden = false; $('problems').innerHTML = `<b>Some files could not be read.</b><ul>${problems.map(p => `<li>${esc(p)}</li>`).join('')}</ul>`; }
    $('example').value = '';
  }

  async function loadExample(which) {
    const nums = which === 'all' ? [...Array(EXAMPLE.chapters)].map((_, i) => i + 1) : [+which];
    if (+which !== 1) nums.unshift(1);   // chapter 1 carries the book's details
    reset();
    $('files').textContent = 'Loading…';
    const got = await Promise.all([...new Set(nums)].map(n =>
      fetch(`${EXAMPLE.dir}ch${String(n).padStart(2, '0')}.json`).then(r => r.ok ? r.json() : null).catch(() => null)));
    got.forEach((d, i) => {
      if (!d) return;
      if (which !== 'all' && +which !== 1 && i === 0) { book = d.book || {}; return; }
      addData(d, `ch${String([...new Set(nums)][i]).padStart(2, '0')}.json`);
    });
    fileNames = [EXAMPLE.name + (which === 'all' ? ', whole book' : `, chapter ${which}`)];
    render();
    window.scrollTo(0, 0);
  }

  function applySwitches() {
    const el = $('book');
    document.querySelectorAll('[data-sw]').forEach(c => el.classList.toggle('no-' + c.dataset.sw, !c.checked));
    el.classList.remove('compact', 'big');
    if ($('size').value) el.classList.add($('size').value);
  }

  // UI
  const ex = $('example');
  for (let i = 1; i <= EXAMPLE.chapters; i++) ex.add(new Option(`Wizard of Oz (Hebrew): chapter ${i}`, String(i)));
  ex.add(new Option('Wizard of Oz (Hebrew): whole book (slow to print)', 'all'));
  ex.onchange = () => { if (ex.value) loadExample(ex.value); };
  $('openBtn').onclick = () => $('fileIn').click();
  $('drop').onclick = () => $('fileIn').click();
  $('fileIn').onchange = e => { if (e.target.files.length) openFiles(e.target.files); e.target.value = ''; };
  document.querySelectorAll('[data-sw]').forEach(c => c.onchange = applySwitches);
  $('size').onchange = applySwitches;
  $('paper').onchange = pageCss;
  $('printBtn').onclick = () => window.print();
  ['dragover', 'dragenter'].forEach(t => document.addEventListener(t, e => { e.preventDefault(); $('drop').classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => document.addEventListener(t, e => { e.preventDefault(); $('drop').classList.remove('over'); }));
  document.addEventListener('drop', e => { if (e.dataTransfer.files.length) openFiles(e.dataTransfer.files); });

  const q = new URLSearchParams(location.search);
  if (q.has('example') || q.has('demo')) { const c = q.get('ch') || '1'; ex.value = c; loadExample(c); }
})();
