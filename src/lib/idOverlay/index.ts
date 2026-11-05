/**
 * Review overlay (`?ids=1`, `?review=1`): tags every piece of page text that has a row in the
 * cloud sheet 「FORWARD2026_網站文字表」 with its 編號, and tags image regions with their MED
 * code, so a reviewer can see which line or picture a sheet row means. `?review=1` adds the
 * list of wording BB has confirmed in the sheet that the page does not show yet.
 * It only reads the DOM and draws on its own layer; nothing here runs unless the URL asks.
 */
import './overlay.css';
import { classifyNext, clausesOf, stripKey } from './compare';
import { isDesignPending, startReview, type OverlayCtx } from './review';
import { MEDIA_SPOTS, TEXT_SELECTORS } from './spots';
import { SHEET_ROWS, type OverlayPage, type SheetRow } from './rows';
import { fetchSheetRows } from './sheet';

interface Target {
  el: Element;
  ids: Set<string>;
  kind: 'text' | 'media';
  badge: HTMLElement;
  box: HTMLElement;
  /** Design note shown beside the frame (outside the box), when the row has one pending. */
  flag: HTMLElement | null;
}

/** Punctuation and whitespace never decide a match (JSX line breaks, sheet spacing, 「，」 vs 「, 」). */
const norm = stripKey;

function currentPage(): OverlayPage {
  const path = location.pathname.replace(/\/+$/, '');
  if (path.endsWith('/cards')) return 'cards';
  if (path.endsWith('/privacy')) return 'privacy';
  return 'home';
}

/** Strip a trailing explanatory （…） and turn {placeholders} into wildcards. */
function toMatcher(raw: string): { exact: string; alt: string; re: RegExp | null } | null {
  const body = raw.replace(/[（(][^）)]*[）)]\s*$/, '');
  const exact = norm(body);
  if (exact.length < 2) return null;
  const alt = norm(raw);
  if (/\{[^}]+\}/.test(body)) {
    const src = body
      .split(/\{[^}]+\}/)
      .map((part) => norm(part).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    return { exact, alt, re: new RegExp(`^${src}$`) };
  }
  return { exact, alt, re: null };
}

