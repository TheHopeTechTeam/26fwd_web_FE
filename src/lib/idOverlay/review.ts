/**
 * `?review=1`: lists the wording BB has confirmed in the sheet's 「想改成」 column that this page
 * does not show yet, each item opening to current vs requested text. Everything from the sheet
 * is untrusted (the sheet is editable by link), so it only ever goes in through textContent.
 */
import { classifyNext, compareChange, compareRemoval, type Verdict } from './compare';
import type { OverlayPage, SheetRow } from './rows';
import { SHEET_URL } from './sheet';

export interface OverlayCtx {
  page: OverlayPage;
  layer: HTMLElement;
  rows(): SheetRow[];
  state(): { source: 'static' | 'live'; error: string | null; loadedAt: Date | null; loading: boolean };
  /** Text of the page elements tagged with this 編號, or null when none is on screen. */
  regionText(id: string): string | null;
  pageText(): string;
  /** Title, descriptions, placeholders and aria labels: wording that is not on screen. */
  hiddenText(): string;
  hasElement(id: string): boolean;
  focus(id: string): boolean;
  /** Red frames for wording confirmed in the sheet but not on the page; amber for ones to check by eye. */
  setPending(confirmed: Set<string>, maybe: Set<string>): void;
  onScan(cb: () => void): void;
  reload(): Promise<void>;
}

type Group = 'todo' | 'partial' | 'check' | 'later' | 'waiting' | 'other' | 'done';

interface Item {
  row: SheetRow;
  group: Group;
  reason: string;
  verdict?: Verdict;
  current: string;
  located: boolean;
  scope: '頁面上已定位的文字' | '整頁文字' | '標題／說明／提示文字（畫面上看不到）';
}

const GROUPS: Array<{ key: Group; title: string; hint: string }> = [
  { key: 'todo', title: '未套用', hint: '表格已有新文字，網頁還沒改（或舊文字應刪除卻仍在）' },
  { key: 'partial', title: '部分套用', hint: '只改了一部分，下方列出網頁上找不到的片段' },
  { key: 'check', title: '需人工確認', hint: '排列不同、或狀態有標記但「想改成」空白' },
  { key: 'later', title: '需操作後才能比對', hint: '這些文字要操作到對應畫面（例如送出卡片後）才會出現；出現後會自動重新比對' },
  { key: 'waiting', title: '等待 Comms／資料', hint: 'BB 在表格寫明需要其他窗口提供' },
  { key: 'other', title: '在其他頁面比對', hint: '這些列屬於別的頁面，點連結到該頁看結果' },
  { key: 'done', title: '已套用／沿用', hint: '網頁已符合表格' },
];

const PAGE_PATH: Record<Exclude<OverlayPage, 'all'>, { path: string; name: string }> = {
  home: { path: '', name: '首頁' },
  cards: { path: 'cards/', name: '卡片牆頁' },
  privacy: { path: 'privacy/', name: '隱私頁' },
};

