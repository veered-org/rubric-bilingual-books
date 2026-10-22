# Rubric data format

A Rubric book is one or more JSON files. Each file holds some chapters, and the first one also carries the book's details. The reader page (`reader.html`) opens any number of these files together and puts the chapters in order. If two files hold pieces of the same chapter (the same `n`), their paragraphs are joined in the order the files were opened, so a long chapter can be written as `ch03a.json`, `ch03b.json` and so on.

```json
{
  "book": {
    "title": "<book title in the language being learned>",
    "orig_title": "<original title>",
    "author": "<author>",
    "year": 1900,
    "lang": "<code of the language being learned, e.g. he, es, fr, de, ja>",
    "gloss_lang": "<code of the reader's own language, e.g. en>",
    "source_lang": "<code of the original text's language>",
    "mode": "translate | annotate",
    "source_url": "<where the original text came from>",
    "key": "<one or two sentences explaining the tags and marks used in this edition; may use <u> <i> <b>>",
    "credit": "<who wrote the original, its license, and who made the translation; may use <i>>"
  },
  "chapters": [
    {
      "n": 1,
      "title": "<chapter title in the language being learned>",
      "orig_title": "<original chapter title>",
      "paras": [
        { "s": [
          { "w": ["<token>", "<token>", "..."], "line": "<text shown under the paragraph>", "note": "<optional teaching note>" }
        ] }
      ]
    }
  ]
}
```

## The two modes
- **translate**: the book is in another language (usually the reader's own) and is translated into the language being learned. The tokens in `w` are the translation. `line` is the **exact original text** that this sentence translates, copied verbatim with its own punctuation and curly quotes. Joining the `line` values of one paragraph with single spaces must give back the original paragraph exactly, with nothing added or lost. If one original sentence becomes several translated ones, split the original at a comma or semicolon so each piece goes with its translation; if no split is possible, put the whole original on the first item and `"line": ""` on the rest.
- **annotate**: the book is already in the language being learned (a Hebrew story from Project Ben-Yehuda for a Hebrew learner, say). The tokens in `w` are the original words, in the original order, with vowel marks or readings added where the edition calls for them. `line` is a translation of that sentence into the reader's own language.

## Paragraphs and sentences
Each item of `paras` is one paragraph of the original. Each item of `s` is one sentence of the language being learned. Splitting a long sentence into two or three is encouraged when it reads more naturally.

## Tokens
A token is a string: `"word|gloss"`, `"word|gloss|tag"` or `"word|gloss|tag|reading"`.

- **word**: the word (or fixed phrase) in the language being learned.
- **gloss**: a short literal meaning in the reader's own language, in context, 1–4 words.
- **tag** (optional): grammar for that word, kept short (`pa'al · ה־ל־ך`, `subj. pres.`, `perf. aspect`, `dat. pl.`). Start the tag with `!` to **underline** the word: the grammar point this edition highlights (passives in Hebrew, the subjunctive in Spanish, for example; `key` says which). Start it with `~` for an idiom or fixed phrase, and keep the whole phrase as one token: `"ponerse las pilas|to get one's act together|~idiom"`.
- **reading** (optional): pronunciation shown small above the word: furigana or romaji for Japanese, pinyin for Chinese, stress marks for Russian, transliteration for any script the reader can't yet read.

Punctuation is its own bare token: `","` `"."` `"?"` `"!"` `";"` `":"` `"–"` `"«"` `"»"` `"¿"` `"¡"`. Opening marks (`– — « „ “ ¿ ¡ (`) attach to the word after them, and everything else attaches to the word before.

## Notes
`note` is a short teaching note in simple HTML. Allowed tags: `<b>`, `<i>`, `<u>`, `<br>`, and `<t>…</t>` around words in the language being learned (they get its font and direction). Notes refer to "sentence N" only within the same chapter: numbering restarts at 1 in each chapter and counts every item in every `s`. A note on roughly one sentence in three is about right. Notes must be accurate; leave a note out rather than guess.

## Checking a file
`node tools/validate.js data/ch01.json src/ch01.txt` checks the tokens and, in translate mode, that the `line` values reproduce the source exactly. The source file's first block (up to the first blank line) is the chapter heading; the paragraphs follow, separated by blank lines. The reader page also lists format problems when it opens a file.
