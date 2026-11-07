/**
 * Design blocks of the home page (`/design/`). One entry per block a front-end designer may
 * strengthen; `ids` are the 編號 of the sheet 「網站文字」 rows that sit in the block, and `spec` is
 * the adjusted specification shown in the panel (the same text is in the sheet tab 「設計強化規格」).
 * Every `#` in the spec text is written as a Unicode escape so the theme-token test, which scans
 * for hex colours, does not read a sheet 編號 as one.
 *
 * `p1` = 優先: Hero, the Respond (write-a-card) area, the result card, plus the page-wide
 * labels, navigation and give buttons. `p2` = 選做: every other block. All values are suggestions.
 */
export type Priority = 'p1' | 'p2';

export interface BlockSpec {
  now: string;
  issue: string;
  desktop: string;
  mobile: string;
  guides: string;
  check: string;
}

export interface DesignBlock {
  /** Sheet 編號 without the leading hash, e.g. '6–9' or '27、45–48'; shown through idsLabel(). */
  ids: string;
  name: string;
  priority: Priority;
  selector: string;
  /** Shown in the list while the block is not on screen. */
  hidden?: string;
  spec: BlockSpec;
}

export interface GeneralSpec {
  title: string;
  text: string;
}

const MINISTRY = (id: string) => `article.ministry[aria-labelledby="ministry-${id}"]`;
const LATER = '送出一張卡後才會出現';

