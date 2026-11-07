import type { OverlayPage } from './rows';

/**
 * Sheet rows whose text cannot be found by matching (split spans, line breaks, text drawn on a
 * canvas, placeholders): point at the element instead.
 */
const MINISTRY = (id: string, part: string) => `article.ministry[aria-labelledby="ministry-${id}"] ${part}`;

export const TEXT_SELECTORS: Record<number, string> = {
  1: '.site-nav a',
  2: '.site-header__give',
  5: '.journey-rail__item',
  6: '.hero__kv, .hero__more',
  7: '.hero__kv, .hero__series',
  22: '.polaroid-wall',
  32: MINISTRY('building', '.ministry__stats'),
  36: MINISTRY('missions', '.ministry__stats'),
  40: MINISTRY('outreach', '.ministry__stats'),
  44: MINISTRY('online', '.ministry__stats'),
  48: MINISTRY('cities', '.note'),
  52: '.card-result__preview',
  55: 'textarea[placeholder="在這裡寫下你的話…"]',
  57: 'input[placeholder="暱稱或名字"]',
  73: '.card-result__preview',
  96: '.finale__title',
  156: '.site-header img',
  103: '.site-footer__links a',
  113: '.cards-page__title',
  116: '.cards-page__meta a.btn',
  158: '.music-toggle',
  101: '.finale__prayer-link',
};

export interface MediaSpot {
  /** MED code as tracked in the 網頁內容追蹤表 (taken from the GitHub issues that cite it). */
  code: string;
  label: string;
  hint: string;
  page: OverlayPage;
  sel: string;
}

export const MEDIA_SPOTS: MediaSpot[] = [
  { code: 'MED-010／011／030／031', label: '主視覺 KV／Hero', hint: '桌機為無資訊版 KV，手機為另處理的構圖', page: 'home', sel: '.hero__kv' },
  { code: 'MED-001', label: '頁首識別（Logo）', hint: 'THE HOPE Logo', page: 'all', sel: '.site-header img' },
  { code: 'MED-100', label: '頁尾識別（Logo）', hint: '頁尾是否需要獨立 Logo 待確認', page: 'all', sel: '.site-footer img' },
  { code: 'MED-040／043', label: '見證人物肖像／拍立得版型', hint: '目前為合成示意插畫', page: 'home', sel: '.polaroid-wall' },
  { code: 'MED-040', label: '見證彈窗・人物肖像', hint: '彈窗內的人物照片', page: 'home', sel: 'dialog img[alt$="的示意肖像"]' },
  { code: 'MED-041', label: '見證影片', hint: '彈窗內的影片（選填）', page: 'home', sel: 'dialog iframe, dialog video' },
  { code: 'MED-050～055', label: '五大事工圖像', hint: '目前為示意插畫', page: 'home', sel: '.ministry__media' },
  { code: 'MED-073', label: '宣告版外框與 Header 設計', hint: '三種示範配色與外框', page: 'home', sel: '.declarations' },
  { code: 'MED-070／071／073', label: '成果卡圖片（1:1／9:16）', hint: '由網站依使用者輸入產生', page: 'home', sel: '.card-result__preview' },
  { code: 'MED-090', label: 'Prayer Map 按鈕視覺', hint: '目前為文字按鈕，無額外圖示', page: 'home', sel: '.finale__prayer-link' },
];