function segmentsOf(text: string): string[] {
  if (text.startsWith('資料：')) return [(text.split('\n')[0] ?? '').slice(3)];
  return text
    .split(/\n|\s\/\s|／/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Wording to look for, new wording first: once BB has written it, that is what should be on the page. */
function wordingOf(row: SheetRow): string[][] {
  const fresh = row.next && classifyNext(row.next) === 'change' ? segmentsOf(row.next) : [];
  return [fresh, segmentsOf(row.text)].filter((s) => s.length > 0);
}

function label(row: SheetRow): string {
  return `${row.section}・${row.pos}`;
}

function status(row: SheetRow, found: boolean): { key: string; text: string } {
  if (found) return { key: 'ok', text: '已標示' };
  if (row.when.includes('網頁上看不到')) return { key: 'hidden', text: '畫面上看不到（分享／搜尋／讀屏用）' };
  if (row.when.includes('操作後才出現') || row.when.includes('卡片圖片')) return { key: 'later', text: '操作後才出現（做出卡片後）' };
  if (row.when.includes('預覽版才有')) return { key: 'preview', text: '預覽版才有' };
  return { key: 'miss', text: '未能自動定位' };
}

/** Drop elements that contain another hit: the inner one is the line we mean. */
function innermost(els: Element[]): Element[] {
  return els.filter((e) => !els.some((o) => o !== e && e.contains(o)));
}

export function startIdOverlay(): void {
  const page = currentPage();
  const params = new URLSearchParams(location.search);
  let allRows: SheetRow[] = SHEET_ROWS;
  const rowsHere = () => allRows.filter((r) => r.page === page || r.page === 'all');
  const rowById = () => new Map(rowsHere().map((r) => [String(r.id), r]));

  const root = document.createElement('div');
  root.id = 'idov-root';
  root.setAttribute('popover', 'manual');
  const layer = document.createElement('div');
  layer.className = 'idov-layer';
  root.append(layer);
  document.body.append(root);
  const stack = () => {
    try {
      root.hidePopover();
    } catch {
      /* not showing yet */
    }
    root.showPopover();
  };
  stack();

  const targets = new Map<Element, Target>();
  const foundIds = new Set<string>();
  const pendingIds = new Set<string>();
  const maybeIds = new Set<string>();
  const listeners: Array<() => void> = [];
  let hidden = false;
  let sheetState: { source: 'static' | 'live'; error: string | null; loadedAt: Date | null; loading: boolean } = { source: 'static', error: null, loadedAt: null, loading: true };

  const mkTarget = (el: Element, kind: Target['kind']): Target => {
    const badge = document.createElement('span');
    badge.className = `idov-badge idov-badge--${kind}`;
    const box = document.createElement('span');
    box.className = `idov-box idov-box--${kind}`;
    layer.append(box, badge);
    const t: Target = { el, ids: new Set(), kind, badge, box, flag: null };
    targets.set(el, t);
    return t;
  };

  const paintTarget = (t: Target) => {
    const byId = rowById();
    t.badge.replaceChildren();
    const num = document.createElement('b');
    num.textContent = [...t.ids].join(' · ');
    const tip = document.createElement('i');
    tip.textContent = [...t.ids]
      .map((k) => {
        const r = byId.get(k);
        return r ? `${k} ${label(r)}` : (MEDIA_SPOTS.find((m) => m.code === k)?.label ?? k);
      })
      .join('｜');
    t.badge.append(num, tip);
    const pending = [...t.ids].some((k) => pendingIds.has(k));
    const maybe = !pending && [...t.ids].some((k) => maybeIds.has(k));
    t.badge.classList.toggle('is-pending', pending);
    t.box.classList.toggle('is-pending', pending);
    t.badge.classList.toggle('is-maybe', maybe);
    t.box.classList.toggle('is-maybe', maybe);
  };

  /** Each pending design note sits beside the first frame of its row, outside the box. */
  const paintFlags = () => {
    const byId = rowById();
    const shown = new Set<string>();
    for (const t of targets.values()) {
      const notes: string[] = [];
      for (const k of t.ids) {
        const r = byId.get(k);
        if (!r || shown.has(k) || !pendingIds.has(k) || !isDesignPending(r)) continue;
        shown.add(k);
        notes.push(`${k}｜${r.design}`);
      }
      if (notes.length === 0) {
        t.flag?.remove();
        t.flag = null;
        continue;
      }
      if (!t.flag) {
        t.flag = document.createElement('div');
        t.flag.className = 'idov-flag';
        layer.append(t.flag);
      }
      t.flag.textContent = notes.join('\n');
    }
  };

  const claim = (el: Element, id: string, kind: Target['kind']) => {
    const t = targets.get(el) ?? mkTarget(el, kind);
    t.ids.add(id);
    foundIds.add(id);
  };

  const scan = () => {
    for (const t of targets.values()) t.ids.clear();
    foundIds.clear();

    // Leaf-most elements indexed by their normalised text.
    const all = [...document.body.querySelectorAll('*')].filter((e) => !root.contains(e) && !/^(SCRIPT|STYLE|NOSCRIPT|SVG|PATH)$/i.test(e.tagName));
    const byText = new Map<string, Element[]>();
    const textOf = new Map<Element, string>();
    for (const e of all) {
      const t = norm(e.textContent ?? '');
      if (!t || t.length > 600) continue;
      textOf.set(e, t);
    }
    for (const [e, t] of textOf) {
      const hasSameChild = [...e.children].some((c) => textOf.get(c) === t);
      if (hasSameChild) continue;
      const list = byText.get(t);
      if (list) list.push(e);
      else byText.set(t, [e]);
    }
    const leafTexts = [...byText.keys()];

    for (const row of rowsHere()) {
      const id = String(row.id);
      const sel = TEXT_SELECTORS[row.id];
      if (sel) {
        for (const e of document.querySelectorAll(sel)) if (!root.contains(e)) claim(e, id, 'text');
        continue;
      }
      let count = 0;
      for (const wording of wordingOf(row)) {
        const found: Element[] = [];
        let matched = 0;
        for (const raw of wording) {
          const m = toMatcher(raw);
          if (!m) continue;
          let hits: Element[] = byText.get(m.alt) ?? byText.get(m.exact) ?? [];
          if (hits.length === 0 && m.re) {
            hits = leafTexts.filter((t) => m.re!.test(t)).flatMap((t) => byText.get(t) ?? []);
          }
          if (hits.length === 0 && m.exact.length >= 10) {
            // Text inside a larger element (e.g. a sentence inside a paragraph).
            hits = leafTexts.filter((t) => t.includes(m.exact)).flatMap((t) => byText.get(t) ?? []);
            hits = hits.filter((e) => ![...e.children].some((c) => (textOf.get(c) ?? '').includes(m.exact)));
          }
          if (hits.length > 0) matched += 1;
          found.push(...hits.slice(0, 3));
        }
        // One line of a multi-line wording matching by chance (e.g. "THERE IS MORE") is not the row.
        if (matched * 2 < wording.length) continue;
        for (const e of found.slice(0, 6)) claim(e, id, 'text');
        count = found.length;
        if (count > 0) break;
      }
      // Rows that only appear after an action are not searched by clause: a common phrase on the
      // page would be taken for them.
      if (count > 0 || row.when.includes('操作後才出現') || row.when.includes('卡片圖片')) continue;
      // A half-applied edit: find the line by its longest clause that is on the page.
      const clauses = [...(row.next && classifyNext(row.next) === 'change' ? clausesOf(row.next) : []), ...clausesOf(row.text)].sort((a, b) => norm(b).length - norm(a).length);
      for (const clause of clauses) {
        const key = norm(clause);
        if (key.length < 6) continue;
        const hits = innermost(leafTexts.filter((k) => k.includes(key)).flatMap((k) => byText.get(k) ?? []));
        if (hits.length === 0) continue;
        // Take the whole heading / paragraph, not just the span that happens to hold the clause.
        for (const e of hits.slice(0, 2)) claim(e.closest('h1,h2,h3,h4,p,li,blockquote,dd,dt,legend,label') ?? e, id, 'text');
        break;
      }
    }

    for (const spot of MEDIA_SPOTS) {
      if (spot.page !== 'all' && spot.page !== page) continue;
      for (const e of document.querySelectorAll(spot.sel)) if (!root.contains(e)) claim(e, spot.code, 'media');
    }

    for (const [el, t] of targets) {
      if (t.ids.size === 0) {
        t.badge.remove();
        t.box.remove();
        t.flag?.remove();
        targets.delete(el);
      } else paintTarget(t);
    }
    paintFlags();
    renderPanel();
    for (const cb of listeners) cb();
  };

  // ---- positions ---------------------------------------------------------------------------
  const place = () => {
    const modal = document.querySelector('dialog[open]');
    for (const [el, t] of targets) {
      if (!el.isConnected) {
        t.badge.remove();
        t.box.remove();
        t.flag?.remove();
        targets.delete(el);
        continue;
      }
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const clipped = cs.clip === 'rect(0px, 0px, 0px, 0px)';
      const visible = !hidden && !clipped && (!modal || modal.contains(el)) && r.width >= 6 && r.height >= 6 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
      t.badge.style.display = visible ? '' : 'none';
      t.box.style.display = visible ? '' : 'none';
      if (t.flag) {
        t.flag.style.display = visible ? '' : 'none';
        if (visible) {
          const fw = t.flag.offsetWidth;
          const fh = t.flag.offsetHeight;
          const fl = Math.min(Math.max(r.left, 2), Math.max(2, innerWidth - fw - 2));
          const ft = Math.min(r.bottom + 4, Math.max(2, innerHeight - fh - 2));
          t.flag.style.transform = `translate(${fl}px, ${ft}px)`;
        }
      }
      if (!visible) continue;
      t.box.style.transform = `translate(${r.left}px, ${r.top}px)`;
      t.box.style.width = `${r.width}px`;
      t.box.style.height = `${r.height}px`;
      const bw = t.badge.offsetWidth;
      const left = Math.min(Math.max(r.left - 2, 2), Math.max(2, innerWidth - bw - 2));
      t.badge.style.transform = `translate(${left}px, ${Math.max(r.top - 9, 2)}px)`;
    }
    requestAnimationFrame(place);
  };

  // ---- panel -------------------------------------------------------------------------------
  const panel = document.createElement('div');
  panel.className = 'idov-panel';
  panel.hidden = true;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'idov-toggle';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = '輸入編號或文字搜尋，例如 65';
  const list = document.createElement('ul');
  const head = document.createElement('div');
  head.className = 'idov-head';
  const hideBtn = document.createElement('button');
  hideBtn.type = 'button';
  hideBtn.textContent = '隱藏標示';
  hideBtn.addEventListener('click', () => {
    hidden = !hidden;
    hideBtn.textContent = hidden ? '顯示標示' : '隱藏標示';
  });
  const note = document.createElement('p');
  note.className = 'idov-note';
  note.textContent = '金色＝文字編號（對應文字表「編號」欄）；藍色＝圖片／媒體（MED 編號，依 GitHub Issue 對應）。滑過標籤可看位置名稱。';
  head.append(search, hideBtn);
  panel.append(head, note, list);
  layer.append(toggle, panel);

  const flash = (el: Element) => {
    const t = targets.get(el);
    if (!t) return;
    t.box.classList.add('is-flash');
    setTimeout(() => t.box.classList.remove('is-flash'), 1800);
  };

  const elementsOf = (id: string, kind: Target['kind'] = 'text') => [...targets.values()].filter((t) => t.kind === kind && t.ids.has(id)).map((t) => t.el);

  function renderPanel() {
    const q = search.value.trim().toLowerCase();
    toggle.textContent = `編號對照（${foundIds.size}）`;
    list.replaceChildren();
    const items: Array<{ id: string; title: string; text: string; st: { key: string; text: string }; el?: Element }> = [];
    for (const row of rowsHere()) {
      const id = String(row.id);
      const el = elementsOf(id)[0];
      items.push({ id, title: label(row), text: row.text.replace(/\s+/g, ' '), st: status(row, !!el), el });
    }
    for (const spot of MEDIA_SPOTS) {
      if (spot.page !== 'all' && spot.page !== page) continue;
      const el = elementsOf(spot.code, 'media')[0];
      items.push({ id: spot.code, title: spot.label, text: spot.hint, st: el ? { key: 'ok', text: '已標示' } : { key: 'later', text: '操作後才出現' }, el });
    }
    for (const it of items) {
      if (q && !`${it.id} ${it.title} ${it.text}`.toLowerCase().includes(q)) continue;
      const li = document.createElement('li');
      const top = document.createElement('div');
      const n = document.createElement('b');
      n.textContent = it.id;
      const t = document.createElement('span');
      t.textContent = it.title;
      const s = document.createElement('em');
      s.className = `st-${it.st.key}`;
      s.textContent = it.st.text;
      top.append(n, t, s);
      const p = document.createElement('p');
      p.textContent = it.text.length > 70 ? `${it.text.slice(0, 70)}…` : it.text;
      li.append(top, p);
      if (it.el) {
        li.classList.add('is-link');
        li.addEventListener('click', () => {
          it.el!.scrollIntoView({ block: 'center', behavior: 'smooth' });
          flash(it.el!);
        });
      }
      list.append(li);
    }
  }

  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });
  search.addEventListener('input', renderPanel);

  // ---- text for the review comparison --------------------------------------------------------
  const walkText = (): string => {
    const parts: string[] = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement?.closest('#idov-root, script, style, noscript') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n = w.nextNode(); n; n = w.nextNode()) parts.push(n.textContent ?? '');
    return parts.join(' ');
  };
  const metaText = (): string => {
    const meta = ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]'].map((s) => document.querySelector(s)?.getAttribute('content') ?? '');
    return [document.title, ...meta].join(' ');
  };
  const attrText = (): string => [...document.querySelectorAll('[placeholder],[aria-label],[title]')].filter((e) => !root.contains(e)).map((e) => [e.getAttribute('placeholder'), e.getAttribute('aria-label'), e.getAttribute('title')].filter(Boolean).join(' ')).join(' ');

  // ---- sheet data ----------------------------------------------------------------------------
  const loadSheet = async () => {
    sheetState = { ...sheetState, loading: true, error: null };
    for (const cb of listeners) cb();
    try {
      allRows = await fetchSheetRows();
      sheetState = { source: 'live', error: null, loadedAt: new Date(), loading: false };
    } catch (e) {
      sheetState = { ...sheetState, error: e instanceof Error ? e.message : String(e), loading: false };
    }
    scan();
  };

  const ctx: OverlayCtx = {
    page,
    layer,
    rows: () => allRows,
    state: () => sheetState,
    regionText: (id) => {
      const els = elementsOf(id);
      return els.length > 0 ? els.map((e) => e.textContent ?? '').join('\n') : null;
    },
    pageText: walkText,
    hiddenText: () => `${metaText()} ${attrText()}`,
    hasElement: (id) => elementsOf(id).length > 0,
    focus: (id) => {
      const el = elementsOf(id)[0];
      if (!el) return false;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      flash(el);
      return true;
    },
    setPending: (confirmed, maybe) => {
      pendingIds.clear();
      maybeIds.clear();
      for (const id of confirmed) pendingIds.add(id);
      for (const id of maybe) maybeIds.add(id);
      for (const t of targets.values()) paintTarget(t);
      paintFlags();
    },
    onScan: (cb) => {
      listeners.push(cb);
    },
    reload: loadSheet,
  };

  // ---- keep up with the page ---------------------------------------------------------------
  let timer = 0;
  let lastDialog: Element | null = null;
  new MutationObserver((records) => {
    if (records.every((r) => root.contains(r.target))) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const dialog = document.querySelector('dialog[open]');
      if (dialog !== lastDialog) {
        lastDialog = dialog;
        if (dialog) stack(); // a modal dialog opened above us: climb back on top
      }
      scan();
    }, 160);
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['open', 'hidden'] });

  if (params.has('review')) startReview(ctx);
  scan();
  requestAnimationFrame(place);
  void loadSheet();
}

startIdOverlay();