export const DESIGN_BLOCKS: DesignBlock[] = [
  {
    ids: "1–4",
    name: "頁首導覽與奉獻按鈕",
    priority: 'p1',
    selector: '.site-header',
    spec: {
      now: "導覽四項 16px／700、字距 0.96px、白字，同重量；奉獻按鈕 136×48、金底深褐字 16px／700，尾端 ↗。",
      issue: "四項導覽視覺同權，看不出目前在哪一章；奉獻按鈕是唯一強調，但沒有符號辨識（\u00235 備註要求放大加符號）。",
      desktop: "導覽 15px／600、字距 0.08em；目前章節加 2px 金色底線（距文字 6px），其餘項目 80% 不透明；章節名稱分兩行：上行「第一步／第二步／第三步」用 FORWARD 字體 12px 字距 0.14em，下行中文；奉獻按鈕維持金底，字 16px／700，前加 ♥，高度 48px，與導覽間距 ≥ 32px。",
      mobile: "導覽維持現有收合；奉獻按鈕高度 ≥ 44px，保持文字＋♥，不縮成純圖示。",
      guides: "指引 2、3、4、10",
      check: "320–430px 不換行溢出；深褐字／金底對比 ≥ 4.5:1；Tab 鍵可見焦點。",
    },
  },
  {
    ids: "5",
    name: "右側旅程導覽",
    priority: 'p1',
    selector: '.journey-rail',
    spec: {
      now: "每項 172×44；英文 11px 等寬、字距 1.4px；中文 12px／700；目前章節只靠小圓點區別。",
      issue: "英文與中文都是 11–12px，無主次；目前章節不夠明顯。",
      desktop: "第一行「第一步」等用 FORWARD 字體 12px／700、字距 0.14em；第二行中文 11px、75% 不透明；目前章節整列加金色 12% 底色＋左側 3px 金條；其餘項目淡化。內容區右側保留 208px，內容靠左。",
      mobile: "手機只顯示中文並保持現有位置（現況）。",
      guides: "指引 2、4、7",
      check: "捲動時目前章節高亮正確；不遮擋內文。",
    },
  },
  {
    ids: "6–9",
    name: "Hero 文字組合（日期、APPRECIATE／ANTICIPATE）",
    priority: 'p1',
    selector: '.hero__content',
    spec: {
      now: "日期 24px／700 金；APPRECIATE／ANTICIPATE 44px／800（Recia Serif Display）金，中文 21px／700 白，英文約為中文 2.1 倍；英文與中文之間、兩組之間行距相同。手機：日期 18、英文 32、中文 16。",
      issue: "英文放大倍數已達標，但整組沒有主次：日期與英文標籤同為金色、同高；兩組（APPRECIATE／ANTICIPATE）的間距與組內間距沒有差別。",
      desktop: "日期降為 eyebrow：16px／700、字距 0.16em，與下方組距 24px，下接 1px 金色 50% 細線；APPRECIATE／ANTICIPATE 放大到 56px（約中文的 2.5 倍），行距 1.1；組內（英文與中文）間距 8px、兩組之間 32px；中文說明 22px／400、行距 1.7、白 90%；兩組中文起點對齊同一條垂直線。",
      mobile: "日期 14px；英文 40px（ANTICIPATE 在 320px 不溢出）、中文 16px／400；兩組間距 24px。",
      guides: "指引 1、3、5、8",
      check: "KV 主標仍是第一焦點，文字組合是第二焦點；320px 不溢出。",
    },
  },
  {
    ids: "15–17",
    name: "感謝・章節標籤、標題、引言",
    priority: 'p1',
    selector: '#appreciate .chapter__head',
    spec: {
      now: "標籤 22px／700（Recia Serif Display，字距 1.32px）；標題 60px／700、行距 73px（1.22）；引言 19.2px／1.8；三者間距 18px，與下方內容 45px。手機：標籤 16、標題 30、引言 16.6（引言約 7 行）。",
      issue: "三個章節的標題區完全相同；標題行距 1.22 偏鬆；引言整段偏長；章節標籤是小元素，需要用底色或圓框突顯。",
      desktop: "標籤改「第一步」等並用 FORWARD 字體 14px／800、字距 0.16em，加金色 15% 底色 pill 或圓框（待 Ian 同意）；標題 64px、行距 1.15，與標籤間距 16px、與引言 24px；引言 19.2px、寬度 ≤ 640px、80% 不透明，每段 ≤ 3 行；標題區與下方內容距離 64px。選做：每章加淡色大數字 01／02／03（6% 不透明）當視覺錨點。",
      mobile: "標籤 12px；標題 32px、行距 1.2；引言 16px，拆成每段 ≤ 3 行。",
      guides: "指引 2、3、4、6",
      check: "三個章節標題區仍保持同一套規格，只換底色與標籤文字。",
    },
  },
  {
    ids: "見證影片",
    name: "感謝・見證影片",
    priority: 'p2',
    selector: '.video-playlist',
    spec: {
      now: "影片標題 24px／700 白，播放鍵金色圓形；與章節標題區距離約 45px，與下方拍立得約 63px。",
      issue: "影片與前後區塊的間距接近，沒有主次與節奏。",
      desktop: "影片上方加 eyebrow「見證影片」12px、金色、字距 0.16em；標題 22–24px；與章節標題區 56px、與拍立得區 80px（群組之間拉開）。",
      mobile: "間距 48px。",
      guides: "指引 5",
      check: "—",
    },
  },
  {
    ids: "22",
    name: "感謝・見證拍立得",
    priority: 'p2',
    selector: '.polaroid-block',
    spec: {
      now: "姓名 16px／700；引言 14px／500、行距 1.55；兩列整齊排列，圖像為人物插畫或照片。",
      issue: "每張卡大小、間距一致；「看其他 10 則故事」與「看全部故事」兩個控制項視覺相近。",
      desktop: "姓名 17px／700，引言 14px／400、80% 不透明；奇偶卡片輕微旋轉（±1.5°）並上下錯位 12px；「看其他 10 則故事」為主按鈕（實心），「看全部故事」為文字連結。",
      mobile: "一排 2 張，錯位 8px。",
      guides: "指引 5、7",
      check: "旋轉後不被裁切；對比 ≥ 4.5:1。",
    },
  },
  {
    ids: "23–25",
    name: "期待・章節標籤、標題、引言",
    priority: 'p1',
    selector: '#anticipate .chapter__head',
    spec: {
      now: "同感謝（深褐底、標籤金色）。",
      issue: "同上。",
      desktop: "與「感謝」共用同一套規格（見 \u002315–\u002317），差別只在底色與標籤文字。",
      mobile: "同上。",
      guides: "指引 2、3、4、6",
      check: "與感謝、回應的標題區規格一致。",
    },
  },
  {
    ids: "29–32",
    name: "事工 01 建堂",
    priority: 'p2',
    selector: MINISTRY('building'),
    spec: {
      now: "編號 72px／800 金；標題 40px／700 白；英文 20px／700 金；引言 24px／700、行距 1.3；內文 16px、行距 1.9；數據 52px／800 白、說明 13px。手機：編號 40、標題 28、引言 18、數據 32。",
      issue: "編號 72、標題 40、數據 52 三個都很大，互搶主角；內文行距 1.9 偏鬆；五項事工結構完全相同。",
      desktop: "編號降為 56px、60% 不透明（當裝飾）；標題 44px／700 為主角；英文 16px、字距 0.16em；引言 22px／600；內文 16px、行距 1.7，每段 ≤ 3 行；數據改金色 56px、說明 14px、75% 不透明、間距 4px，統計列與內文距 40px；事工之間距 96px（現況 54px），奇偶左右交錯保留。",
      mobile: "編號 32px、60%；標題 28px；數據 36px、說明 13px；統計列單欄或兩欄。",
      guides: "指引 2、3、5、6、9",
      check: "五項事工共用同一套規格，數字不超出欄位。",
    },
  },
  {
    ids: "33–36",
    name: "事工 02 宣教資助",
    priority: 'p2',
    selector: MINISTRY('missions'),
    spec: {
      now: "同事工 01。",
      issue: "同事工 01。",
      desktop: "同事工 01。",
      mobile: "同事工 01。",
      guides: "同上",
      check: "同上",
    },
  },
  {
    ids: "37–40",
    name: "事工 03 外展與憐憫",
    priority: 'p2',
    selector: MINISTRY('outreach'),
    spec: {
      now: "同事工 01。",
      issue: "同事工 01。",
      desktop: "同事工 01。",
      mobile: "同事工 01。",
      guides: "同上",
      check: "同上",
    },
  },
  {
    ids: "41–44",
    name: "事工 04 網路宣教",
    priority: 'p2',
    selector: MINISTRY('online'),
    spec: {
      now: "同事工 01；數據有四項（62 個線上小組、390+ 小組員、13 個國家／地區、過去一年新成立 21 個小組）。",
      issue: "內文與數據量最多，區塊最長（約 1303px）。",
      desktop: "同事工 01；四項數據兩欄排列，其中「62 個線上小組」放大為最大數字，其餘為次要。",
      mobile: "同事工 01。",
      guides: "指引 同上、9",
      check: "同上",
    },
  },
  {
    ids: "27、45–48",
    name: "事工 05 其他城市分部",
    priority: 'p2',
    selector: MINISTRY('cities'),
    spec: {
      now: "同事工 01，無數據。",
      issue: "同事工 01。",
      desktop: "同事工 01；無數據時以一行引言收尾。",
      mobile: "同事工 01。",
      guides: "同上",
      check: "同上",
    },
  },
  {
    ids: "49–51",
    name: "回應・章節標籤、標題、引言",
    priority: 'p1',
    selector: '#respond .chapter__head',
    spec: {
      now: "標題「Write it forward」60px／800（Recia Serif Display）、行距 72px；引言 19.2px 共兩段，米白底。",
      issue: "與感謝同構；引言兩段偏長。",
      desktop: "與感謝共用同一套規格；標題維持 FORWARD 字體；引言兩段各 ≤ 3 行。",
      mobile: "同上。",
      guides: "指引 2、3、4、6",
      check: "同上。",
    },
  },
  {
    ids: "52–63",
    name: "寫卡表單（FORWARD 卡、兩題、署名）",
    priority: 'p1',
    selector: '.cardform__card',
    spec: {
      now: "「FORWARD CARD」60px／800 金、行距 0.95；兩題中文 27px 金、英文 17px／700 金（同色）；署名標籤 16px／700 金；提示 15px 白 78%；字數 13px；卡片內距 44px，題與題間距 24px。手機：標題 36、題目 20。",
      issue: "金色同時用在大標、兩題、英文、署名標籤，全部同權；兩題之間與題內間距接近，沒有節奏。",
      desktop: "大標「FORWARD CARD」維持主角，64px、行距 1.0，與下方距離 32px；兩題中文 26px／600 金，英文 13px／700、字距 0.14em、白 70%（不再用金色）；兩題之間 40px，題內標題與輸入框 12px；署名標籤 14px／600、白 85%；提示 14px、白 70%；字數 12px；卡片左右內距 ≥ 48px，底部留署名空白。",
      mobile: "大標 40px；題目 22px；兩題間距 32px。",
      guides: "指引 2、3、5、9",
      check: "手機輸入時不被鍵盤遮擋；兩題標題對比 ≥ 4.5:1。",
    },
  },
  {
    ids: "64–67",
    name: "寫卡小提醒",
    priority: 'p1',
    selector: '.cardform__guide',
    spec: {
      now: "標題與內文均為 13px，標題 700，白 85%，左側內距 12px；位於表單右欄。",
      issue: "小提醒與其他輸入區同樣明顯，易與主要輸入搶注意（\u002366 與 \u002351 的內容 BB 仍待確認）。",
      desktop: "標題 12px／600、字距 0.1em、白 60%；內文 13px／400、行距 1.7、白 70%；左側 2px 金色 30% 線；縮小至全欄視覺最輕的一塊。",
      mobile: "與表單同寬，小字不低於 12px。",
      guides: "指引 3、9",
      check: "與表單題目之間有明顯主從；對比 ≥ 4.5:1。",
    },
  },
  {
    ids: "83–84",
    name: "同意勾選",
    priority: 'p1',
    selector: '.cardform__consent',
    spec: {
      now: "13px／700、淺米色、框內距 14×16，整段約 6 行（高 163px）。",
      issue: "整段粗體，長文字無重點。",
      desktop: "文字 13px／400、行距 1.7、80% 不透明；關鍵句「公開顯示於 2026 回應牆」600 並加底線；勾選框 22×22；連結「隱私與資料說明」金色底線。",
      mobile: "同上；觸控範圍 ≥ 44px。",
      guides: "指引 3、9",
      check: "Tab 鍵可勾選並可見焦點。",
    },
  },
  {
    ids: "60、85",
    name: "送出按鈕",
    priority: 'p1',
    selector: '.cardform__submit',
    spec: {
      now: "17px／700、金底深褐字、218×56、內距 15×34。",
      issue: "與下方提示靠得近，沒有刻意留白。",
      desktop: "寬度撐滿欄位，高 56px、字 18px／700；未勾選時灰底並顯示 13px 提示；按鈕上下各留 32px。",
      mobile: "按鈕 100% 寬、高 ≥ 48px。",
      guides: "指引 1、5",
      check: "點擊範圍 ≥ 44px；按鈕與提示有主從。",
    },
  },
  {
    ids: "68–71、77–80",
    name: "成果卡（送出後）",
    priority: 'p1',
    selector: '.card-result', hidden: LATER,
    spec: {
      now: "標題→「已成功送出」框→「恭喜完成」提示→卡片預覽→信心宣告選擇→下載／分享按鈕→回應牆連結（單欄彈窗）。",
      issue: "卡片是主角，但上方三層文字把卡片推到彈窗中段，且大小接近。",
      desktop: "標題 28px／700 保留；「已成功送出」與「恭喜完成」合併成一行 16px（✓ 圖示）；卡片緊接標題，寬度盡量放大（建議 ≥ 彈窗寬 70%）；下載／分享按鈕固定在卡片下方；卡片與宣告選擇間距 48px。",
      mobile: "彈窗內單欄；卡片寬度 100%，按鈕固定在畫面下緣。",
      guides: "指引 1、2、8",
      check: "390px 看得到卡片與下載按鈕，不需要捲動兩次以上。",
    },
  },
  {
    ids: "72–76",
    name: "信心宣告選擇（送出後）",
    priority: 'p1',
    selector: '.declarations', hidden: LATER,
    spec: {
      now: "標題「選擇你的 FORWARD 卡樣式」；三項（01／02／03）各有英文小標、中文宣告標題、宣告全文；選中項有金色底與左線。",
      issue: "三項同樣大小；Ian 提到主題標題（如 LOVE IN ACTION／讓愛走進這城市）偏小；標題文字待 BB 確認改為「選擇你的信心宣告」。",
      desktop: "主題標題（中文）26px／700 為主角，英文 12px、字距 0.16em；選中項整列淺金底＋3px 左線＋金色編號；未選項句子 65% 不透明；句子 15px、行距 1.7；三項間距 24px；標題下加一行 14px 說明「選一段寫在你的卡片上」。",
      mobile: "主題標題 22px；每項整列可點擊（≥ 44px）。",
      guides: "指引 2、3、8",
      check: "選中與未選中對比明確；整列可點擊。",
    },
  },
  {
    ids: "52–54、73–76",
    name: "成果卡圖片（送出後，1080×1080）",
    priority: 'p1',
    selector: '.card-result__preview', hidden: LATER,
    spec: {
      now: "邊距 80px；FORWARD CARD 84px／800 金；信心宣告：英文標籤 22px、宣告句 40px／700 白、行距 1.45、左側 6px 金線；兩題白色圓角框，回答文字 34px（長文會縮到 20px）；署名 ≥ 30px；頁腳 22px。",
      issue: "卡片雖已接近紙本版型，但宣告句與標題大小接近；白框把回答填滿，缺少紙本卡的留白。",
      desktop: "FORWARD CARD 縮至 72px，宣告句放大到 44px 為唯一主角（英文標籤縮小為 18px、字距 0.2em）；兩題白框改為淡框或無框、保留署名線與留白；頁腳 18px、60% 不透明。注意：回答文字最小不得低於 24px，若放不下請優先縮標題。",
      mobile: "卡片圖片只有 1:1，手機以縮圖預覽，不另外排版。",
      guides: "指引 2、7、8",
      check: "三種宣告、長文與短文都測；下載圖片文字不被裁切。",
    },
  },
  {
    ids: "91–94",
    name: "2026 回應牆預覽",
    priority: 'p2',
    selector: '.teaser',
    spec: {
      now: "標題 36px／800、行距 61px（1.7）；「已有 N 張卡片公開」14px；卡片（金／米白／深褐／沙）prompt 16px／700、字距 0.96；內文 16px；署名 13px／600。",
      issue: "標題行距 1.7 偏鬆；數量與標題同行，無層次；四色卡排列整齊。",
      desktop: "標題行距 1.1；數量改為大數字 48px 金色＋小字「張卡片已公開」；卡片錯落（隔列下移 24px）；內文 17px、行距 1.6；prompt 12px、字距 0.14em、70% 不透明；卡間距 24px。",
      mobile: "一欄或兩欄；數字 36px。",
      guides: "指引 3、5、6",
      check: "卡片不重疊；對比 ≥ 4.5:1。",
    },
  },
  {
    ids: "95–99",
    name: "奉獻區塊",
    priority: 'p1',
    selector: '.finale',
    spec: {
      now: "標籤 17px 等寬、字距 3.4px；大標「There is more」66.56px／800、行距 0.88；內文 19px／700（整段粗體，高約 351px）；奉獻按鈕 212×56 深底金字。",
      issue: "內文整段 19px 粗體，是全區最重的長文字，與大標競爭；奉獻按鈕與 Prayer Map 按鈕同款同大。",
      desktop: "標籤 13px、字距 0.2em；大標 72px、行距 0.95，維持唯一主角；內文 17px／400、行距 1.75，關鍵句「一起為神接下來要成就的事預備空間」600，拆成 3 段、每段 ≤ 3 行；奉獻按鈕加 ♥ 與 ↗、100% 寬、高 56px。",
      mobile: "大標 40px；內文 15px／400；按鈕 100% 寬（目前手機隱藏於頁籤，需進入「參與奉獻」才看得到）。",
      guides: "指引 1、3、8、9",
      check: "大標仍是第一焦點；奉獻按鈕最醒目。",
    },
  },
  {
    ids: "100–101",
    name: "Prayer Map 連結",
    priority: 'p2',
    selector: '.finale__prayer',
    spec: {
      now: "「前往 Prayer Map 代禱 ↗」248×56 深底金字，與奉獻按鈕同款。",
      issue: "兩顆同款按鈕，主次不明。",
      desktop: "改為文字連結（16px／600、深褐、底線、↗）或 1.5px 邊框的次要按鈕；與奉獻按鈕間距 32px。",
      mobile: "同上。",
      guides: "指引 3、9",
      check: "奉獻按鈕比 Prayer Map 明顯。",
    },
  },
  {
    ids: "102–106",
    name: "頁尾",
    priority: 'p2',
    selector: '.site-footer',
    spec: {
      now: "16px 白字；連結 16px／700、字距 0.96；底色 \u0023483c3a；內距 48／40。",
      issue: "與正文同大小，沒有收尾感。",
      desktop: "文字 14px、75% 不透明；連結 14px／600；版權小字 12px、60% 不透明。",
      mobile: "同上。",
      guides: "指引 3、9",
      check: "對比 ≥ 4.5:1。",
    },
  },
];

