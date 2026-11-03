/**
 * Review overlay (`?ids=1`): tags every piece of page text that has a row in the cloud sheet
 * 「FORWARD2026_網站文字表」 with its 編號, and tags image regions with their MED code, so a
 * reviewer can see which line or picture a sheet row means. It only reads the DOM and draws
 * on its own layer; nothing here runs unless the URL asks for it.
 */
import './overlay.css';
import { MEDIA_SPOTS, TEXT_SELECTORS } from './spots';
import { SHEET_ROWS, type OverlayPage, type SheetRow } from './rows';

interface Target {
  el: Element;
  ids: Set<string>;
  kind: 'text' | 'media';
  badge: HTMLElement;
  box: HTMLElement;
}

/** Whitespace is dropped so JSX line breaks and sheet spacing never decide a match. */
const norm = (s: string) => s.replace(/[\s\u00a0]+/g, '');

function currentPage(): OverlayPage {
  const path = location.pathname.replace(/\/+$/, '');
  if (path.endsWith('/cards')) return 'cards';
  if (path.endsWith('/privacy')) return 'privacy';
  return 'home';
}

/** Strip a trailing explanatory （…） and turn {placeholders} into wildcards. */
function toMatcher(raw: string): { exact: string; alt: string; re: RegExp | null } | null {
  const seg = norm(raw.replace(/[（(][^）)]*[）)]\s*$/, ''));
  if (seg.length < 2) return null;
  const alt = norm(raw);
  if (/\{[^}]+\}/.test(seg)) {
    const src = seg
      .split(/\{[^}]+\}/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    return { exact: seg, alt, re: new RegExp(`^${src}$`) };
  }
  return { exact: seg, alt, re: null };
}

function segmentsOf(row: SheetRow): string[] {
  if (row.text.startsWith('資料：')) return [(row.text.split('\n')[0] ?? '').slice(3)];
  return row.text
    .split(/\n|\s\/\s|／/)
    .map((s) => s.trim())
    .filter(Boolean);
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

export function startIdOverlay(): void {
  const page = currentPage();
  const rows = SHEET_ROWS.filter((r) => r.page === page || r.page === 'all');
  const rowById = new Map(rows.map((r) => [String(r.id), r]));

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
  let hidden = false;

  const mkTarget = (el: Element, kind: Target['kind']): Target => {
    const badge = document.createElement('span');
    badge.className = `idov-badge idov-badge--${kind}`;
    const box = document.createElement('span');
    box.className = `idov-box idov-box--${kind}`;
    layer.append(box, badge);
    const t: Target = { el, ids: new Set(), kind, badge, box };
    targets.set(el, t);
    return t;
  };

  const claim = (el: Element, id: string, kind: Target['kind']) => {
    const t = targets.get(el) ?? mkTarget(el, kind);
    if (t.ids.has(id)) return;
    t.ids.add(id);
    foundIds.add(id);
    t.badge.replaceChildren();
    const num = document.createElement('b');
    num.textContent = [...t.ids].join(' · ');
    const tip = document.createElement('i');
    tip.textContent = [...t.ids]
      .map((k) => {
        const r = rowById.get(k);
        return r ? `${k} ${label(r)}` : (MEDIA_SPOTS.find((m) => m.code === k)?.label ?? k);
      })
      .join('｜');
    t.badge.append(num, tip);
  };

  const scan = () => {
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

    for (const row of rows) {
      const id = String(row.id);
      const sel = TEXT_SELECTORS[row.id];
      if (sel) {
        for (const e of document.querySelectorAll(sel)) if (!root.contains(e)) claim(e, id, 'text');
        continue;
      }
      let count = 0;
      for (const raw of segmentsOf(row)) {
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
        for (const e of hits.slice(0, 3)) {
          if (count >= 6) break;
          claim(e, id, 'text');
          count += 1;
        }
      }
    }

    for (const spot of MEDIA_SPOTS) {
      if (spot.page !== 'all' && spot.page !== page) continue;
      for (const e of document.querySelectorAll(spot.sel)) if (!root.contains(e)) claim(e, spot.code, 'media');
    }
    renderPanel();
  };

  // ---- positions ---------------------------------------------------------------------------
  const place = () => {
    const modal = document.querySelector('dialog[open]');
    for (const [el, t] of targets) {
      if (!el.isConnected) {
        t.badge.remove();
        t.box.remove();
        targets.delete(el);
        continue;
      }
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const clipped = cs.clip === 'rect(0px, 0px, 0px, 0px)';
      const visible = !hidden && !clipped && (!modal || modal.contains(el)) && r.width >= 6 && r.height >= 6 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
      t.badge.style.display = visible ? '' : 'none';
      t.box.style.display = visible ? '' : 'none';
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

  function renderPanel() {
    const q = search.value.trim().toLowerCase();
    toggle.textContent = `編號對照（${foundIds.size}）`;
    list.replaceChildren();
    const items: Array<{ id: string; title: string; text: string; st: { key: string; text: string }; el?: Element }> = [];
    for (const row of rows) {
      const id = String(row.id);
      const el = [...targets.values()].find((t) => t.kind === 'text' && t.ids.has(id))?.el;
      items.push({ id, title: label(row), text: row.text.replace(/\s+/g, ' '), st: status(row, !!el), el });
    }
    for (const spot of MEDIA_SPOTS) {
      if (spot.page !== 'all' && spot.page !== page) continue;
      const el = [...targets.values()].find((t) => t.kind === 'media' && t.ids.has(spot.code))?.el;
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

  scan();
  requestAnimationFrame(place);
}

startIdOverlay();
