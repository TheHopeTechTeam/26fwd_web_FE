/**
 * Design overlay for `/design/`: draws a frame and a label (優先／選做 · 編號 · name) around every
 * block in DESIGN_BLOCKS and lists them in a panel. It only reads the DOM and draws on its own
 * layer, and never runs on the production host.
 */
import './overlay.css';
import { DESIGN_BLOCKS, PRIORITY_LABEL, idsLabel, type DesignBlock, type Priority } from './blocks';

const PRODUCTION_HOSTS = ['forward.thehope.co'];

interface Frame {
  el: Element;
  block: DesignBlock;
  box: HTMLElement;
  badge: HTMLElement;
}

function start(): void {
  if (PRODUCTION_HOSTS.includes(location.hostname)) return;

  const root = document.createElement('div');
  root.id = 'dsg-root';
  root.setAttribute('popover', 'manual');
  // Inside /compare/ the page is shown scaled down: start with the list closed and the notes larger.
  const framed = window.self !== window.top;
  root.classList.toggle('is-framed', framed);
  const layer = document.createElement('div');
  layer.className = 'dsg-layer';
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

  const frames = new Map<Element, Frame>();
  let filter: 'all' | Priority = 'all';
  let framesOn = true;

  const visible = (b: DesignBlock) => filter === 'all' || b.priority === filter;

  const scan = (): boolean => {
    let changed = false;
    const live = new Set<Element>();
    for (const block of DESIGN_BLOCKS) {
      for (const el of document.querySelectorAll(block.selector)) {
        live.add(el);
        if (frames.has(el)) continue;
        const box = document.createElement('span');
        box.className = `dsg-box dsg-box--${block.priority}`;
        const badge = document.createElement('span');
        badge.className = `dsg-badge dsg-badge--${block.priority}`;
        badge.textContent = `${PRIORITY_LABEL[block.priority]}｜${idsLabel(block.ids)}｜${block.name}`;
        badge.addEventListener('click', () => openSpec(block));
        layer.append(box, badge);
        frames.set(el, { el, block, box, badge });
        changed = true;
      }
    }
    for (const [el, f] of frames) {
      if (live.has(el)) continue;
      f.box.remove();
      f.badge.remove();
      frames.delete(el);
      changed = true;
    }
    return changed;
  };

  const paint = () => {
    // While a modal is open (the result card), the page behind it is dimmed: frame only the modal.
    const modal = document.querySelector('dialog[open]');
    for (const f of frames.values()) {
      const r = f.el.getBoundingClientRect();
      const show = visible(f.block) && (!modal || modal.contains(f.el)) && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
      f.box.hidden = f.badge.hidden = !show;
      if (!show) continue;
      f.box.style.transform = `translate(${r.left}px, ${r.top}px)`;
      f.box.style.width = `${r.width}px`;
      f.box.style.height = `${r.height}px`;
      f.badge.style.transform = `translate(${r.left}px, ${Math.max(r.top, 0)}px)`;
    }
  };

  let queued = false;
  let openDialogs = 0;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const changed = scan();
      // A modal makes everything outside it inert, so the layer lives inside the open modal (its
      // labels stay clickable) and goes back to <body> when the modal closes.
      const modal = document.querySelector('dialog[open]');
      const host = modal ?? document.body;
      const moved = root.parentElement !== host;
      if (moved) host.append(root);
      const dialogs = document.querySelectorAll('dialog[open]').length;
      if (changed || moved || dialogs !== openDialogs) stack();
      openDialogs = dialogs;
      paint();
      renderList();
    });
  };

  // ---- spec drawer ------------------------------------------------------------------------
  const drawer = document.createElement('aside');
  drawer.className = 'dsg-drawer';
  drawer.hidden = true;
  const closeDrawer = () => {
    drawer.hidden = true;
  };
  const showDrawer = (head: HTMLElement, ...parts: HTMLElement[]) => {
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'dsg-drawer__close';
    close.textContent = '關閉';
    close.addEventListener('click', closeDrawer);
    drawer.replaceChildren(close, head, ...parts);
    drawer.scrollTop = 0;
    drawer.hidden = false;
  };
  function openSpec(block: DesignBlock): void {
    const head = document.createElement('div');
    head.className = 'dsg-drawer__head';
    const tag = document.createElement('em');
    tag.className = block.priority;
    tag.textContent = PRIORITY_LABEL[block.priority];
    const title = document.createElement('h3');
    title.textContent = `${idsLabel(block.ids)}　${block.name}`;
    head.append(tag, title);
    const list = document.createElement('ul');
    list.className = 'dsg-drawer__changes';
    for (const line of block.changes) {
      const li = document.createElement('li');
      li.textContent = line;
      list.append(li);
    }
    const intro = document.createElement('h4');
    intro.textContent = '試作版 3 相較原版的調整';
    showDrawer(head, intro, list);
  }

  // ---- panel ------------------------------------------------------------------------------
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'dsg-toggle';
  const panel = document.createElement('div');
  panel.className = 'dsg-panel';
  panel.hidden = framed || innerWidth < 700;
  const head = document.createElement('div');
  head.className = 'dsg-head';
  const note = document.createElement('p');
  note.className = 'dsg-note';
  note.textContent = '紅框＝優先、藍虛線＝選做；標籤上的編號是文字表編號。點框上的標籤或清單項目，右側會簡要列出試作版 3 在該區塊調整了什麼（完整規格見試算表「設計強化規格」）。成果卡與信心宣告要先送出一張卡才會出現。';
  const list = document.createElement('ul');

  const mkBtn = (text: string, pressed: boolean, on: () => void) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.setAttribute('aria-pressed', String(pressed));
    b.addEventListener('click', on);
    return b;
  };
  const filterButtons: Array<[string, 'all' | Priority]> = [['全部', 'all'], ['只看優先', 'p1'], ['只看選做', 'p2']];
  const renderHead = () => {
    head.replaceChildren(
      ...filterButtons.map(([text, value]) =>
        mkBtn(text, filter === value, () => {
          filter = value;
          renderHead();
          schedule();
        }),
      ),
      mkBtn(framesOn ? '隱藏框' : '顯示框', !framesOn, () => {
        framesOn = !framesOn;
        layer.hidden = !framesOn;
        renderHead();
      }),
    );
  };
  const renderList = () => {
    list.replaceChildren(
      ...DESIGN_BLOCKS.filter(visible).map((b) => {
        const li = document.createElement('li');
        const els = [...document.querySelectorAll(b.selector)];
        const tag = document.createElement('em');
        tag.className = b.priority;
        tag.textContent = PRIORITY_LABEL[b.priority];
        const ids = document.createElement('b');
        ids.textContent = idsLabel(b.ids);
        const name = document.createElement('span');
        name.textContent = els.length ? b.name : `${b.name}（${b.hidden ?? '目前不在畫面上'}）`;
        li.append(tag, ids, name);
        li.classList.toggle('is-off', els.length === 0);
        li.addEventListener('click', () => {
          els[0]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          openSpec(b);
        });
        return li;
      }),
    );
  };
  const syncToggle = () => {
    toggle.textContent = panel.hidden ? '設計區塊清單' : '收合清單';
  };
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    syncToggle();
  });
  panel.append(head, note, list);
  layer.after(panel, toggle, drawer);
  syncToggle();
  renderHead();

  scan();
  paint();
  renderList();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  new MutationObserver((records) => {
    if (records.every((r) => root.contains(r.target))) return;
    schedule();
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'class', 'hidden'] });
  new ResizeObserver(schedule).observe(document.body);
}

start();
