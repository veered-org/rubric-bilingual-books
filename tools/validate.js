#!/usr/bin/env node
// usage: node tools/validate.js <chapter.json>... <source.txt>
// Checks the tokens of every chapter in the JSON file(s) and, in translate mode,
// that the "line" values of each paragraph reproduce the source paragraphs exactly.
// In annotate mode it compares the words instead, ignoring vowel marks and spacing.
// The source file's first block is the chapter heading; paragraphs follow, separated by blank lines.
const fs = require('fs');
const args = process.argv.slice(2);
if (args.length < 1) { console.log('usage: node tools/validate.js <chapter.json>... [source.txt]'); process.exit(2); }
const srcFile = args[args.length - 1].endsWith('.txt') ? args.pop() : null;

let book = {}, paras = [];
for (const f of args) {
  let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) { console.log(`${f}: JSON PARSE ERROR ${e.message}`); process.exit(1); }
  if (d.book) book = Object.assign({}, d.book, book);
  for (const ch of d.chapters || []) paras.push(...(ch.paras || []));
}
const mode = book.mode || 'translate';
const norm = s => s.replace(/\s+/g, ' ').trim();
const bare = s => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[\s־]+/g, '').replace(/[״”“]/g, '"').replace(/[׳’‘]/g, "'");
const PUNCT = /^[.,?!;:–—…"'«»„“”‘’¿¡()\[\]·、。，！？：；「」『』-]+$/;

let errs = 0, n = 0;
const E = m => { errs++; if (errs <= 40) console.log(m); };
paras.forEach((p, i) => {
  if (!p.s || !p.s.length) return E(`para ${i + 1}: no sentences`);
  p.s.forEach(s => {
    n++;
    if (typeof s.line !== 'string') E(`s${n}: no "line"`);
    if (!Array.isArray(s.w) || !s.w.length) return E(`s${n}: no tokens`);
    s.w.forEach(t => {
      if (typeof t !== 'string') return E(`s${n}: token is not a string`);
      const k = t.split('|');
      if (k.length === 1) { if (!PUNCT.test(t)) E(`s${n}: bare token "${t}" (words need a gloss: "word|gloss")`); }
      else if (k.length > 4 || !k[0].trim() || !k[1].trim()) E(`s${n}: bad token "${t}"`);
    });
    if (s.note && /<(?!\/?(b|i|u|t|br)\b)[a-z]/i.test(s.note)) E(`s${n}: note uses a tag other than <b> <i> <u> <t> <br>`);
  });
});

if (srcFile) {
  const src = fs.readFileSync(srcFile, 'utf8').replace(/\r/g, '').split(/\n\s*\n/).slice(1).map(norm).filter(Boolean);
  paras.forEach((p, i) => {
    if (!p.s) return;
    if (mode === 'translate') {
      const got = norm(p.s.map(s => s.line || '').join(' '));
      if (src[i] !== got) E(`para ${i + 1} ORIGINAL TEXT MISMATCH\n  source: ${(src[i] || '(none)').slice(0, 300)}\n  lines:  ${got.slice(0, 300)}`);
    } else {
      const got = bare(p.s.map(s => s.w.map(t => t.split('|')[0]).join('')).join(''));
      if (bare(src[i] || '') !== got) E(`para ${i + 1} WORDS DIFFER FROM SOURCE\n  source: ${(src[i] || '(none)').slice(0, 300)}`);
    }
  });
  if (paras.length !== src.length) E(`paragraph count ${paras.length} vs source ${src.length}`);
  console.log(`${paras.length}/${src.length} paragraphs, ${n} sentences, ${errs} problems`);
} else console.log(`${paras.length} paragraphs, ${n} sentences, ${errs} problems (no source file given, so the original text was not compared)`);
process.exit(errs ? 1 : 0);
