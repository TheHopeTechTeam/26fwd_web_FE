/**
 * Design blocks of the home page (`/design/`). One entry per block a front-end designer may
 * strengthen; `ids` are the 編號 of the sheet 「網站文字」 rows that sit in the block, so the
 * frame and the spec in the sheet tab 「設計強化規格」 can be matched by number.
 *
 * `p1` = 優先: Hero, the Respond (write-a-card) area, the result card, plus the page-wide
 * labels, navigation and give buttons. `p2` = 選做: every other block.
 */
export type Priority = 'p1' | 'p2';

export interface DesignBlock {
  /** Sheet 編號 without the leading #, e.g. '6–9' or '27、45–48'; shown through idsLabel(). */
  ids: string;
  name: string;
  priority: Priority;
  selector: string;
  /** Shown in the list while the block is not on screen. */
  hidden?: string;
}

const MINISTRY = (id: string) => `article.ministry[aria-labelledby="ministry-${id}"]`;

export const DESIGN_BLOCKS: DesignBlock[] = [
  { ids: '1–4', name: '頁首導覽與奉獻按鈕', priority: 'p1', selector: '.site-header' },
  { ids: '5', name: '右側旅程導覽', priority: 'p1', selector: '.journey-rail' },
  { ids: '6–9', name: 'Hero 文字組合（日期、APPRECIATE／ANTICIPATE）', priority: 'p1', selector: '.hero__content' },
  { ids: '15–17', name: '感謝・章節標籤、標題、引言', priority: 'p1', selector: '#appreciate .chapter__head' },
  { ids: '見證影片', name: '感謝・見證影片', priority: 'p2', selector: '.video-playlist' },
  { ids: '22', name: '感謝・見證拍立得', priority: 'p2', selector: '.polaroid-block' },
  { ids: '23–25', name: '期待・章節標籤、標題、引言', priority: 'p1', selector: '#anticipate .chapter__head' },
  { ids: '29–32', name: '事工 01 建堂', priority: 'p2', selector: MINISTRY('building') },
  { ids: '33–36', name: '事工 02 宣教資助', priority: 'p2', selector: MINISTRY('missions') },
  { ids: '37–40', name: '事工 03 外展與憐憫', priority: 'p2', selector: MINISTRY('outreach') },
  { ids: '41–44', name: '事工 04 網路宣教', priority: 'p2', selector: MINISTRY('online') },
  { ids: '27、45–48', name: '事工 05 其他城市分部', priority: 'p2', selector: MINISTRY('cities') },
  { ids: '49–51', name: '回應・章節標籤、標題、引言', priority: 'p1', selector: '#respond .chapter__head' },
  { ids: '52–63', name: '寫卡表單（FORWARD 卡、兩題、署名）', priority: 'p1', selector: '.cardform__card' },
  { ids: '64–67', name: '寫卡小提醒', priority: 'p1', selector: '.cardform__guide' },
  { ids: '83–84', name: '同意勾選', priority: 'p1', selector: '.cardform__consent' },
  { ids: '60、85', name: '送出按鈕', priority: 'p1', selector: '.cardform__submit' },
  { ids: '68–71、77–80', name: '成果卡（送出後）', priority: 'p1', selector: '.card-result', hidden: '送出一張卡後才會出現' },
  { ids: '72–76', name: '信心宣告選擇（送出後）', priority: 'p1', selector: '.declarations', hidden: '送出一張卡後才會出現' },
  { ids: '91–94', name: '2026 回應牆預覽', priority: 'p2', selector: '.teaser' },
  { ids: '95–99', name: '奉獻區塊', priority: 'p1', selector: '.finale' },
  { ids: '100–101', name: 'Prayer Map 連結', priority: 'p2', selector: '.finale__prayer' },
  { ids: '102–106', name: '頁尾', priority: 'p2', selector: '.site-footer' },
];

/** '27、45–48' → '#27、#45–#48'. */
export const idsLabel = (ids: string): string => ids.replace(/\d+/g, '#$&');

export const PRIORITY_LABEL: Record<Priority, string> = { p1: '優先', p2: '選做' };
