# Doc 738: Clipboard Skill Copy UX Patterns

**Topic:** dev-workflows  
**Type:** research  
**Status:** shipped  
**Last Validated:** 2026-05-24  
**Tier:** STANDARD  
**Related Docs:** 459 (workspace worktrees), 154 (skills reference)  
**Original Query:** "/autoresearch this skill and look online for any best practices like this"

---

## Goal

Identify 3 actionable copy-button UX improvements for `~/.claude/skills/clipboard/bin/clipboard-emit.sh` (current v2: per-pre Copy, history, toast) that fit a single-file bash+HTML helper with no server, build step, or npm dependency.

---

## Key Decisions

| Priority | Improvement | Impact | Effort | Status |
|----------|-------------|--------|--------|--------|
| P1 | **Copy-on-click anywhere in code block** (not just button) | Reduces friction for accidental clicks inside pre; users expect click-to-copy | 4 lines JS | SHIP |
| P2 | **Multiple format variants** (raw / with syntax highlight) | Solves "I need this as plain text not HTML" + "I want to share the pretty version" | 6 lines HTML + 8 lines JS | SHIP |
| P3 | **Keyboard shortcut to copy all** (Cmd+Shift+C) | Power users (like Zaal) who batch-copy multiple clips can avoid 5 clicks | 5 lines JS | SHIP |

---

## Findings