const VERDICT_TEXT: Record<Verdict['state'], string> = {
  applied: '已出現在網頁',
  likely: '疑似已套用（排列方式不同）',
  partial: '部分出現在網頁',
  missing: '網頁上找不到',
  removed: '舊文字已移除',
  'still-there': '舊文字仍在網頁',
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function clip(s: string, n = 700): string {
  const t = s.replace(/\n{3,}/g, '\n\n').trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

export function startReview(ctx: OverlayCtx): void {
  const wantedRow = new URLSearchParams(location.search).get('row');
  const openIds = new Set<string>();
  let signature = '';
  let handledRowParam = false;

  const panel = el('section', 'idov-review');
  const toggle = el('button', 'idov-toggle idov-toggle--review');
  toggle.type = 'button';
  panel.hidden = false;
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });
  ctx.layer.append(panel, toggle);

  const evaluate = (): Item[] => {
    const page = ctx.pageText();
    const hidden = ctx.hiddenText();
    const items: Item[] = [];
    for (const row of ctx.rows()) {
      const kind = classifyNext(row.next ?? '');
      const status = row.status ?? '';
      if (kind === 'none' && !status) continue;
      const offScreen = row.when.includes('網頁上看不到');
      // Share previews, titles and search text describe the home page, so they are judged there.
      const here = row.page === ctx.page || (row.page === 'all' && (!offScreen || ctx.page === 'home'));
      if (kind === 'keep') {
        if (here) items.push({ row, group: 'done', reason: '表格標示沿用，不需修改', current: row.text, located: false, scope: '整頁文字' });
        continue;
      }
      if (!here) {
        items.push({ row, group: 'other', reason: '', current: row.text, located: false, scope: '整頁文字' });
        continue;
      }
      const located = ctx.regionText(String(row.id));
      const region = offScreen ? hidden : (located ?? page);
      const scope = offScreen ? '標題／說明／提示文字（畫面上看不到）' : located !== null ? '頁面上已定位的文字' : '整頁文字';
      const current = offScreen || located === null ? row.text : located;
      if (kind === 'waiting') {
        items.push({ row, group: 'waiting', reason: '', current, located: located !== null, scope });
      } else if (located === null && !offScreen && (kind === 'change' || kind === 'remove') && (row.when.includes('操作後才出現') || row.when.includes('卡片圖片'))) {
        items.push({ row, group: 'later', reason: '目前畫面上沒有這段文字，操作到對應畫面後才能比對', current, located: false, scope });
      } else if (kind === 'none') {
        items.push({ row, group: 'check', reason: `狀態標為「${status}」，但「想改成」是空白，無法比對`, current, located: located !== null, scope });
      } else if (kind === 'remove') {
        const verdict = compareRemoval(row.text, offScreen ? hidden : page);
        items.push({ row, group: verdict.state === 'removed' ? 'done' : 'todo', reason: `表格要求「${(row.next ?? '').trim()}」`, verdict, current, located: located !== null, scope: offScreen ? scope : '整頁文字' });
      } else {
        const verdict = compareChange(row.next ?? '', region);
        const group: Group = verdict.state === 'applied' ? 'done' : verdict.state === 'likely' ? 'check' : verdict.state === 'partial' ? 'partial' : 'todo';
        items.push({ row, group, reason: '', verdict, current, located: located !== null, scope });
      }
    }
    return items.sort((a, b) => a.row.id - b.row.id);
  };

  const renderItem = (it: Item): HTMLElement => {
    const id = String(it.row.id);
    const d = el('details', 'idov-item');
    d.open = openIds.has(id);
    d.addEventListener('toggle', () => {
      if (d.open) openIds.add(id);
      else openIds.delete(id);
    });
    const sum = el('summary');
    sum.append(el('b', undefined, id), el('span', undefined, `${it.row.section}・${it.row.pos}`));
    if (it.row.status) sum.append(el('em', undefined, it.row.status));
    d.append(sum);

    const body = el('div', 'idov-item__body');
    if (it.group === 'other') {
      const target = PAGE_PATH[it.row.page === 'all' ? 'home' : it.row.page];
      const a = el('a', undefined, `前往${target.name}查看這一列的比對結果`);
      a.href = `${import.meta.env.BASE_URL}${target.path}?review=1&row=${id}`;
      body.append(a);
    } else {
      if (it.reason) body.append(el('p', 'idov-item__reason', it.reason));
      if (it.verdict) {
        const v = it.verdict;
        body.append(el('p', 'idov-item__reason', `比對（${it.scope}）：${VERDICT_TEXT[v.state]}${v.total > 0 ? `（${v.found}/${v.total} 段）` : ''}`));
        if (v.missing.length > 0) {
          body.append(el('p', 'idov-label', it.row.next && classifyNext(it.row.next) === 'remove' ? '網頁仍顯示的舊文字' : '網頁上找不到的片段'));
          const ul = el('ul');
          for (const m of v.missing) ul.append(el('li', undefined, m));
          body.append(ul);
        }
      }
      const cols = el('div', 'idov-cols');
      const cur = el('div');
      cur.append(el('p', 'idov-label', it.located ? '網頁現行文字' : '表格「目前文字」（網頁上未定位，可能已過期）'), el('pre', undefined, clip(it.current)));
      const next = el('div');
      next.append(el('p', 'idov-label', '表格「想改成」'), el('pre', undefined, clip(it.row.next ?? '') || '（空白）'));
      cols.append(cur, next);
      body.append(cols);
    }
    const meta = [it.row.who && `填寫人：${it.row.who}`, it.row.status && `狀態：${it.row.status}`, it.row.note && `備註：${it.row.note.replace(/\s+/g, ' ')}`].filter(Boolean).join('　');
    if (meta) body.append(el('p', 'idov-meta', meta));
    const actions = el('div', 'idov-actions');
    if (ctx.hasElement(id)) {
      const go = el('button', undefined, '跳到頁面位置');
      go.type = 'button';
      go.addEventListener('click', () => ctx.focus(id));
      actions.append(go);
    }
    const open = el('a', undefined, '在文字表開啟');
    open.href = SHEET_URL;
    open.target = '_blank';
    open.rel = 'noopener noreferrer';
    actions.append(open);
    body.append(actions);
    d.append(body);
    return d;
  };

  const render = () => {
    const state = ctx.state();
    const items = evaluate();
    const idsOf = (...groups: Group[]) => new Set(items.filter((i) => groups.includes(i.group)).map((i) => String(i.row.id)));
    ctx.setPending(idsOf('todo', 'partial'), idsOf('check'));
    const count = (g: Group) => items.filter((i) => i.group === g).length;
    toggle.textContent = `待修改（本頁 ${count('todo') + count('partial')}）`;

    const sig = JSON.stringify([state.source, state.error, state.loading, items.map((i) => [i.row.id, i.group, i.verdict?.found, i.verdict?.missing, i.located])]);
    if (sig === signature) return;
    signature = sig;

    panel.replaceChildren();
    const head = el('div', 'idov-review__head');
    head.append(el('h2', undefined, '待修改清單'));
    const sub =
      state.source === 'live' && state.loadedAt
        ? `資料：Google 文字表即時讀取（${state.loadedAt.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}）。比對的是目前這一頁。`
        : state.loading
          ? '正在讀取 Google 文字表…'
          : '無法讀取雲端文字表，目前只能顯示離線的編號資料，無法比對。';
    head.append(el('p', 'idov-note', sub));
    if (state.error) head.append(el('p', 'idov-error', `讀取失敗：${state.error}。請確認網路，或直接開啟文字表。`));
    const tools = el('div', 'idov-actions');
    const reload = el('button', undefined, '重新讀取表格');
    reload.type = 'button';
    reload.disabled = state.loading;
    reload.addEventListener('click', () => void ctx.reload());
    const sheet = el('a', undefined, '開啟文字表');
    sheet.href = SHEET_URL;
    sheet.target = '_blank';
    sheet.rel = 'noopener noreferrer';
    tools.append(reload, sheet);
    head.append(tools);
    const hide = el('button', 'idov-review__close', '收合');
    hide.type = 'button';
    hide.addEventListener('click', () => {
      panel.hidden = true;
    });
    head.append(hide);
    panel.append(head);

    const scroller = el('div', 'idov-review__list');
    for (const g of GROUPS) {
      const inGroup = items.filter((i) => i.group === g.key);
      if (inGroup.length === 0) continue;
      const wrap = el('details', 'idov-group');
      wrap.open = g.key !== 'done' && g.key !== 'other';
      const gs = el('summary', undefined, `${g.title}（${inGroup.length}）`);
      wrap.append(gs, el('p', 'idov-note', g.hint));
      for (const it of inGroup) wrap.append(renderItem(it));
      scroller.append(wrap);
    }
    if (items.length === 0 && !state.loading && !state.error) scroller.append(el('p', 'idov-note', '表格中沒有需要比對的列。'));
    panel.append(scroller);

    if (!handledRowParam && wantedRow && state.source === 'live') {
      handledRowParam = true;
      openIds.add(wantedRow);
      signature = '';
      queueMicrotask(render);
      queueMicrotask(() => {
        ctx.focus(wantedRow);
        panel.querySelector(`details.idov-item[open]`)?.scrollIntoView({ block: 'nearest' });
      });
    }
  };

  ctx.onScan(render);
  render();
}
