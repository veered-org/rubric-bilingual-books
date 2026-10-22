# The Wonderful Wizard of Oz: a Hebrew edition for English speakers

This is the brief the example edition in this folder was made from (it was written before the Rubric book maker existed, so the book maker's own briefs are laid out a little differently). The data format is in ../../FORMAT.md; the edition's chapters are ch01.json to ch24.json, and src/ holds the English source text, one file per chapter.

## The reader
An adult English speaker learning Hebrew, at about upper A2 / low B1. They follow everyday and simple literary sentences, partly by guessing from context. The goal is to read **modern Israeli prose**, so the translation avoids older literary Hebrew. They print these pages and read them on paper.

## Translation rules
- Translate Baum's English into **natural, modern Israeli Hebrew**, the kind used in a good contemporary children's or YA translation. Write correct standard Hebrew, but not formal: no biblical forms (no vav-consecutive), no suffix-object verbs like הִטְרִידוּנִי (write הִטְרִידוּ אוֹתִי), and possessives mostly with שֶׁלּוֹ / שֶׁלָּהּ, except fixed forms such as אִמָּא שֶׁלָּהּ / בְּנָהּ, which are both fine.
- Stay faithful to the meaning, sentence by sentence. Don't drop content. Splitting a long English sentence into 2–3 Hebrew sentences is encouraged.
- Use dialogue dashes as in Hebrew print. Start a speech with the token "–". A tag in the middle of a speech goes: … "," , "–", "אָמְרָה" …, then "," , "–" before the speech resumes. No quotation marks.
- **Full niqqud on every Hebrew word**, carefully and correctly, in standard pointed spelling (מְאֹד, כֻּלָּם, פִּתְאֹם, גָּבֹהַּ, לִנְסֹעַ). Get dagesh, shva, and the vowels of prefixes (בַּ/לַ/וּ/כְּשֶׁ…) right. Double-check every word.

## Fixed names and terms (use exactly these)
Dorothy דּוֹרוֹתִי · Toto טוֹטוֹ · Uncle Henry הַדּוֹד הֶנְרִי · Aunt Em הַדּוֹדָה אֶם · Kansas קַנְזָס · the prairie הָעֲרָבָה · cyclone הַטּוֹרְנָדוֹ (with a note in ch. 1 that Baum says "cyclone") · cyclone cellar מַרְתֵּף הַמִּקְלָט
Munchkins הַמַּנְצְ'קִינִים · Winkies הַוִּינְקִים · Quadlings הַקְוָדְלִינְגִים · Gillikins הַגִּילִיקִינִים
Witch מְכַשֵּׁפָה · Good Witch of the North הַמְּכַשֵּׁפָה הַטּוֹבָה מֵהַצָּפוֹן · Wicked Witch of the East / West הַמְּכַשֵּׁפָה הָרָעָה מֵהַמִּזְרָח / מֵהַמַּעֲרָב · Glinda גְּלִינְדָה · Wizard קוֹסֵם (Oz the Great and Terrible אוֹז הַגָּדוֹל וְהַנּוֹרָא) · Oz אוֹז · the Land of Oz אֶרֶץ אוֹז
Scarecrow הַדַּחְלִיל · Tin Woodman אִישׁ הַפַּח (first introduction: חוֹטֵב הָעֵצִים מִפַּח) · Cowardly Lion הָאַרְיֵה הַפַּחְדָּן
Emerald City עִיר הָאִזְמָרַגְד · emeralds אִזְמָרַגְדִּים · silver shoes נַעֲלֵי הַכֶּסֶף · yellow brick road הַדֶּרֶךְ הָעֲשׂוּיָה לְבֵנִים צְהֻבּוֹת (short: דֶּרֶךְ הַלְּבֵנִים הַצְּהֻבּוֹת) · Guardian of the Gates שׁוֹמֵר הַשְּׁעָרִים · green spectacles מִשְׁקָפַיִם יְרֻקִּים
Kalidahs הַקָּלִידוֹת · poppies פְּרָגִים · Queen of the Field Mice מַלְכַּת עַכְבְּרֵי הַשָּׂדֶה · Winged Monkeys הַקּוֹפִים הַמְּכֻנָּפִים · Golden Cap כּוֹבַע הַזָּהָב · humbug רַמַּאי · balloon כַּדּוּר פּוֹרֵחַ · Hammer-Heads רָאשֵׁי הַפַּטִּישׁ · China Country אֶרֶץ הַחַרְסִינָה · Fighting Trees הָעֵצִים הַלּוֹחֲמִים · stork חֲסִידָה · Soldier with the Green Whiskers הַחַיָּל עִם הַזָּקָן הַיָּרֹק

## Glosses and tags
- Gloss every word in English: a short literal meaning in context, 1–4 words.
- Tag every verb (finite, participle, infinitive) with `binyan · root`, e.g. `pa'al · ה־ל־ך`, `hif'il · ג־י־ע`, `nif'al ptc · ר־א־ה`, `hitpa'el · ל־ב־שׁ`. Not needed for הָיָה / יֵשׁ / אֵין.
- Prefix the tag with `!` for forms that are **passive in meaning** (pu'al and hof'al forms, pa'ul participles like סָגוּר or קָשׁוּר, and nif'al when it means "was …ed"). These words are printed underlined. Nif'al with an active meaning (נִשְׁאַר, נִכְנַס, נִרְאֶה = looks) gets no `!`.
- Prefix with `~` for idioms or fixed phrases, and keep the whole phrase as one token: `"לָגֶשֶׁת יָשָׁר לָעִנְיָן|to get straight to the point|~idiom"`, `"הָיוּ לוֹ|he had|~lit. there were to him"`.
- Wrap Hebrew inside notes in `<t>…</t>` and put the key word in `<b>…</b>`.

## Notes: what to teach
Add a note on roughly one sentence in three, and make each note worth reading:
- Passives and binyanim, especially pu'al and nif'al, and the binyan pairs (hif'il/hof'al, pi'el/pu'al, pa'al/nif'al).
- Idioms and set phrases still used today (נִמְאַס לִי, אֵין בְּרֵרָה, לֹא הָיָה לָהּ מוּשָׂג, …).
- Higher-register or news vocabulary when it comes up.
- Words that are spelled the same without vowels.
- Everyday modern uses of the word ("you'll hear this as …").
- Prepositions governed by verbs (הִבִּיט בְּ־, נָגַע בְּ־, פָּחַד מִ־).

Notes must be accurate. Never invent etymologies. If you're not sure, leave it out.
