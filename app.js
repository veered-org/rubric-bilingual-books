// Rubric book maker: pick a free text, choose languages and level, and build the
// instructions (and STYLE.md brief) that Claude follows to make the edition.
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const KIT_GIT = 'https://github.com/veered-org/rubric-bilingual-books';
  const KIT_ZIP = 'https://veered.org/bilingual-book-maker/rubric-bilingual-books.zip';
  const READER = 'https://veered.org/bilingual-book-maker/app/reader.html';
  // claude:// links open Claude Desktop with the prompt filled in (not sent).
  // Its q= cuts off past about 14,000 characters, so a longer prompt gets no link.
  const LINK_CAP = 14000;

  const LANGS = [
    ['he', 'Hebrew'], ['ar', 'Arabic'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'], ['it', 'Italian'],
    ['pt', 'Portuguese'], ['ru', 'Russian'], ['uk', 'Ukrainian'], ['pl', 'Polish'], ['nl', 'Dutch'], ['sv', 'Swedish'],
    ['el', 'Greek'], ['tr', 'Turkish'], ['ja', 'Japanese'], ['zh', 'Chinese (simplified)'], ['zh-tw', 'Chinese (traditional)'],
    ['ko', 'Korean'], ['hi', 'Hindi'], ['fa', 'Persian'], ['yi', 'Yiddish'], ['la', 'Latin'], ['vi', 'Vietnamese'],
    ['id', 'Indonesian'], ['sw', 'Swahili'], ['en', 'English'],
  ];
  const NAME = Object.fromEntries(LANGS);
  const an = w => (/^[AEIOU]/.test(w) ? 'an ' : 'a ') + w;
  const NONLATIN = ['he', 'ar', 'ru', 'uk', 'el', 'ja', 'zh', 'zh-tw', 'ko', 'hi', 'fa', 'yi'];

  // per-language grammar recipe: what the tags carry, what "!" underlines, and optional marks
  const PROFILE = {
    he: { tags: "verbs: binyan and root, e.g. pa'al · ה־ל־ך, hif'il · ג־י־ע, nif'al ptc · ר־א־ה (not needed for הָיָה / יֵשׁ / אֵין)",
          bang: "words that are passive in meaning: pu'al and hof'al forms, pa'ul participles (סָגוּר), and nif'al when it means \"was …ed\" (an active nif'al like נִכְנַס gets no !)",
          marks: { id: 'niqqud', label: 'Full vowel points (niqqud) on every word', on: true,
                   rule: 'Full niqqud on every Hebrew word, in standard pointed spelling (מְאֹד, כֻּלָּם, פִּתְאֹם). Get dagesh, shva and the vowels of prefixes (בַּ/לַ/וּ/כְּשֶׁ) right, and double-check every word.' },
          extra: 'Write dialogue with a dash, as in Hebrew print: start a speech with the token "–", no quotation marks. In modern style, avoid biblical forms (no vav-consecutive, no suffix-object verbs like הִטְרִידוּנִי) and write possessives mostly with שֶׁל.' },
    yi: { tags: 'verbs: tense and person; nouns: gender (m./f./n.)', bang: 'the perfect tense (the hobn/zayn helper and the participle)',
          marks: { id: 'yivo', label: 'Standard YIVO spelling with vowel points on alefs', on: true, rule: 'Use standard YIVO spelling, with pasekh and komets alef and the other pointed letters marked.' } },
    ar: { tags: 'verbs: form (I–X) and root, e.g. Form II · ع-ل-م; nouns: case where it matters', bang: 'passive (majhūl) verbs and passive participles',
          marks: { id: 'tashkil', label: 'Full vowel marks (tashkīl) on every word', on: true, rule: 'Full tashkīl (fatḥa, ḍamma, kasra, sukūn, shadda, tanwīn) on every word, carefully and correctly.' },
          extra: 'Use Modern Standard Arabic.' },
    fa: { tags: 'verbs: tense and stem (present/past stem); the ezafe', bang: 'ezafe links (show the kasra)',
          marks: { id: 'harakat', label: 'Short-vowel marks (zir, zebar, pish)', on: false, rule: 'Add the short-vowel marks (zir, zebar, pish) and the ezafe kasra on every word.' } },
    es: { tags: 'verbs: tense, mood and person, e.g. pret. 3sg, impf. 1pl, subj. pres. 3sg', bang: 'verbs in the subjunctive' },
    pt: { tags: 'verbs: tense, mood and person, e.g. pret. perf. 3sg, subj. pres. 1sg', bang: 'verbs in the subjunctive (including the future subjunctive)' },
    it: { tags: 'verbs: tense, mood and person, e.g. pass. rem. 3sg, cong. pres. 1sg', bang: 'verbs in the subjunctive (congiuntivo)' },
    fr: { tags: 'verbs: tense, mood and person, e.g. passé simple 3sg, imparfait 1pl, subj. prés. 3sg', bang: 'verbs in the subjunctive',
          extra: 'Narrate in the passé simple and imparfait as French books do, and use the passé composé in dialogue.' },
    de: { tags: 'verbs: tense and person; nouns and articles: gender and case, e.g. dat. f.', bang: 'separable verbs (gloss the verb on its stem and tag the prefix that moved to the end)' },
    nl: { tags: 'verbs: tense and person; nouns: de/het', bang: 'separable verbs (the prefix that moves to the end)' },
    sv: { tags: 'verbs: tense; nouns: en/ett and definite form', bang: 'the s-passive' },
    ru: { tags: 'verbs: aspect (pf./impf.) and tense; nouns and adjectives: case, e.g. gen. pl.', bang: 'perfective verbs',
          marks: { id: 'stress', label: 'Stress marks on every word (а́)', on: true, rule: 'Mark the stressed vowel of every word of more than one syllable with an acute accent (каре́та), and write ё with its dots.' } },
    uk: { tags: 'verbs: aspect (pf./impf.) and tense; nouns and adjectives: case', bang: 'perfective verbs',
          marks: { id: 'stress', label: 'Stress marks on every word', on: true, rule: 'Mark the stressed vowel of every word of more than one syllable with an acute accent.' } },
    pl: { tags: 'verbs: aspect (pf./impf.) and tense; nouns and adjectives: case, e.g. instr. sg.', bang: 'perfective verbs' },
    el: { tags: 'verbs: tense, aspect and voice; nouns: case', bang: 'passive (mediopassive) verbs' },
    tr: { tags: 'the suffixes, e.g. -DI past, -(y)AcAk future, -mIş reported', bang: 'the reported past -mIş' },
    ja: { tags: 'verbs and adjectives: form, e.g. te-form, past polite, potential, volitional', bang: 'passive and causative forms',
          read: { id: 'furigana', label: 'Furigana: the hiragana reading above every word with kanji', on: true, rule: 'Put the hiragana reading of every word that has kanji in the 4th token field (reading).' },
          extra: 'Split the text into words, with particles (は, が, を, に, で) as their own tokens. Use plain style in narration and natural spoken Japanese in dialogue.' },
    zh: { tags: 'aspect particles, complements and measure words, e.g. asp. 了, MW, result compl.', bang: 'resultative and directional complements',
          read: { id: 'pinyin', label: 'Pinyin with tone marks above every word', on: true, rule: 'Put the pinyin with tone marks in the 4th token field (reading) of every word.' },
          extra: 'Use simplified characters. Split into words, not single characters.' },
    'zh-tw': { tags: 'aspect particles, complements and measure words', bang: 'resultative and directional complements',
          read: { id: 'pinyin', label: 'Pinyin (or zhuyin) above every word', on: true, rule: 'Put the pinyin with tone marks in the 4th token field (reading) of every word.' },
          extra: 'Use traditional characters, Taiwan usage. Split into words, not single characters.' },
    ko: { tags: 'verb endings and speech level, e.g. past -었-, polite -요, connective -고', bang: 'honorific forms',
          read: { id: 'roman', label: 'Romanization above every word', on: false, rule: 'Put the Revised Romanization in the 4th token field (reading) of every word.' } },
    hi: { tags: 'verbs: tense, aspect and gender; postpositions', bang: 'the ergative ने construction',
          read: { id: 'roman', label: 'Romanized reading above every word', on: false, rule: 'Put a romanized reading in the 4th token field (reading) of every word.' } },
    la: { tags: 'verbs: tense, mood, voice and person; nouns and adjectives: case and number, e.g. abl. sg.', bang: 'verbs in the subjunctive',
          marks: { id: 'macrons', label: 'Long vowels marked with macrons (ā)', on: true, rule: 'Mark every long vowel with a macron (puellā, rēx).' } },
    en: { tags: 'verbs: tense and aspect, e.g. past perf., pres. cont.; phrasal verbs', bang: 'phrasal verbs (keep verb and particle as one token when they belong together)' },
  };
  const DEFAULT_PROFILE = { tags: 'verbs: tense and person; nouns: case where the language has cases',
    bang: 'the one grammar point that matters most for a reader at this level (say which in the book\'s "key")' };

  const LEVEL = {
    A1: 'a beginner who knows a few hundred common words. Use short sentences and the most common words, gloss every word, and keep notes very simple.',
    A2: 'someone who knows the everyday basics and reads simple sentences. Prefer common words, split long sentences, and explain each new grammar point the first time it appears.',
    B1: 'someone who follows everyday and simple literary sentences, partly by guessing from context. Write natural language and give the less common words and forms a note.',
    B2: 'someone who reads most prose with some help. Write natural, idiomatic language; notes focus on idioms, register and nuance.',
    C1: 'an advanced reader. Keep the full richness of the language; note only rare words, register, idioms and allusions.',
  };
  const REGISTER = {
    modern: 'natural, modern everyday LANG, the kind a good contemporary translation uses. Avoid archaic or bookish forms.',
    faithful: 'correct standard LANG that keeps the tone and period flavor of the original.',
    simple: 'LANG simplified to suit the reader\'s level: common words and short sentences, but every event and idea of the original kept.',
  };

  const PICKS = [
    [55, 'The Wonderful Wizard of Oz', 'L. Frank Baum'], [11, "Alice's Adventures in Wonderland", 'Lewis Carroll'], [16, 'Peter Pan', 'J. M. Barrie'],
    [236, 'The Jungle Book', 'Rudyard Kipling'], [500, 'The Adventures of Pinocchio', 'Carlo Collodi'], [19994, 'The Aesop for Children', 'Aesop'],
    [11757, 'The Velveteen Rabbit', 'Margery Williams Bianco'], [2591, "Grimms' Fairy Tales", 'Jacob and Wilhelm Grimm'],
    [1661, 'The Adventures of Sherlock Holmes', 'Arthur Conan Doyle'], [120, 'Treasure Island', 'Robert Louis Stevenson'],
    [1342, 'Pride and Prejudice', 'Jane Austen'],
  ];
  const SITES = [
    ['Project Gutenberg', 'https://www.gutenberg.org/', '75,000 public-domain books, mostly English, plus French, German, Spanish and more. Plain text, easy for Claude to read.'],
    ['Wikipedia', 'https://www.wikipedia.org/', 'Articles on any subject in 300 languages (CC BY-SA: credit it and keep the same license). Each section becomes a chapter.'],
    ['Wikisource', 'https://wikisource.org/', 'Public-domain texts in their original languages: poems, stories, speeches, historical documents.'],
    ['Standard Ebooks', 'https://standardebooks.org/', 'Carefully proofread public-domain classics in English, with modernized spelling.'],
    ['Project Ben-Yehuda', 'https://benyehuda.org/', 'Hebrew literature that is free to use: Agnon, Bialik, Rachel, and many more.'],
    ['Simple English Wikipedia', 'https://simple.wikipedia.org/', 'Wikipedia articles in easier English, good for short readers at lower levels.'],
  ];

  let book = null;
  // fetch with a time limit, so a slow lookup falls back instead of hanging
  const fetchT = (u, ms = 9000) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return fetch(u, { signal: c.signal }); };

  // ---- step 1: choosing the text ----
  function tabs(groupId, onChange) {
    const g = $(groupId), card = g.closest('.card');
    g.querySelectorAll('button').forEach(b => b.onclick = () => {
      g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      card.querySelectorAll('[data-pane]').forEach(p => p.hidden = p.dataset.pane !== b.dataset.tab);
      if (onChange) onChange(b.dataset.tab);
    });
  }
  const msgEl = () => tabOn('srcTabs') === 'search' ? $('searchMsg') : $('linkMsg');
  const tabOn = groupId => $(groupId).querySelector('button.on').dataset.tab;

  // Project Gutenberg's catalogue, most downloaded first (built by tools/build_catalog.py):
  // id, title, author, languages, author's death year, downloads. Loaded on first use.
  let CAT = null, catLoading = null;
  const fold = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  function catalog() {
    if (CAT) return Promise.resolve(CAT);
    return catLoading || (catLoading = fetchT('catalog.tsv', 60000).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }).then(t => {
      CAT = t.split('\n').filter(Boolean).map(l => {
        const [id, title, author, langs, died, dl] = l.split('\t');
        return { id: +id, title, author, langs: langs.split(','), died: +died || 0, dl: +dl || 0, key: fold(title + ' ' + author) };
      });
      return CAT;
    }).catch(e => { catLoading = null; throw e; }));
  }

  function fromCatalog(b) {
    const recent = b.died && b.died > new Date().getFullYear() - 71;
    return { kind: 'gutenberg', id: b.id, title: b.title, author: b.author, died: b.died, lang: b.langs[0] || 'en',
      url: `https://www.gutenberg.org/ebooks/${b.id}`, textUrl: `https://www.gutenberg.org/ebooks/${b.id}.txt.utf-8`,
      license: recent ? 'pd-recent' : 'pd' };
  }

  async function search(q, lang) {
    $('searchMsg').className = 'msg'; $('results').innerHTML = '';
    if (!CAT) $('searchMsg').textContent = 'Loading the catalogue (once, about 3 MB)…';
    let cat;
    try { cat = await catalog(); }
    catch (e) {
      $('searchMsg').className = 'msg bad';
      $('searchMsg').innerHTML = 'The catalogue didn\'t load. Search on <a href="https://www.gutenberg.org/ebooks/search/?query=' + encodeURIComponent(q) + '" target="_blank" rel="noopener">gutenberg.org</a> instead and paste the book\'s link.';
      return;
    }
    const words = fold(q).split(' ').filter(Boolean), fq = fold(q);
    const hits = cat.filter(b => (!lang || b.langs.includes(lang)) && words.every(w => b.key.includes(w)));
    // the catalogue is already in download order; titles that start with the query come first
    const top = hits.filter(b => fold(b.title).startsWith(fq)).concat(hits.filter(b => !fold(b.title).startsWith(fq))).slice(0, 25);
    $('searchMsg').textContent = top.length ? `${hits.length.toLocaleString()} found${hits.length > top.length ? '; the most read are shown' : ''}. Click one to choose it.` : 'Nothing found. Try fewer words, or the author\'s last name.';
    $('results').innerHTML = top.map((b, i) => `<button class="res" data-i="${i}"><span><span class="t">${esc(b.title)}</span><br><span class="a">${esc(b.author)}${b.author ? ' · ' : ''}${esc(b.langs.map(l => NAME[l] || l).join(', '))}</span></span><span class="m">#${b.id}<br>${b.dl ? '~' + b.dl.toLocaleString() + ' downloads' : ''}</span></button>`).join('');
    $('results').querySelectorAll('.res').forEach(el => el.onclick = () => choose(fromCatalog(top[+el.dataset.i])));
  }

  // a quick pick or a pasted link: the catalogue fills in the details
  async function gutenbergById(id, msg) {
    msg.className = 'msg'; msg.textContent = CAT ? '' : 'Looking up the book…';
    let b = null;
    try { b = (await catalog()).find(x => x.id === id); } catch (e) {}
    if (b) choose(fromCatalog(b));
    else {
      const pk = PICKS.find(p => p[0] === id);
      choose({ kind: 'gutenberg', id, title: pk ? pk[1] : `Project Gutenberg book #${id}`, author: pk ? pk[2] : '', lang: 'en', url: `https://www.gutenberg.org/ebooks/${id}`,
        textUrl: `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`, license: 'pd' });
    }
    msg.textContent = '';
  }

  async function wikipedia(u) {
    const lang = u.hostname.split('.')[0];
    const title = decodeURIComponent(u.pathname.replace(/^\/wiki\//, '')).replace(/_/g, ' ');
    const api = `https://${u.hostname}/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=wiki&redirects=1&format=json&origin=*&titles=${encodeURIComponent(title)}`;
    const b = { kind: 'wikipedia', title, author: 'Wikipedia contributors', lang: lang === 'simple' ? 'en' : lang, url: u.href.split('#')[0], license: 'ccbysa',
      textUrl: api.replace('&origin=*', '') };
    msgEl().className = 'msg'; msgEl().textContent = 'Reading the article…';
    try {
      const d = await (await fetchT(api)).json();
      const pg = Object.values(d.query.pages)[0];
      if (pg.missing !== undefined) throw new Error('missing');
      b.title = pg.title;
      const text = pg.extract || '';
      const skip = /^(See also|References|Notes|Further reading|External links|Bibliography|Sources|Citations|Footnotes)$/i;
      const secs = text.split(/\n==\s*([^=].*?)\s*==\n/);
      let words = (secs[0].match(/\S+/g) || []).length, n = 1;
      for (let i = 1; i < secs.length; i += 2) if (!skip.test(secs[i])) { n++; words += ((secs[i + 1] || '').match(/\S+/g) || []).length; }
      b.words = words; b.sections = n;
      msgEl().textContent = '';
    } catch (e) { msgEl().textContent = 'Couldn\'t read the article from here, but Claude can. Check the link works in a new tab.'; }
    choose(b);
  }

  function useLink(raw) {
    let u;
    try { u = new URL(raw.trim().match(/^https?:/) ? raw.trim() : 'https://' + raw.trim()); }
    catch (e) { $('linkMsg').className = 'msg bad'; $('linkMsg').textContent = 'That doesn\'t look like a link.'; return; }
    const host = u.hostname.replace(/^www\.|^m\./, '');
    const g = (u.pathname + u.search).match(/(?:ebooks|epub|files|cache\/epub)\/(\d+)/);
    if (/gutenberg\.org$/.test(host) && g) return gutenbergById(+g[1], $('linkMsg'));
    if (/\.wikipedia\.org$/.test(u.hostname) && u.pathname.startsWith('/wiki/')) return wikipedia(u);
    const nice = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || host).replace(/[_-]+/g, ' ');
    if (/wikisource\.org$/.test(host))
      return choose({ kind: 'wikisource', title: nice, author: '', lang: u.hostname.split('.')[0], url: u.href, license: 'pd-check' });
    if (/standardebooks\.org$/.test(host)) {
      const p = u.pathname.split('/').filter(Boolean);
      return choose({ kind: 'standard', title: (p[2] || nice).replace(/-/g, ' '), author: (p[1] || '').replace(/-/g, ' '), lang: 'en',
        url: `https://standardebooks.org/${p.slice(0, 3).join('/')}`, textUrl: `https://standardebooks.org/${p.slice(0, 3).join('/')}/text/single-page`, license: 'pd' });
    }
    if (/benyehuda\.org$/.test(host))
      return choose({ kind: 'benyehuda', title: 'Project Ben-Yehuda text', author: '', lang: 'he', url: u.href, license: 'pd-check' });
    choose({ kind: 'other', title: nice, author: '', lang: '', url: u.href, license: 'unknown' });
  }

  const LIC = {
    pd: ['ok', 'Public domain in the United States. If you live elsewhere, check that the author died long enough ago for your country.'],
    'pd-recent': ['warn', 'Public domain in the United States, but the author died less than 70 years ago, so it may still be under copyright where you live. Check before you start.'],
    'pd-check': ['ok', 'Usually public domain, but check the page: some texts there are newer or have their own license.'],
    ccbysa: ['ok', 'Wikipedia: CC BY-SA 4.0. The edition will credit the article and carry the same license.'],
    copyright: ['warn', 'Project Gutenberg marks this one as possibly under copyright. Please choose a public-domain book.'],
    unknown: ['warn', 'Make sure this text is free to translate (public domain or an open license) before you start.'],
  };

  function choose(b) {
    book = b;
    const [cls, txt] = LIC[b.license] || LIC.unknown;
    const meta = b.kind === 'wikipedia' && b.words ? ` · about ${b.words.toLocaleString()} words in ${b.sections} section${b.sections > 1 ? 's' : ''}` : '';
    $('picked').hidden = false;
    $('picked').innerHTML = `<div class="t" contenteditable="true" spellcheck="false" id="pkTitle" title="Click to correct the title">${esc(b.title)}</div>` +
      `<div class="a">${esc(b.author || '')}${b.author ? ' · ' : ''}${esc(NAME[b.lang] || b.lang || 'language not known yet')}${meta} · <a href="${esc(b.url)}" target="_blank" rel="noopener">open the source</a></div>` +
      `<div class="lic ${cls}">${esc(txt)}</div>`;
    $('pkTitle').oninput = () => { book.title = $('pkTitle').textContent.trim(); build(); };
    if (b.lang && $('srcLang').querySelector(`option[value="${b.lang}"]`)) $('srcLang').value = b.lang;
    else if (b.lang) { $('srcLang').add(new Option(b.lang, b.lang)); $('srcLang').value = b.lang; }
    langChanged();
  }

  // ---- step 2: languages ----
  function fillLangs() {
    const opts = LANGS.map(([c, n]) => `<option value="${c}">${esc(n)}</option>`).join('');
    $('learn').innerHTML = opts; $('mine').innerHTML = opts;
    $('srcLang').innerHTML = '<option value="">Not sure</option>' + opts;
    $('learn').value = 'he'; $('mine').value = 'en'; $('srcLang').value = 'en';
  }

  const mode = () => ($('srcLang').value && $('srcLang').value === $('learn').value) ? 'annotate' : 'translate';
  const prof = () => PROFILE[$('learn').value] || DEFAULT_PROFILE;

  function langChanged() {
    const p = prof(), L = NAME[$('learn').value];
    $('modeLine').textContent = mode() === 'annotate'
      ? `The book is already in ${L}, so Claude keeps its own words and adds glosses, notes and ${an(NAME[$('mine').value])} translation of each sentence.`
      : `Claude translates the book into ${L}, sentence by sentence, with the original text kept under each paragraph.`;
    $('register').closest('.row').hidden = mode() === 'annotate';
    $('tagHint').textContent = `For ${L}: ${p.tags}. Underlined: ${p.bang.replace(/\s*\(.*$/, '')}.`;
    let html = '';
    for (const o of [p.marks, p.read || (NONLATIN.includes($('learn').value) && !p.marks ? { id: 'roman', label: 'Pronunciation above every word', on: false, rule: 'Put a romanized reading in the 4th token field (reading) of every word.' } : null)].filter(Boolean))
      html += `<label class="ck"><input type="checkbox" data-opt="${o.id}" ${o.on ? 'checked' : ''}><span>${esc(o.label)}</span></label>`;
    $('langOpts').innerHTML = html;
    $('langOpts').querySelectorAll('input').forEach(i => i.onchange = build);
    build();
  }

  function optRules() {
    const p = prof(), out = [];
    $('langOpts').querySelectorAll('input:checked').forEach(i => {
      const o = [p.marks, p.read].find(x => x && x.id === i.dataset.opt) || { rule: 'Put a romanized reading in the 4th token field (reading) of every word.' };
      out.push(o.rule);
    });
    return out;
  }

  // ---- step 3: the brief and the prompts ----
  const slug = s => String(s || 'book').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'book';

  function credit() {
    const b = book, L = NAME[$('learn').value];
    if (b.kind === 'wikipedia') return `Text adapted from the Wikipedia article “${b.title}” (${b.url}) by its contributors, CC BY-SA 4.0. This ${L} edition is also CC BY-SA 4.0.`;
    return `Original text: ${b.author || 'the author'}, <i>${b.title}</i>, public domain. ${L} ${mode() === 'annotate' ? 'glosses and notes' : 'translation, glosses and notes'} made with Claude for this edition.`;
  }

  function sourceHowTo() {
    const b = book;
    switch (b.kind) {
      case 'gutenberg': return `Plain text: ${b.textUrl}\nRemove the Project Gutenberg header and footer (everything before "*** START OF" and after "*** END OF"), the table of contents and any transcriber's notes. Don't mention Project Gutenberg in the edition itself.`;
      case 'wikipedia': return `Plain text, from the Wikipedia API: ${b.textUrl}\nThe introduction is chapter 1 ("Introduction" or its equivalent); each top-level "== Section ==" after it is a chapter, with its subsections included. Leave out See also, References, Notes, Further reading and External links.`;
      case 'standard': return `The whole book on one page: ${b.textUrl}\nUse the chapters as they are there; leave out the imprint, colophon and uncopyright pages.`;
      case 'wikisource': return `Read the text at ${b.url}. If it is split over several pages, each page (or each chapter heading) is a chapter. Leave out headers, navigation and editor's notes.`;
      case 'benyehuda': return `Read the text at ${b.url} (the site also offers a download). Each chapter or numbered part is a chapter; a short story is one chapter.`;
      default: return `Read the text at ${b.url}. Use the chapters or sections the text already has; a short piece is one chapter. Leave out navigation, ads and comments.`;
    }
  }

  function brief() {
    const b = book, L = NAME[$('learn').value], M = NAME[$('mine').value], p = prof(), lvl = $('level').value, md = mode();
    const lines = [];
    lines.push(`# ${b.title}: ${an(L)} edition for ${M} speakers`, '');
    lines.push('Made with Rubric (https://veered.org/bilingual-book-maker/). The data format is in FORMAT.md.', '');
    lines.push('## The reader');
    lines.push(`An adult whose own language is ${M}, learning ${L} at about ${lvl}: ${LEVEL[lvl]} They print these pages and read them on paper.`);
    if ($('extra').value.trim()) lines.push('', 'In their own words: ' + $('extra').value.trim());
    lines.push('', '## The text');
    lines.push(`${b.title}${b.author ? ' by ' + b.author : ''}. Source: ${b.url}`);
    lines.push(sourceHowTo());
    lines.push('', md === 'translate' ? '## Translation rules' : '## Annotation rules');
    if (md === 'translate') {
      lines.push(`- Mode "translate". Translate into ${REGISTER[$('register').value].replace(/LANG/g, L)}`);
      lines.push('- Stay faithful to the meaning, sentence by sentence, and drop nothing. Splitting a long original sentence into two or three is encouraged.');
      lines.push('- `line` holds the exact original text each sentence translates, copied verbatim with its punctuation and curly quotes, as FORMAT.md describes.');
    } else {
      lines.push(`- Mode "annotate". Keep the original ${L} words and their order exactly: don't modernize or correct them.`);
      lines.push(`- \`line\` holds a natural ${M} translation of that sentence.`);
    }
    for (const r of optRules()) lines.push('- ' + r);
    if (p.extra) lines.push('- ' + p.extra);
    lines.push(`- Keep names and recurring terms the same everywhere: use the list under "Fixed names" below, and add to it when a new one appears.`);
    lines.push('', '## Glosses and tags');
    lines.push(`- Gloss every word in ${M}: a short literal meaning in context, 1–4 words.`);
    if ($('optTags').checked) {
      lines.push(`- Tags: ${p.tags}.`);
      lines.push(`- Start the tag with \`!\` (the word is printed underlined) for ${p.bang}.`);
    } else lines.push('- No grammar tags, except `!` and `~` where they apply: leave the tag field empty otherwise.', `- \`!\` marks ${p.bang}.`);
    lines.push('- Start the tag with `~` for an idiom or fixed phrase and keep the whole phrase as one token, e.g. `"…|to get straight to the point|~idiom"`.');
    lines.push(`- Write a book "key" (one or two sentences in ${M}) that explains these marks to the reader.`);
    lines.push('', '## Notes');
    if ($('optNotes').checked) {
      lines.push(`- Add a note in ${M} on roughly one sentence in three, and make each one worth reading: idioms and set phrases still used today, grammar the reader is likely to stumble on at ${lvl}, words that look alike, everyday modern uses of a word ("you'll hear this as …"), prepositions that go with particular verbs.`);
      lines.push('- Wrap words in the language being learned in `<t>…</t>` and put the key word in `<b>…</b>`.');
      lines.push('- Notes must be accurate. Never invent etymologies; if you aren\'t sure, leave the note out. Don\'t explain the same point at length twice in a chapter.');
    } else lines.push('- No teaching notes.');
    lines.push('', '## Book details (in the first file)');
    lines.push(`- lang "${$('learn').value}", gloss_lang "${$('mine').value}", source_lang "${$('srcLang').value || '?'}", mode "${md}", source_url "${b.url}".`);
    lines.push(`- credit: "${credit()}"`);
    lines.push('', '## Fixed names', '(Claude: list the names and recurring terms here, with their fixed forms, before translating chapter 1.)', '');
    return lines.join('\n');
  }

  function chapterRange() {
    const s = $('scope').value;
    if (s === 'first') return [1, 1];
    if (s === 'range') { const a = Math.max(1, +$('from').value || 1); return [a, Math.max(a, +$('to').value || a)]; }
    return [1, 0];
  }

  function codePrompt() {
    const b = book, L = NAME[$('learn').value], [a, z] = chapterRange(), dir = '~/rubric-books/' + slug(b.title);
    const which = z === 0 ? 'the whole book' : a === z ? `chapter ${a}` : `chapters ${a} to ${z}`;
    return [
      `I'd like a bilingual reading edition of "${b.title}"${b.author ? ' by ' + b.author : ''} in ${L}, made with Rubric (https://veered.org/bilingual-book-maker/). Please make ${which}.`,
      '',
      'Steps:',
      `1. Make the folder ${dir}/ and get the Rubric kit into ${dir}/kit/: \`git clone ${KIT_GIT} kit\`, or download ${KIT_ZIP} and unzip it there.`,
      '2. Read kit/FORMAT.md, then kit/examples/wizard-of-oz/STYLE.md and the start of kit/examples/wizard-of-oz/ch01.json to see the expected quality and density (that edition is Hebrew for English speakers; mine is described below).',
      `3. Save the brief below as ${dir}/STYLE.md.`,
      `4. Get the text as the brief says and split it into ${dir}/src/ch01.txt, ch02.txt, …: each file starts with the chapter heading as its first block, then the paragraphs, one per block, separated by blank lines (join the line breaks inside a paragraph).`,
      '5. Fill in the "Fixed names" section of STYLE.md: every name and recurring term with the form you will use.',
      `6. Make ${a === z || z === 0 ? 'chapter ' + a : 'chapter ' + a} first, in ${dir}/data/ch${String(a).padStart(2, '0')}.json (the book details go in the first file). A long chapter may be split into ch${String(a).padStart(2, '0')}a.json, ch${String(a).padStart(2, '0')}b.json, … at paragraph breaks. Check it, from that folder, with \`node kit/tools/validate.js data/ch${String(a).padStart(2, '0')}*.json src/ch${String(a).padStart(2, '0')}.txt\` and fix everything until it reports 0 problems. Then reread the whole chapter for accuracy: the translation, the vowel marks or readings, agreement, the tags, the notes.`,
      `7. Show me the result: tell me to open kit/reader.html in my browser (or ${READER}) and drop the .json file on it.` + (z === a ? ' That is all for now.' : ' Then wait for my OK before going on.'),
      ...(z === a ? [] : [
        `8. After my OK, do ${z === 0 ? 'the remaining chapters' : `the rest of chapters ${a}–${z}`} the same way. You may hand each chapter to a subagent with STYLE.md, FORMAT.md and the finished first chapter as its guide, but run at most two at a time, and validate every chapter yourself before calling it done.`,
        '9. Finish with the list of files, the validator\'s last line for each chapter, and how to print: open all the .json files together in the reader and click Print / Save PDF.']),
      '',
      'Don\'t stop to ask me questions the brief already answers. If the text turns out not to be free to use, stop and tell me.',
      '',
      '----- STYLE.md -----',
      brief(),
    ].join('\n');
  }

  let FORMAT = '';
  fetch('FORMAT.md').then(r => r.ok ? r.text() : '').then(t => { FORMAT = t; build(); }).catch(() => {});

  function chatPrompt() {
    const b = book, L = NAME[$('learn').value], [a] = chapterRange(), nn = String(a).padStart(2, '0');
    return [
      `Please make one chapter of a bilingual reading edition of "${b.title}"${b.author ? ' by ' + b.author : ''} in ${L}, for the Rubric reader (https://veered.org/bilingual-book-maker/).`,
      '',
      `CHAPTER: ${a}`,
      '',
      `1. Get the text of chapter ${a} from the source in the brief. If you can't open the link, or it comes back cut off, tell me and I'll paste the chapter in.`,
      '2. Follow the brief and the data format below exactly.',
      `3. Give me the result as a downloadable file named ch${nn}.json${a === 1 ? ' (with the "book" details in it)' : ''}. If the chapter is long, do about 400 words of the original at a time and name the parts ch${nn}a.json, ch${nn}b.json, …; I'll say "continue".`,
      '4. Before you finish, check every paragraph: in translate mode the "line" pieces of each paragraph, joined with spaces, must give back the original paragraph word for word.',
      '5. At the end, give me the "Fixed names" list (names and recurring terms and the forms you used) so I can paste it into the next chapter\'s chat.',
      '',
      'Names from earlier chapters (if any):',
      '(paste here)',
      '',
      '----- THE BRIEF -----',
      brief(),
      '----- THE DATA FORMAT -----',
      FORMAT || `(see ${KIT_GIT}/blob/main/FORMAT.md)`,
    ].join('\n');
  }

  function build() {
    const ok = !!book;
    $('needBook').hidden = ok;
    ['copyBtn', 'dlStyle'].forEach(id => $(id).disabled = !ok);
    const code = tabOn('outTabs') === 'code';
    $('openClaude').hidden = code;
    $('openApp').textContent = code ? 'Open in Claude Code \u2197' : 'Open in the Claude app \u2197';
    $('appNote').hidden = code;
    if (!ok) { $('prompt').value = ''; $('openApp').hidden = true; return; }
    const p = $('prompt').value = code ? codePrompt() : chatPrompt();
    $('openApp').hidden = p.length > LINK_CAP;
    $('openApp').href = (code ? 'claude://code/new?q=' : 'claude://claude.ai/new?q=') + encodeURIComponent(p);
  }

  // ---- wiring ----
  fillLangs();
  tabs('srcTabs');
  tabs('outTabs', build);
  $('chips').innerHTML = PICKS.map(([id, t]) => `<button class="chip" data-id="${id}">${esc(t)}</button>`).join('') +
    '<button class="chip" data-wiki="https://en.wikipedia.org/wiki/Moon">Wikipedia: the Moon</button>';
  $('chips').querySelectorAll('.chip').forEach(c => c.onclick = () => c.dataset.wiki ? useLink(c.dataset.wiki) : gutenbergById(+c.dataset.id, $('searchMsg')));
  $('sites').innerHTML = SITES.map(([n, u, d]) => `<div class="site"><b><a href="${u}" target="_blank" rel="noopener">${esc(n)}</a></b><span>${esc(d)}</span></div>`).join('');
  $('q').addEventListener('focus', () => catalog().catch(() => {}), { once: true });
  $('searchForm').onsubmit = e => { e.preventDefault(); if ($('q').value.trim()) search($('q').value.trim(), $('qlang').value); };
  $('linkForm').onsubmit = e => { e.preventDefault(); if ($('link').value.trim()) useLink($('link').value); };
  ['learn', 'mine', 'srcLang'].forEach(id => $(id).onchange = langChanged);
  ['level', 'register', 'optTags', 'optNotes', 'from', 'to'].forEach(id => $(id).onchange = build);
  $('extra').oninput = build;
  $('scope').onchange = () => { $('rangeBox').hidden = $('scope').value !== 'range'; build(); };
  async function copyPrompt(msg) {
    try { await navigator.clipboard.writeText($('prompt').value); }
    catch (e) { $('prompt').select(); document.execCommand('copy'); }
    $('copyMsg').className = 'msg ok'; $('copyMsg').textContent = msg;
    setTimeout(() => $('copyMsg').textContent = '', 6000);
  }
  $('copyBtn').onclick = () => copyPrompt('Copied. Paste it into ' + (tabOn('outTabs') === 'code' ? 'Claude Code.' : 'a new Claude chat.'));
  // the link still opens claude.ai in a new tab; the copy rides on the same click
  $('openClaude').onclick = () => { if (book) copyPrompt('Copied. Paste it into the new chat (Ctrl+V, or \u2318V on a Mac).'); };
  $('dlStyle').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([brief()], { type: 'text/markdown' }));
    a.download = 'STYLE.md'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('useOz').onclick = () => {
    $('learn').value = 'he'; $('mine').value = 'en'; $('level').value = 'B1'; $('register').value = 'modern';
    $('optTags').checked = $('optNotes').checked = true; $('scope').value = 'first'; $('rangeBox').hidden = true;
    choose({ kind: 'gutenberg', id: 55, title: 'The Wonderful Wizard of Oz', author: 'L. Frank Baum', lang: 'en',
      url: 'https://www.gutenberg.org/ebooks/55', textUrl: 'https://www.gutenberg.org/ebooks/55.txt.utf-8', license: 'pd' });
    $('step1').scrollIntoView({ behavior: 'smooth' });
  };
  langChanged();
})();