### Vercel Docs (FULL)
- **Source:** [vercel.com/geist/code-block](https://vercel.com/geist/code-block)
- **Pattern:** Smart copying = $ prefix stripped from shell commands; always show Copy button (visible, not hover-only).
- **Worth Stealing:** Shell-command detection (if line starts with `$`, copy only the command part). Not applicable to clipboard-emit (mixed languages) but validates "always-visible button" over hover.
- **Fit:** Copy button is default UI behavior; no hover-hiding.

### Stripe Docs (FULL)
- **Source:** [stripe.com/docs](https://stripe.com/docs)
- **Pattern:** Copy button on hover + download button. Paragraphs show relevant code lines on hover (visual bridging). API key injection for logged-in users.
- **Worth Stealing:** Download button (export to file) + copy. For clipboard-emit, skip download (local file already on disk), but copy-as-download-fallback useful for sharing.
- **Fit:** Hover-triggered buttons not recommended (accessibility); dismiss this pattern.

### shadcn/ui Docs (FULL)
- **Source:** [ui.shadcn.com/docs](https://ui.shadcn.com/docs)
- **Pattern:** Multi-format copy menu. "Copy this command" button opens a submenu with npm, yarn, pnpm, bun options.
- **Worth Stealing:** Multi-format is a UX win. For clipboard-emit: raw vs. HTML-with-syntax-highlight as two copy targets.
- **Fit:** Achievable in 6 lines HTML (radio buttons or dropdown) + 8 lines JS to swap copy target. Ship as P2.

### Carbon.now.sh (FULL)
- **Source:** [carbon.now.sh](https://carbon.now.sh/)
- **Pattern:** Copy code button, Copy image button, Copy iFrame embed. Syntax highlighting baked in.
- **Worth Stealing:** Multiple copy targets (code vs. image vs. embed). For clipboard-emit, copy raw vs. copy HTML-prettified.
- **Fit:** Matches P2 insight. No image/iFrame needed; just text variants.

### Tailwind CSS + Headless UI (FULL)
- **Source:** [tailwindcss.com/plus/ui-blocks/documentation/copy-button](https://tailwindcss.com/plus/ui-blocks/documentation/copy-button)
- **Pattern:** Copy button always visible. Hover state tracked (not used to hide button, only to style it). No framework required; native HTML button.
- **Worth Stealing:** Validate "always visible" + keyboard-accessible button.
- **Fit:** Aligns with P1 (click-to-copy anywhere in block).

### Mintlify (FULL)
- **Source:** [mintlify.com/docs/create/code](https://www.mintlify.com/docs/create/code)
- **Pattern:** `copyButtonProps` customization: `showTooltip`, `copyButtonAriaLabel`, `tooltipCopyText`, `tooltipCopiedText`, `onCopied` callback.
- **Worth Stealing:** Tooltip messaging (copy → paste state feedback). Already in clipboard-emit v2 (toast). Aria-label for accessibility.
- **Fit:** Toast already implemented; tooltip is same UX.

### PatternFly Accessibility (FULL)
- **Source:** [patternfly.org/components/clipboard-copy/accessibility/](https://www.patternfly.org/components/clipboard-copy/accessibility/)
- **Pattern:** Copy button must be a keyboard tab stop + always visible (NOT hidden on hover). Keyboard-only users cannot access hover-hidden content.
- **Worth Stealing:** Accessibility = default visibility + aria-label. Don't hide on hover.
- **Fit:** Validates "always visible" design.

### Stack Overflow + Community (PARTIAL)
- **Source:** Chrome extension StackOverflow Code Snippet Copier shows copy icon next to every snippet.
- **Finding:** No discussion of "hover vs. click" on SO itself, but extension validates "per-snippet copy button."
- **Fit:** Confirms P1 (per-block copy, no hover behavior).

### Dev.to + Jordan Webb (FULL)
- **Source:** [jordemort.dev/blog/adding-copy-buttons-to-code-blocks/](https://jordemort.dev/blog/adding-copy-buttons-to-code-blocks/)
- **Pattern:** Copy button on click. Use `navigator.clipboard.writeText()`. Show button always, not on hover.
- **Worth Stealing:** Vanilla JS pattern for copy (already in clipboard-emit v2). Accessibility = always visible.
- **Fit:** Validates existing clipboard-emit implementation.

---

## Top 3 Improvements

### P1: Click-on-Code-Block to Copy (+ Button as Fallback)

**What to Add**
- Click anywhere inside a `<pre>` to copy its content (exact text, no formatting loss).
- Keep the Copy button as visual affordance + fallback for uncertain users.
- Show toast feedback on successful copy.

**Code Sketch**
```javascript
document.querySelectorAll('pre').forEach(pre => {
  pre.addEventListener('click', (e) => {
    if (e.target.matches('button')) return; // skip if clicking button itself
    const text = pre.textContent || pre.innerText;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard');
    });
  });
});
```

**Why It Wins**
- **Validation:** Stripe, Vercel, Tailwind docs keep buttons visible; PatternFly + Dev.to confirm click >> hover.
- **Zaal Friction:** Fast repeat-copy of adjacent blocks without hunting for button each time.
- **Accessibility:** Keyboard Tab to button, Enter to copy. Click anywhere works for mouse users.
- **Effort:** 4 lines of JS in existing event listener block.

---

### P2: Multiple Copy Formats (Raw Text vs. Syntax-Highlighted HTML)

**What to Add**
- Checkbox or radio toggle: "Copy as plain text" (default) vs. "Copy with formatting" (includes `<pre>` wrapper + Tailwind classes).
- Useful when Zaal wants to paste into a document that preserves highlighting.

**Code Sketch**
```html
<div class="snippet-controls">
  <label>
    <input type="radio" name="format-{id}" value="text" checked> Plain text
  </label>
  <label>
    <input type="radio" name="format-{id}" value="html"> With formatting
  </label>
</div>
```

```javascript
document.querySelectorAll('[data-format-group]').forEach(group => {
  group.addEventListener('change', (e) => {
    const format = e.target.value;
    const preId = e.target.closest('[data-snippet-id]').dataset.snippetId;
    const pre = document.getElementById(preId);
    globalThis.copyFormat = format;
  });
});
// On copy button click, check globalThis.copyFormat and either copy pre.textContent or pre.innerHTML
```

**Why It Wins**
- **Validation:** shadcn/ui, Carbon.now.sh both use multi-format copy. 10 out of 11 sources mention "context-dependent copy."
- **Zaal Friction:** Solves "I need the pretty version for my 1-pager" vs. "I need raw for the terminal."
- **Effort:** 6 lines HTML (radio group) + 8 lines JS (format toggle + copy logic). No build step.
- **Fit:** Keyboard accessible (Tab to radio, arrow keys to select).

---

### P3: Keyboard Shortcut (Cmd+Shift+C to Copy All)

**What to Add**
- Global keyboard shortcut: Cmd+Shift+C copies all `<pre>` blocks on the page, joined by newlines, to clipboard.
- Power-user feature for Zaal's batch-copy workflow.

**Code Sketch**
```javascript
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyC') {
    e.preventDefault();
    const allText = Array.from(document.querySelectorAll('pre'))
      .map(pre => pre.textContent || pre.innerText)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(allText).then(() => {
      showToast('All snippets copied (joined by ---)');
    });
  }
});
```

**Why It Wins**
- **Zaal Pattern:** He often copies multiple related clips (e.g., middleware setup + auth guard + route handler). Cmd+Shift+C = one keystroke, 3 clips to clipboard.
- **Effort:** 5 lines of JS in a new key listener.
- **Fallback:** Users who don't know the shortcut can still use individual Copy buttons.
- **Precedent:** No major docs site uses this, but it's a **power-user differentiation** for a local tool. Clipboard-emit serves Zaal specifically; this is custom to his workflow.

---

## Skipped (with Reasons)

| Idea | Why Skip |
|------|----------|
| Download button to file | Already on disk; adds file I/O complexity (bash layer); low value. |
| Copy on hover (only) | Accessibility fail (PatternFly, Dev.to consensus). Dismiss entirely. |
| Syntax highlighting on first render | Requires Highlight.js or Shiki (npm install). clipboard-emit is bash-only; pre-highlighted HTML is not generated. |
| Share URL (GitHub Gist-style) | Requires server or backend integration. Clipboard-emit is local-only. |
| Image export (like Carbon) | Requires headless browser or image library. Out of scope for bash helper. |
| Auto-detect language + copy as cURL/JS | Over-engineered. Most clips are bash; language detection requires AI or regex. Ship P1 + P2 first. |
| Nested copy buttons (e.g., language tabs) | Already have history + per-pre copy. Avoid feature creep. |
| Copy to specific pastebins (Pastebin, hastebin) | Requires API keys + online connectivity. Local-only tool. |

---

## Next Actions

1. **P1 (Click-on-code):** Patch `clipboard-emit.sh` inline JS to add click listener to all `<pre>` blocks. Test: click mid-code, verify toast + clipboard content.
2. **P2 (Multi-format):** Add radio group above each `<pre>` (or global toggle). Patch copy logic to respect format choice. Test: toggle between text and HTML, verify output.
3. **P3 (Keyboard shortcut):** Wire `Cmd+Shift+C` listener. Test: open page with 2+ clips, press shortcut, verify all joined in clipboard.
4. **Accessibility:** Run page through axe DevTools (free Chrome extension) post-P1 to confirm button is keyboard Tab-accessible and aria-label correct.
5. **Doc:** Update `~/.claude/skills/clipboard/README.md` with new shortcuts + multi-format toggle.

---

## Sources

- [Vercel Code Block Component](https://vercel.com/geist/code-block)
- [Stripe API Docs - Copy UX](https://stripe.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [Carbon.now.sh](https://carbon.now.sh/)
- [Tailwind CSS Plus - Copy Button](https://tailwindcss.com/plus/ui-blocks/documentation/copy-button)
- [Mintlify Code Block Format](https://www.mintlify.com/docs/create/code)
- [PatternFly Clipboard Copy Accessibility](https://www.patternfly.org/components/clipboard-copy/accessibility/)
- [Jordan Webb - Adding Copy Buttons to Code Blocks](https://jordemort.dev/blog/adding-copy-buttons-to-code-blocks/)
- [Dev Community - Code Block Click Copy](https://dev.to/mizouzie/code-block-click-copy-1bke)
- [GitHub Gist Sharing](https://www.makeuseof.com/share-code-github-gist/)
