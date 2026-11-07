/**
 * Design trial 3 only: wraps every mention of the campaign's keywords (FORWARD, Appreciate,
 * Anticipate, Respond, There is more, 2026 回應牆, 五大事工, 1%) in <span class="kw">, so CSS can set
 * them larger than the rest of their line. Text that is nothing but the keyword (a title such as
 * 「FORWARD CARD」) is already the lead and is left alone, as are form fields and live counters.
 * It only splits text nodes of static copy; the real pages never load this file.
 */
const KEYWORDS = /(FORWARD 卡|FORWARD|Forward Cards?|APPRECIATE|Appreciate|ANTICIPATE|Anticipate|RESPOND|Respond|THERE IS MORE|There is [Mm]ore|2026 回應牆|五大事工|1%)/g;
// Visitors' own card text and the logo lockups (header and footer wordmarks) are not touched.
const SKIP =
  'input, textarea, select, option, script, style, .kw, .sr-only, #dsg-root, .cardform__count, .toast, [contenteditable], .fcard, .site-header__wordmark, .site-footer__brand, .site-footer__wordmark';
const SCOPE = 'main, .site-header, .site-footer, dialog[open], .journey-rail';

function wrapIn(root: Element): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n as Text;
    const parent = text.parentElement;
    if (!parent || parent.closest(SKIP)) continue;
    KEYWORDS.lastIndex = 0;
    if (!KEYWORDS.test(text.data)) continue;
    // The keyword alone (with at most a couple of other characters) is a title already.
    const whole = (parent.textContent ?? '').replace(/\s+/g, '');
    const rest = whole.replace(KEYWORDS, '');
    if (rest.length <= 2) continue;
    hits.push(text);
  }
  for (const text of hits) {
    const frag = document.createDocumentFragment();
    for (const [i, part] of text.data.split(KEYWORDS).entries()) {
      if (!part) continue;
      if (i % 2 === 1) {
        const span = document.createElement('span');
        // Chinese-only keywords (五大事工、2026 回應牆) use the heading face; anything with Latin
        // letters (FORWARD 卡) the FORWARD display face.
        span.className = /[A-Za-z]/.test(part) ? 'kw' : 'kw kw--zh';
        span.textContent = part;
        frag.append(span);
      } else frag.append(part);
    }
    text.replaceWith(frag);
  }
}

export function emphasiseKeywords(): void {
  let queued = false;
  const run = () => {
    queued = false;
    for (const el of document.querySelectorAll(SCOPE)) wrapIn(el);
  };
  run();
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }).observe(document.body, { childList: true, subtree: true });
}
