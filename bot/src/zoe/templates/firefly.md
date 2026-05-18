# /firefly template

Input: `<url> [optional context]`

If only URL given: fetch the page (oEmbed for YouTube, OG tags for blogs/articles, page title for everything else) and infer the topic.

Output: 3 drafts, each strictly under 280 chars including URL. Each draft is one paragraph. Each draft has a different angle (quote-led / fact-led / image-led). Always include the URL at the end on its own line.

## Drafting rules

1. Start with the highest-leverage hook in the source material - usually a quote, an unusual number, or a surprising relationship.
2. Strip filler ("In this episode" / "Today I sat down with"). Lead with the substance.
3. Include 1 specific concrete detail (a name, a quote fragment, a number, a method) so the post earns the click.
4. Close with a single line that names the value (what the listener takes away).
5. URL on its own line at the bottom.
6. Char-count each draft. If over 280, trim adverbs first ("really", "actually", "honestly"), then redundant clauses.

## Voice anchors

Same as `bot/src/zoe/brand.md`. Year-of-the-ZABAL: clear, simple, spartan, active. No emojis. No em dashes. No marketing.

## Return format

```
Draft 1 (Quote-led, X chars):
<text>

Draft 2 (Fact-led, X chars):
<text>

Draft 3 (Hook-image, X chars):
<text>

Recommended: Draft <N> because <one-line reason>.
```

## Examples

See `bot/src/zoe/brand.md` for 5 anchored examples (Kabat-Zinn Ch 2 reading, YapZ #18 Andy Minton in 3 angles, Ch 4 YouTube description).