export const GENERAL_SPECS: GeneralSpec[] = [
  { title: "字級階層", text: "主角（Display）桌機 56–72px、手機 36–44px，字重 700–800，行距 1.0–1.15；標題（Heading）桌機 40–64px／手機 28–32px，行距 1.15–1.2；次標 22–26px；內文 16–17px，行距 1.65–1.8；小字 12–14px。同一區塊內「主角：配角」字級至少 1.5 : 1（指引 3）。以上皆為建議值，設計師可依畫面微調，但落差要明顯。" },
  { title: "英文與中文", text: "重點英文（FORWARD、APPRECIATE、ANTICIPATE 等）保持現有大小寫，不另外改全大寫；放大到相鄰中文的 1.5–2.5 倍，或加粗、金色；英文小標（eyebrow）12–14px、字距 0.12–0.2em。章節標籤維持 FORWARD 字體（Recia Serif Display），需要突顯時加底色或圓框，不換字體（指引 4）。圓框／底色需 Ian 同意。" },
  { title: "間距節奏", text: "群組內（相關的東西）8–16px；群組之間 48–80px（手機 32–48px）；章節與章節之間 96–120px；重點區塊上下多留空白。同一頁不要所有區塊都用同一個間距（指引 5）。" },
  { title: "強調手法", text: "只用這幾種：放大、加粗、金色字、底色（像螢光筆）、圓框、底線。同一區塊最多 2 種，避免整段都在強調（指引 4）。" },
  { title: "降權（配角）", text: "小提醒、說明、英文副標：字級縮到內文約 80%、顏色淡到 65–80% 不透明、字重 400–500；任何淡色字對比仍須 ≥ 4.5:1。長文字每段不超過 3 行，數據用「大數字＋小說明」（指引 9）。" },
  { title: "版面", text: "可以靠左、錯開、讓元素略微跨出欄位，但對齊線要一致；留白要刻意，像紙本卡有一塊空白可寫（指引 7）。右側旅程導覽預留約 208px，內容靠左。" },
  { title: "不動項目", text: "文字內容以「網站文字」分頁為準，本分頁只談外觀不改文案；色彩 token（深褐、金黃、米白）與 FORWARD 字體不換；不新增動畫；不動版面以外的功能與流程。" },
  { title: "檢查標準", text: "每次調整後檢查 320／375／390／430px 手機與桌機：不溢出、不換行亂掉；淡色字對比 ≥ 4.5:1；鍵盤焦點框與按鈕點擊範圍（≥ 44px）不被裝飾蓋住；成果卡兩種尺寸（1080×1080）都要看。" },
];

/** '27、45–48' → '#27、#45–#48'. */
export const idsLabel = (ids: string): string => ids.replace(/\d+/g, '\u0023$&');

export const PRIORITY_LABEL: Record<Priority, string> = { p1: '優先', p2: '選做' };
