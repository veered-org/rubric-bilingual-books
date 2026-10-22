#!/usr/bin/env python3
"""Make catalog.tsv, the book maker's offline search list, from Project Gutenberg's
catalogue (https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv.gz).

usage: python3 tools/build_catalog.py pg_catalog.csv.gz downloads.tsv > catalog.tsv
Each line: id, title, author, language(s), author's death year, downloads.
downloads.tsv ("id<TAB>count" lines) comes from the <pgterms:downloads> of each
book in https://www.gutenberg.org/cache/epub/feeds/rdf-files.tar.bz2. The lines
are written most-downloaded first, which is the order the search shows them in."""
import csv, gzip, re, sys

def person(a):
    # "Baum, L. Frank (Lyman Frank), 1856-1919 [Illustrator]" -> ("L. Frank Baum", 1919)
    a = re.sub(r"\s*\[[^\]]*\]", "", a).strip()
    m = re.search(r",\s*(?:BCE?\s*)?\??(\d{0,4})\??\s*(?:BCE)?\s*-\s*\??(\d{1,4})?\??\s*(?:BCE)?$", a)
    died = int(m.group(2)) if m and m.group(2) else ""
    if m: a = a[:m.start()]
    a = re.sub(r"\s*\([^)]*\)", "", a).strip()
    p = [x.strip() for x in a.split(",")]
    name = (p[1] + " " + p[0]) if len(p) >= 2 and p[1] else p[0]
    return name, died

src = sys.argv[1]
dl = {}
for line in open(sys.argv[2]):
    k, v = line.split("\t"); dl[k] = int(v)
raw = gzip.open(src, "rt", encoding="utf-8") if src.endswith(".gz") else open(src, encoding="utf-8")
rows = []
for r in csv.DictReader(raw):
    if r["Type"] != "Text": continue
    title = re.sub(r"\s+", " ", r["Title"].replace("\n", ": ")).strip()
    title = re.sub(r"\s*:\s*\$b", ": ", title)
    if len(title) > 110: title = title[:107].rstrip() + "…"
    authors = [a for a in r["Authors"].split("; ") if a and "[Translator]" not in a and "[Editor]" not in a and "[Illustrator]" not in a]
    name, died = person(authors[0]) if authors else ("", "")
    if len(authors) > 1: name += " and others"
    rows.append((r["Text#"], title, name, r["Language"].replace("; ", ","), died, dl.get(r["Text#"], 0)))
rows.sort(key=lambda x: -x[5])
# two significant figures are plenty for display and compress far better
rows = [r[:5] + (int(float("%.2g" % r[5])) if r[5] else 0,) for r in rows]
sys.stdout.write("".join("\t".join(str(x).replace("\t", " ") for x in row) + "\n" for row in rows))
