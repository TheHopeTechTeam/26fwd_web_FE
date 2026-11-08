/**
 * Design blocks of the home page (`/design/`). One entry per block a front-end designer may
 * strengthen; `ids` are the 編號 of the sheet 「網站文字」 rows that sit in the block, and `changes`
 * lists, briefly, what design trial 3 changed there (size, face, colour, layout, line height). The
 * full specification stays in the sheet tab 「設計強化規格」.
 *
 * `p1` = 優先: Hero, the Respond (write-a-card) area, the result card, plus the page-wide
 * labels, navigation and give buttons. `p2` = 選做: every other block. All values are suggestions.
 */
export type Priority = 'p1' | 'p2';

export interface DesignBlock {
  /** Sheet 編號 without the leading hash, e.g. '6–9' or '27、45–48'; shown through idsLabel(). */
  ids: string;
  name: string;
  priority: Priority;
  selector: string;
  /** Shown in the list while the block is not on screen. */
  hidden?: string;
  /** What design trial 3 changed in this block compared with the live page, one line per kind. */
  changes: string[];
}

const MINISTRY = (id: string) => `article.ministry[aria-labelledby="ministry-${id}"]`;
const LATER = '送出一張卡後才會出現';

export const DESIGN_BLOCKS: DesignBlock[] = [
  {
    ids: "1–4",
    name: "頁首導覽與奉獻按鈕",
    priority: 'p1',
    selector: '.site-header',
    changes: ["字級：導覽 16→15px、字距加寬；「FORWARD 卡」「2026 回應牆」放大", "顏色：導覽改 80% 白", "奉獻按鈕：加 ♥"],
  },
  {
    ids: "5",
    name: "右側旅程導覽",
    priority: 'p1',
    selector: '.journey-rail',
    changes: ["顏色：目前章節加淺金底＋左側金條，其他項目淡化", "字級：英文 11→12px、中文 12→13px"],
  },
  {
    ids: "6–9",
    name: "Hero 文字組合（日期、APPRECIATE／ANTICIPATE）",
    priority: 'p1',
    selector: '.hero__content',
    changes: ["字級：APPRECIATE／ANTICIPATE 44→約 104px（手機 48px）；日期 24→17px、字距加寬；中文說明字重 700→500", "版面：英文與中文改上下排；ANTICIPATE 往右縮排；兩組間距 52px", "行距：英文 0.88、中文 1.95"],
  },
  {
    ids: "15–17",
    name: "感謝・章節標籤、標題、引言",
    priority: 'p1',
    selector: '#appreciate .chapter__head',
    changes: ["字級：標題 60→約 92px；「尋求神的臉。」再放大並加金色螢光筆底；Appreciate 放大；引言 19→18px、字重 500", "版面：引言縮窄並往右移", "行距：標題 1.22→1.14、引言 1.9"],
  },
  {
    ids: "見證影片",
    name: "感謝・見證影片",
    priority: 'p2',
    selector: '.video-playlist',
    changes: ["影片標題：完整顯示，不再截成一行"],
  },
  {
    ids: "22",
    name: "感謝・見證拍立得",
    priority: 'p2',
    selector: '.polaroid-block',
    changes: ["版面：拍立得上下錯位，不再整齊排列", "字級：姓名 16→19px 粗體；引言字重 500→600", "引言完整顯示，不再截斷"],
  },
  {
    ids: "23–25",
    name: "期待・章節標籤、標題、引言",
    priority: 'p1',
    selector: '#anticipate .chapter__head',
    changes: ["版面：標題改三行「FORWARD／是十一之外的／慷慨奉獻。」", "字級：標題約 92px；FORWARD 金色放大；引言內「五大事工」「1%」放大金色", "顏色：修正引言在深底看不到的問題（改 92% 白）"],
  },
  {
    ids: "29–32",
    name: "事工 01 建堂",
    priority: 'p2',
    selector: MINISTRY('building'),
    changes: ["字級：編號 72→144px（半透明）；標題 40→52px；引言開頭詞組放大並改金色；內文 16→17px、字重 500", "數據：第一個數字獨立一行、約 80px 金色；其他數字 56px；說明 13→15px、字重 600", "版面：編號移到標題上方，不再重疊；行距：內文 1.9→1.95"],
  },
  {
    ids: "33–36",
    name: "事工 02 宣教資助",
    priority: 'p2',
    selector: MINISTRY('missions'),
    changes: ["字級：編號 72→144px（半透明）；標題 40→52px；引言開頭詞組放大並改金色；內文 16→17px、字重 500", "數據：第一個數字獨立一行、約 80px 金色；其他數字 56px；說明 13→15px、字重 600", "版面：編號移到標題上方，不再重疊；行距：內文 1.9→1.95"],
  },
  {
    ids: "37–40",
    name: "事工 03 外展與憐憫",
    priority: 'p2',
    selector: MINISTRY('outreach'),
    changes: ["字級：編號 72→144px（半透明）；標題 40→52px；引言開頭詞組放大並改金色；內文 16→17px、字重 500", "數據：第一個數字獨立一行、約 80px 金色；其他數字 56px；說明 13→15px、字重 600", "版面：編號移到標題上方，不再重疊；行距：內文 1.9→1.95"],
  },
  {
    ids: "41–44",
    name: "事工 04 網路宣教",
    priority: 'p2',
    selector: MINISTRY('online'),
    changes: ["字級：編號 72→144px（半透明）；標題 40→52px；引言開頭詞組放大並改金色；內文 16→17px、字重 500", "數據：第一個數字獨立一行、約 80px 金色；其他數字 56px；說明 13→15px、字重 600", "版面：編號移到標題上方，不再重疊；行距：內文 1.9→1.95", "數據：四項中「線上小組」數字獨立放大"],
  },
  {
    ids: "27、45–48",
    name: "事工 05 其他城市分部",
    priority: 'p2',
    selector: MINISTRY('cities'),
    changes: ["字級與版面同其他事工；本區沒有數據"],
  },
  {
    ids: "49–51",
    name: "回應・章節標籤、標題、引言",
    priority: 'p1',
    selector: '#respond .chapter__head',
    changes: ["字級：標題約 92px；「FORWARD 卡」放大金色；引言內「FORWARD 卡」「2026 回應牆」放大", "版面：引言縮窄並往右移"],
  },
  {
    ids: "52–63",
    name: "寫卡表單（FORWARD 卡、兩題、署名）",
    priority: 'p1',
    selector: '.cardform__card',
    changes: ["字級：FORWARD CARD 60→84px；題目 27→30px；英文小標 17→13px、字距加寬", "顏色：英文小標由金色改白色", "版面：第二題往下、往右錯開；提示 15px、字重 500"],
  },
  {
    ids: "64–67",
    name: "寫卡小提醒",
    priority: 'p1',
    selector: '.cardform__guide',
    changes: ["字級：13→15px、字重 500；標題 14px 粗體", "顏色：亮度提高，較易閱讀", "行距：1.85"],
  },
  {
    ids: "83–84",
    name: "同意勾選",
    priority: 'p1',
    selector: '.cardform__consent',
    changes: ["字級：13→15px", "字體：整段粗體改一般字重 500", "連結「隱私與資料說明」加底線"],
  },
  {
    ids: "60、85",
    name: "送出按鈕",
    priority: 'p1',
    selector: '.cardform__submit',
    changes: ["版面：按鈕改滿寬、高 56px", "字級：17→19px"],
  },
  {
    ids: "68–71、77–80",
    name: "成果卡（送出後）",
    priority: 'p1',
    selector: '.card-result', hidden: LATER,
    changes: ["字級：標題 28→36px；「已成功送出」與「恭喜完成」提示縮小", "版面：卡片下方多留 32px 空白", "FORWARD 卡、2026 回應牆放大"],
  },
  {
    ids: "72–76",
    name: "信心宣告選擇（送出後）",
    priority: 'p1',
    selector: '.declarations', hidden: LATER,
    changes: ["字級：主題標題 17→36px；英文小標 14px、字距加寬", "顏色：選中項整列淺金底；未選中淡化", "版面：三項改階梯式縮排"],
  },
  {
    ids: "52–54、73–76",
    name: "成果卡圖片（送出後，1080×1080）",
    priority: 'p1',
    selector: '.card-result__preview', hidden: LATER,
    changes: ["字級：FORWARD CARD 84→72px；宣告句 40→44px（主角）；英文標籤與頁尾 22→18px"],
  },
  {
    ids: "91–94",
    name: "2026 回應牆預覽",
    priority: 'p2',
    selector: '.teaser',
    changes: ["字級：「2026 回應牆」放大；張數 14px", "訪客寫的卡片內容不調整"],
  },
  {
    ids: "95–99",
    name: "奉獻區塊",
    priority: 'p1',
    selector: '.finale',
    changes: ["字級：There is More 66→108px；內文 19→18px", "字體：內文粗體改一般字重 500", "版面：標題第二行懸掛縮排；行距 0.84", "奉獻按鈕：加 ♥"],
  },
  {
    ids: "100–101",
    name: "Prayer Map 連結",
    priority: 'p2',
    selector: '.finale__prayer',
    changes: ["版面：由按鈕改成底線文字連結，讓奉獻按鈕成為唯一主角"],
  },
  {
    ids: "102–106",
    name: "頁尾",
    priority: 'p2',
    selector: '.site-footer',
    changes: ["字級：「2026 回應牆」連結放大；其他不變"],
  },
];


/** '27、45–48' → '#27、#45–#48'. */
export const idsLabel = (ids: string): string => ids.replace(/\d+/g, '\u0023$&');

export const PRIORITY_LABEL: Record<Priority, string> = { p1: '優先', p2: '選做' };
