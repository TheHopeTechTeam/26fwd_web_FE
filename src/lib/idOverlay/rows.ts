// Generated from the cloud sheet 「FORWARD2026_網站文字表」 (columns 編號 / 頁面 / 區段 / 出現方式 / 位置 /
// 目前文字 / 備註), so reviewers can map a sheet row to the spot on the page. Review aid only (`?ids=1`).
// Rows changed by the 11/04 FORWARD 卡 flow and BB's copy carry the wording now on the page.
// This is the offline fallback: `?ids=1` / `?review=1` read the live sheet and use it when reachable.
export type OverlayPage = 'home' | 'cards' | 'privacy' | 'all';

export interface SheetRow {
  id: number;
  prio: number;
  page: OverlayPage;
  section: string;
  when: string;
  pos: string;
  text: string;
  note: string;
  /** 想改成 / 填寫人 / 狀態: only present on rows read live from the sheet. */
  next?: string;
  who?: string;
  status?: string;
  /** 設計建議 (sheet column L): what to change on the page; shown until 狀態 is 已更新. */
  design?: string;
}

export const SHEET_ROWS: SheetRow[] = [
 {
  "id": 1,
  "prio": 2,
  "page": "home",
  "section": "頁首導覽",
  "when": "打開就看得到",
  "pos": "導覽連結",
  "text": "1.感謝 / 2.期待 / 3.填寫 FORWARD 卡 / 4. 2026 回應牆 ↗",
  "note": ""
 },
 {
  "id": 2,
  "prio": 1,
  "page": "home",
  "section": "頁首導覽",
  "when": "打開就看得到",
  "pos": "奉獻按鈕",
  "text": "參與奉獻",
  "note": ""
 },
 {
  "id": 3,
  "prio": 2,
  "page": "home",
  "section": "頁首導覽",
  "when": "預覽版才有（上線拿掉）",
  "pos": "奉獻連結未開放時提示",
  "text": "奉獻連結設定中",
  "note": ""
 },
 {
  "id": 4,
  "prio": 2,
  "page": "home",
  "section": "頁首導覽",
  "when": "預覽版才有（上線拿掉）",
  "pos": "預覽標籤（正式版會拿掉）",
  "text": "SYNTHETIC PREVIEW（滑鼠提示：內容為合成示意資料，非正式上線內容）",
  "note": "正式上線不顯示"
 },
 {
  "id": 5,
  "prio": 1,
  "page": "home",
  "section": "右側旅程導覽",
  "when": "打開就看得到",
  "pos": "章節名稱",
  "text": "01 Appreciate 我感謝神… / 02 Anticipate 一起期待… / 03 Respond 線上 FORWARD 卡",
  "note": "手機只顯示中文"
 },
 {
  "id": 6,
  "prio": 1,
  "page": "home",
  "section": "封面 Hero",
  "when": "打開就看得到",
  "pos": "主標題（手機才看得到，電腦版在 KV 圖裡）",
  "text": "THERE IS MORE",
  "note": ""
 },
 {
  "id": 7,
  "prio": 1,
  "page": "home",
  "section": "封面 Hero",
  "when": "打開就看得到",
  "pos": "系列名稱",
  "text": "2026 FORWARD 系列講道",
  "note": ""
 },
 {
  "id": 8,
  "prio": 1,
  "page": "home",
  "section": "封面 Hero",
  "when": "打開就看得到",
  "pos": "日期",
  "text": "11/14 起",
  "note": ""
 },
 {
  "id": 9,
  "prio": 1,
  "page": "home",
  "section": "封面 Hero",
  "when": "打開就看得到",
  "pos": "引言",
  "text": "APPRECIATE 為神已經成就的獻上感謝\nANTICIPATE 憑著信心 為更多生命與教會所相信的挪出一個空間 參與在祂將要成就的未來",
  "note": "有換行"
 },
 {
  "id": 10,
  "prio": 1,
  "page": "home",
  "section": "封面 Hero",
  "when": "打開就看得到",
  "pos": "按鈕",
  "text": "開始旅程",
  "note": ""
 },
 {
  "id": 11,
  "prio": 2,
  "page": "home",
  "section": "封面 Hero",
  "when": "打開就看得到",
  "pos": "音樂按鈕（未播放）",
  "text": "開啟音樂，在敬拜中走這趟旅程",
  "note": ""
 },
 {
  "id": 12,
  "prio": 2,
  "page": "home",
  "section": "封面 Hero",
  "when": "操作後才出現",
  "pos": "音樂按鈕（播放中）",
  "text": "暫停音樂",
  "note": ""
 },
 {
  "id": 13,
  "prio": 2,
  "page": "home",
  "section": "封面 Hero",
  "when": "操作後才出現",
  "pos": "音樂播放中提示",
  "text": "也可以在右上角 ♪ 隨時開關",
  "note": ""
 },
 {
  "id": 14,
  "prio": 2,
  "page": "home",
  "section": "封面 Hero",
  "when": "操作後才出現",
  "pos": "音樂無法播放",
  "text": "音樂暫時無法播放，再試一次",
  "note": ""
 },
 {
  "id": 15,
  "prio": 1,
  "page": "home",
  "section": "01 感謝",
  "when": "打開就看得到",
  "pos": "章節標籤",
  "text": "01 · Appreciate 2026 我感謝神…",
  "note": ""
 },
 {
  "id": 16,
  "prio": 1,
  "page": "home",
  "section": "01 感謝",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "教會，就是一張張尋求神的臉。",
  "note": ""
 },
 {
  "id": 17,
  "prio": 1,
  "page": "home",
  "section": "01 感謝",
  "when": "打開就看得到",
  "pos": "引言",
  "text": "從你我的一個回應開始，踏出第一步，再下一步。\n我們聚集的地方，就是見證神正在尋找人的地方；我們所在的地方，就是福音正在發生的地方。在跟隨神的路上，讓我們經歷豐盛，也永遠別忘記我們曾對祂說過的 YES！",
  "note": ""
 },
 {
  "id": 18,
  "prio": 2,
  "page": "home",
  "section": "01 感謝",
  "when": "預覽版才有（上線拿掉）",
  "pos": "示意說明（正式版會拿掉）",
  "text": "示意人物為合成插畫與虛構故事（synthetic），正式見證素材與授權待 Online Campus 交付。",
  "note": "正式上線不顯示"
 },
 {
  "id": 19,
  "prio": 2,
  "page": "home",
  "section": "01 感謝",
  "when": "操作後才出現",
  "pos": "見證彈窗標籤",
  "text": "Appreciate 2026 我感謝神…",
  "note": ""
 },
 {
  "id": 20,
  "prio": 2,
  "page": "home",
  "section": "01 感謝",
  "when": "預覽版才有（上線拿掉）",
  "pos": "見證彈窗示意標示（正式版會拿掉）",
  "text": "SYNTHETIC · 合成示意 / 測試影片：Big Buck Bunny（Blender Foundation，CC BY 3.0）",
  "note": "正式上線不顯示"
 },
 {
  "id": 21,
  "prio": 1,
  "page": "home",
  "section": "01 感謝",
  "when": "操作後才出現",
  "pos": "信仰歷程標籤",
  "text": "決志 Decision / 受洗 Baptism / 課程 Equip / 小組 Belong",
  "note": "11/04 依 BB 刪除（不需要分類），頁面上已無這些標籤"
 },
 {
  "id": 22,
  "prio": 1,
  "page": "home",
  "section": "01 感謝",
  "when": "打開就看得到",
  "pos": "見證內容（每位）",
  "text": "姓名、一句引言、完整故事（100–200 字）、影片（選填）",
  "note": "另外提供，不在這張表填"
 },
 {
  "id": 23,
  "prio": 1,
  "page": "home",
  "section": "02 期待",
  "when": "打開就看得到",
  "pos": "章節標籤",
  "text": "02 · Anticipate 2027 我和神一起期待…",
  "note": ""
 },
 {
  "id": 24,
  "prio": 1,
  "page": "home",
  "section": "02 期待",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "FORWARD 是十一之外的慷慨奉獻。",
  "note": ""
 },
 {
  "id": 25,
  "prio": 1,
  "page": "home",
  "section": "02 期待",
  "when": "打開就看得到",
  "pos": "引言",
  "text": "它不只為一個場地，也不是一次性的募款，而是持續支持五大事工。\n每一份給予，都幫助教會接觸人群、帶領更多人認識耶穌，並朝著 The Hope「在我們所到的每個城市，贏得 1% 的人」的異象一起前進。",
  "note": ""
 },
 {
  "id": 26,
  "prio": 2,
  "page": "home",
  "section": "02 期待",
  "when": "預覽版才有（上線拿掉）",
  "pos": "圖片待補標示（正式版會拿掉）",
  "text": "圖像待 COMMS 交付",
  "note": "正式上線不顯示"
 },
 {
  "id": 27,
  "prio": 2,
  "page": "home",
  "section": "02 期待 · 事工 05",
  "when": "預覽版才有（上線拿掉）",
  "pos": "數據待補說明（正式版會拿掉）",
  "text": "城市數據待 COMMS 交付。",
  "note": "拿到數據後就不顯示"
 },
 {
  "id": 28,
  "prio": 2,
  "page": "home",
  "section": "02 期待",
  "when": "預覽版才有（上線拿掉）",
  "pos": "數據說明（正式版會拿掉）",
  "text": "示意數據，正式數字與統計口徑待 COMMS 交付。",
  "note": "正式上線不顯示"
 },
 {
  "id": 29,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 01",
  "when": "打開就看得到",
  "pos": "名稱（中 / 英）",
  "text": "建堂 / Building",
  "note": ""
 },
 {
  "id": 30,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 01",
  "when": "打開就看得到",
  "pos": "副標題",
  "text": "為人預備一個經歷神同在、認識神的空間。",
  "note": ""
 },
 {
  "id": 31,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 01",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "這七年來，我們在不同的場地聚集敬拜，看見一張又一張的臉走進教會、遇見耶穌。接下來，我們期待預備一個能見證更多生命翻轉的家。讓主日、週間小組、孩子的主日學與社區服事都有專屬的空間，並讓一個又一個生命改變的見證，能持續充滿在這個空間。\n因為建堂，不只是為了一個場地，更是為了那些還沒走進來的人，預備一個能遇見耶穌、在基督裡找到榮耀盼望的家。",
  "note": ""
 },
 {
  "id": 32,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 01",
  "when": "打開就看得到",
  "pos": "數據（數字 + 說明）",
  "text": "2500+ 每週聚會人次 / 1200+ 人在這裡受洗 / 4500+ 過去一年，新朋友走進教會",
  "note": "目前為示意數字"
 },
 {
  "id": 33,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 02",
  "when": "打開就看得到",
  "pos": "名稱（中 / 英）",
  "text": "宣教資助 / Missions",
  "note": ""
 },
 {
  "id": 34,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 02",
  "when": "打開就看得到",
  "pos": "副標題",
  "text": "宣教，是你我一起的事。讓福音去到我們到不了的地方。",
  "note": ""
 },
 {
  "id": 35,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 02",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "我們與長期宣教夥伴同行，支持他們在各地的服事與生活，也差派短宣隊實地參與。所有資助項目與使用方式都會定期向會眾報告。",
  "note": ""
 },
 {
  "id": 36,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 02",
  "when": "打開就看得到",
  "pos": "數據（數字 + 說明）",
  "text": "3 個 長期宣教夥伴 / 40+ 短宣隊員",
  "note": "目前為示意數字"
 },
 {
  "id": 37,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 03",
  "when": "打開就看得到",
  "pos": "名稱（中 / 英）",
  "text": "外展憐憫事工 / Outreach & Hope Week",
  "note": ""
 },
 {
  "id": 38,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 03",
  "when": "打開就看得到",
  "pos": "副標題",
  "text": "走出教會與機構合作，建立長久關懷陪伴的關係。",
  "note": ""
 },
 {
  "id": 39,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 03",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "過去一年，我們的長期合作機構增加到 5 個，40 位穩定參與的服事夥伴，持續走進兒少家園、戒癮機構，也走進偏鄉教會與社區，透過陪伴、關懷、營隊、活動與福音行動，持續把教會的愛帶到需要的地方。\n我們在意的，從來不只是「今天做了什麼」，而是「關係有沒有留下來」。\n因為我們相信，當我們願意一次又一次走進人的生命，在一段真實的關係裡，人可以被看見、被陪伴，也有機會遇見神的愛。",
  "note": ""
 },
 {
  "id": 40,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 03",
  "when": "打開就看得到",
  "pos": "數據（數字 + 說明）",
  "text": "500+ 過去四年，服事志工參與在 Hope Week 機構志工服務的外展行動 / 191 位夥伴參與愛心樹禮物認領 / 204+ 人參與我有盼望我捐血的行動",
  "note": "目前為示意數字"
 },
 {
  "id": 41,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 04",
  "when": "打開就看得到",
  "pos": "名稱（中 / 英）",
  "text": "網路宣教 / Online Ministry",
  "note": ""
 },
 {
  "id": 42,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 04",
  "when": "打開就看得到",
  "pos": "副標題",
  "text": "製作福音內容觸及華語群體，打造屬於我們的線上 Hope 主日。",
  "note": ""
 },
 {
  "id": 43,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 04",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "The Hope 持續製作福音內容，線上分部也讓牧養跨越城市，陪伴分散各地的 Hope Nation。這份陪伴不只是在線上 Hope 主日和小組，也延伸到日常之中：我們彼此認識，一起跟隨耶穌。\n高雄、香港、吉隆坡的小組一起舉辦 Watch Party、不同城市的組員也彼此探訪：距離仍在，關係卻走進生活。在這些相聚中，我們一同見證神如何帶領在不同時區的人們，一起敬拜、共同前行。",
  "note": ""
 },
 {
  "id": 44,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 04",
  "when": "打開就看得到",
  "pos": "數據（數字 + 說明）",
  "text": "62 個 線上小組 / 390+ 小組員每週線上參與 / 13 個 國家／地區 / 21 個 過去一年新成立的小組",
  "note": "目前為示意數字"
 },
 {
  "id": 45,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 05",
  "when": "打開就看得到",
  "pos": "名稱（中 / 英）",
  "text": "其他城市分部 / Future Campuses",
  "note": ""
 },
 {
  "id": 46,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 05",
  "when": "打開就看得到",
  "pos": "副標題",
  "text": "一個教會，不同城市。無論在哪裡，都有相同主日體驗。",
  "note": ""
 },
 {
  "id": 47,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 05",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "台中分部，是 The Hope 在另一座城市扎根的第一步，讓人們能在自己的城市參與主日、一起敬拜、聽見神的話。\n我們期待這樣的教會生活，未來也能在更多城市發生：\"One Church, Many Cities\"，雖然每座城市都有不同的人與故事，但都能透過一樣的 Hope 主日體驗，找到同行的群體、實踐信仰，成為城市的盼望。",
  "note": ""
 },
 {
  "id": 48,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 05",
  "when": "打開就看得到",
  "pos": "數據（數字 + 說明）",
  "text": "（待提供）",
  "note": "目前為示意數字"
 },
 {
  "id": 49,
  "prio": 2,
  "page": "home",
  "section": "03 回應",
  "when": "打開就看得到",
  "pos": "章節標籤",
  "text": "03 · Respond 填寫 FORWARD 卡",
  "note": ""
 },
 {
  "id": 50,
  "prio": 1,
  "page": "home",
  "section": "03 回應",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "寫下一張屬於你的 FORWARD 卡",
  "note": ""
 },
 {
  "id": 51,
  "prio": 1,
  "page": "home",
  "section": "03 回應",
  "when": "打開就看得到",
  "pos": "引言",
  "text": "回顧過去一年，你最想為什麼感謝神？\n展望明年，你期待神在哪裡擴張你的信心？你願意如何回應？\n完成後，這張 FORWARD 卡會經過文字審核並公開在 2026 回應牆；你也可以下載保存。讓你的感謝成為別人的鼓勵，也讓我們彼此的信心，一起走向神要成就的更多。",
  "note": ""
 },
 {
  "id": 52,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 寫卡表單",
  "when": "打開就看得到",
  "pos": "卡片上方小字",
  "text": "FORWARD CARD 2026",
  "note": ""
 },
 {
  "id": 53,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 寫卡表單",
  "when": "網頁＋卡片圖片上",
  "pos": "第一題",
  "text": "2026, 我感謝神...",
  "note": "11/04 改為紙本 FORWARD 卡的寫法；也會印在下載的卡片上"
 },
 {
  "id": 54,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 寫卡表單",
  "when": "網頁＋卡片圖片上",
  "pos": "第二題",
  "text": "2027, 跟神一起期待...",
  "note": "11/04 改為紙本 FORWARD 卡的寫法；也會印在下載的卡片上"
 },
 {
  "id": 55,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 寫卡表單",
  "when": "打開就看得到",
  "pos": "輸入框提示",
  "text": "在這裡寫下你的話…",
  "note": ""
 },
 {
  "id": 56,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 寫卡表單",
  "when": "打開就看得到",
  "pos": "署名欄位",
  "text": "你的名稱",
  "note": ""
 },
 {
  "id": 57,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 寫卡表單",
  "when": "打開就看得到",
  "pos": "署名輸入框提示",
  "text": "暱稱或名字",
  "note": ""
 },
 {
  "id": 58,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 寫卡表單",
  "when": "打開就看得到",
  "pos": "署名說明",
  "text": "可填寫暱稱",
  "note": "11/04 刪除，頁面上已無這句"
 },
 {
  "id": 59,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 寫卡表單",
  "when": "操作後才出現",
  "pos": "字數上限提示",
  "text": "已達 {max} 字上限，超出的部分沒有輸入",
  "note": "{max} 會自動換成數字；感謝/期待各 140 字、署名 20 字"
 },
 {
  "id": 60,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 寫卡表單",
  "when": "打開就看得到",
  "pos": "按鈕",
  "text": "分享到 2026 回應牆",
  "note": ""
 },
 {
  "id": 61,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 三步驟",
  "when": "打開就看得到",
  "pos": "步驟 1",
  "text": "寫下感謝與期待／一句感謝，一個向前的期待。",
  "note": "11/04 三步驟改為兩段寫卡引導（APPRECIATE／ANTICIPATE），文字不在這張表"
 },
 {
  "id": 62,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 三步驟",
  "when": "打開就看得到",
  "pos": "步驟 2",
  "text": "分享到回應牆／勾選同意後送出，經過審核就會出現在 2026 回應牆。",
  "note": "11/04 三步驟改為兩段寫卡引導（APPRECIATE／ANTICIPATE），文字不在這張表"
 },
 {
  "id": 63,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 三步驟",
  "when": "打開就看得到",
  "pos": "步驟 3",
  "text": "保存你的 FORWARD 卡／選擇 FORWARD 卡樣式，下載或分享到社群。",
  "note": "11/04 三步驟改為兩段寫卡引導（APPRECIATE／ANTICIPATE），文字不在這張表"
 },
 {
  "id": 64,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 寫卡小提醒",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "寫卡小提醒",
  "note": ""
 },
 {
  "id": 65,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 寫卡小提醒",
  "when": "打開就看得到",
  "pos": "開頭",
  "text": "只下載保存的卡片不會送出；打算公開到卡片牆的話，請留意：",
  "note": "11/04 依 BB 刪除，頁面上已無這句"
 },
 {
  "id": 66,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 寫卡小提醒",
  "when": "打開就看得到",
  "pos": "第 1 點",
  "text": "送出後，你的內容將公開顯示在 2026 回應牆。請勿留下自己或他人的電話、地址、LINE ID 等個人資料；提到家人、孩子、健康或其他私密內容時，也請斟酌描述。",
  "note": ""
 },
 {
  "id": 67,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 寫卡小提醒",
  "when": "打開就看得到",
  "pos": "第 2 點",
  "text": "提到家人、孩子、健康等私密細節時，請斟酌描述。",
  "note": "11/04 已併入 66 的一句話"
 },
 {
  "id": 68,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "標籤",
  "text": "Your Card · 你的 FORWARD 卡",
  "note": ""
 },
 {
  "id": 69,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "標題",
  "text": "謝謝你寫下這張 FORWARD 卡！",
  "note": ""
 },
 {
  "id": 70,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "說明",
  "text": "恭喜完成！立即下載專屬 FORWARD 卡保存，或分享到社群！",
  "note": ""
 },
 {
  "id": 71,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "產生中",
  "text": "產生 FORWARD 卡中…",
  "note": ""
 },
 {
  "id": 72,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 信心宣告",
  "when": "操作後才出現",
  "pos": "選擇區標題",
  "text": "選擇你的 FORWARD 卡樣式",
  "note": ""
 },
 {
  "id": 73,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 信心宣告",
  "when": "卡片圖片上",
  "pos": "卡片上的標籤",
  "text": "信心宣告",
  "note": "印在下載的卡片上"
 },
 {
  "id": 74,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 信心宣告",
  "when": "操作後才出現",
  "pos": "宣告：向世界走去",
  "text": "LOVE IN ACTION\n讓愛走進社區\n我參與 Forward，相信教會要走進更多社區，讓人真實經歷耶穌的愛與盼望。",
  "note": ""
 },
 {
  "id": 75,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 信心宣告",
  "when": "操作後才出現",
  "pos": "宣告：相信還有更多",
  "text": "HOPE WITHOUT BORDERS\n讓福音跨越距離\n我參與 Forward，相信福音要透過網路進入更多城市，找到每一個正在尋找盼望的人。",
  "note": ""
 },
 {
  "id": 76,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 信心宣告",
  "when": "操作後才出現",
  "pos": "宣告：一起成為祝福",
  "text": "ONE CHURCH, MANY CITIES\n在更多城市建立教會的家\n我參與 Forward，相信神要在新的城市預備人、團隊與合適的時機，讓更多人找到教會的家。",
  "note": ""
 },
 {
  "id": 77,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "尺寸選項",
  "text": "貼文 1:1 / 限時動態 9:16",
  "note": ""
 },
 {
  "id": 78,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "按鈕",
  "text": "下載 FORWARD 卡 / 分享",
  "note": ""
 },
 {
  "id": 79,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "下方說明",
  "text": "手機可長按上方圖片儲存到相簿",
  "note": ""
 },
 {
  "id": 80,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "提示訊息",
  "text": "已下載 FORWARD 卡圖片 / 已開啟分享 / 已複製網站連結 / 無法分享，請改用下載 FORWARD 卡 / FORWARD 卡圖片產生失敗，請再試一次",
  "note": ""
 },
 {
  "id": 81,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "標題",
  "text": "也想公開到卡片牆嗎？",
  "note": "11/04 改為寫完即分享，已無這一步"
 },
 {
  "id": 82,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "說明",
  "text": "和大家一起分享你的感謝與期待。不公開也沒關係，你的卡片已經可以下載保存。",
  "note": "11/04 依 BB 刪除，頁面上已無這句"
 },
 {
  "id": 83,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "同意勾選",
  "text": "我了解送出後，這張 FORWARD 卡將經過審核，並公開顯示於 2026 回應牆。我已詳閱並瞭解上述條款，同意 The Hope 教會依上述內容蒐集、處理及利用我的個人資料。",
  "note": "11/04 後半句為法務條款第 10 點原文"
 },
 {
  "id": 84,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "同意旁連結",
  "text": "隱私與資料說明",
  "note": ""
 },
 {
  "id": 85,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "按鈕",
  "text": "分享到 2026 回應牆（送出中：送出中…）",
  "note": ""
 },
 {
  "id": 86,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "未勾選提示",
  "text": "勾選同意後即可送出",
  "note": ""
 },
 {
  "id": 87,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "人機驗證提示",
  "text": "請先完成上方的人機驗證。",
  "note": ""
 },
 {
  "id": 88,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "送出後標題",
  "text": "已成功送出！",
  "note": ""
 },
 {
  "id": 89,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "送出後說明",
  "text": "每一份 FORWARD 卡都會先經過文字審核，通過後就會出現在 2026 回應牆。",
  "note": ""
 },
 {
  "id": 90,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "送出後連結",
  "text": "看看大家寫的 FORWARD 卡 →",
  "note": ""
 },
 {
  "id": 91,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 卡片牆預覽",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "2026 回應牆",
  "note": ""
 },
 {
  "id": 92,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 卡片牆預覽",
  "when": "打開就看得到",
  "pos": "張數",
  "text": "已有 {N} 張 FORWARD 卡公開",
  "note": "{N} 自動帶入"
 },
 {
  "id": 93,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 卡片牆預覽",
  "when": "打開就看得到",
  "pos": "按鈕",
  "text": "看全部 FORWARD 卡 →",
  "note": ""
 },
 {
  "id": 94,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 卡片牆預覽",
  "when": "操作後才出現",
  "pos": "沒有卡片時",
  "text": "還沒有公開的 FORWARD 卡，成為第一個寫卡的人！",
  "note": ""
 },
 {
  "id": 95,
  "prio": 1,
  "page": "home",
  "section": "結尾 奉獻",
  "when": "打開就看得到",
  "pos": "小標",
  "text": "YEAR END FORWARD 2026",
  "note": ""
 },
 {
  "id": 96,
  "prio": 1,
  "page": "home",
  "section": "結尾 奉獻",
  "when": "打開就看得到",
  "pos": "大標",
  "text": "There is More",
  "note": ""
 },
 {
  "id": 97,
  "prio": 1,
  "page": "home",
  "section": "結尾 奉獻",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "我們能給予，是因為神先慷慨地將恩典、赦免與耶穌賜給了我們。真正的慷慨，不是因為我們「擁有很多」，而是深知自己已經「領受極多」。\n每一次的給予，都是用行動回應神的愛，讓更多人經歷這份盼望。",
  "note": ""
 },
 {
  "id": 98,
  "prio": 1,
  "page": "home",
  "section": "結尾 奉獻",
  "when": "打開就看得到",
  "pos": "奉獻按鈕",
  "text": "參與 FORWARD 奉獻",
  "note": ""
 },
 {
  "id": 99,
  "prio": 2,
  "page": "home",
  "section": "結尾 奉獻",
  "when": "預覽版才有（上線拿掉）",
  "pos": "連結未開放提示",
  "text": "奉獻連結設定中，正式開放後即可使用。",
  "note": "拿到奉獻網址後就不顯示"
 },
 {
  "id": 100,
  "prio": 1,
  "page": "home",
  "section": "結尾 Prayer Map",
  "when": "打開就看得到",
  "pos": "引言",
  "text": "也想為城市與彼此禱告？",
  "note": ""
 },
 {
  "id": 101,
  "prio": 1,
  "page": "home",
  "section": "結尾 Prayer Map",
  "when": "打開就看得到",
  "pos": "按鈕",
  "text": "前往 Prayer Map 代禱 ↗",
  "note": ""
 },
 {
  "id": 102,
  "prio": 2,
  "page": "all",
  "section": "頁尾",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "FORWARD · There is more",
  "note": ""
 },
 {
  "id": 103,
  "prio": 2,
  "page": "all",
  "section": "頁尾",
  "when": "打開就看得到",
  "pos": "連結",
  "text": "2026 回應牆 / 隱私與資料說明",
  "note": ""
 },
 {
  "id": 104,
  "prio": 1,
  "page": "all",
  "section": "頁尾",
  "when": "打開就看得到",
  "pos": "音樂來源",
  "text": "背景音樂：{曲名}・{演出者}。{說明} 授權：{授權}・來源說明",
  "note": "正式曲目確定後替換"
 },
 {
  "id": 105,
  "prio": 2,
  "page": "all",
  "section": "頁尾",
  "when": "預覽版才有（上線拿掉）",
  "pos": "目前測試音樂資訊（正式版會換掉）",
  "text": "Still Waters・FORWARD Synth Lab（測試音訊）。測試音樂為本專案自製的合成曲目，正式選曲與授權待 COMMS 確認。授權：CC0（本專案自製）",
  "note": "請提供正式曲名、演出者、授權"
 },
 {
  "id": 106,
  "prio": 2,
  "page": "all",
  "section": "頁尾",
  "when": "預覽版才有（上線拿掉）",
  "pos": "預覽說明（正式版會拿掉）",
  "text": "本網站目前為開發預覽版：人物、見證、數據與 FORWARD 卡皆為合成示意內容（synthetic），不代表真實人物或正式數字。",
  "note": "正式上線不顯示"
 },
 {
  "id": 107,
  "prio": 1,
  "page": "all",
  "section": "分享預覽（LINE / FB 貼連結時）",
  "when": "網頁上看不到",
  "pos": "標題",
  "text": "FORWARD 2026 · There is more",
  "note": ""
 },
 {
  "id": 108,
  "prio": 1,
  "page": "all",
  "section": "分享預覽（LINE / FB 貼連結時）",
  "when": "網頁上看不到",
  "pos": "說明",
  "text": "APPRECIATE 為神已經成就的獻上感謝 ANTICIPATE 憑著信心，為更多生命與教會所相信的挪出一個空間，參與在祂將要成就的未來",
  "note": ""
 },
 {
  "id": 109,
  "prio": 2,
  "page": "all",
  "section": "瀏覽器分頁標題",
  "when": "網頁上看不到",
  "pos": "首頁",
  "text": "FORWARD 2026 · There is more | The Hope",
  "note": ""
 },
 {
  "id": 110,
  "prio": 1,
  "page": "all",
  "section": "搜尋引擎說明",
  "when": "網頁上看不到",
  "pos": "首頁",
  "text": "The Hope 2026 FORWARD 線上數位展覽：感謝過去的信實，一起期待未來的更多。",
  "note": ""
 },
 {
  "id": 111,
  "prio": 2,
  "page": "cards",
  "section": "頁首",
  "when": "打開就看得到",
  "pos": "返回連結",
  "text": "← 回到 FORWARD",
  "note": ""
 },
 {
  "id": 112,
  "prio": 2,
  "page": "cards",
  "section": "標題區",
  "when": "打開就看得到",
  "pos": "標籤",
  "text": "2026 回應牆",
  "note": "11/04 拿掉小標，大標直接用 2026 回應牆"
 },
 {
  "id": 113,
  "prio": 2,
  "page": "cards",
  "section": "標題區",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "2026 回應牆",
  "note": "11/04 大標改為 2026 回應牆（原 Write it forward）"
 },
 {
  "id": 114,
  "prio": 1,
  "page": "cards",
  "section": "標題區",
  "when": "打開就看得到",
  "pos": "引言",
  "text": "在這面回應牆上，看見 The Hope 家人一張張真實的感謝與期待。讓彼此的故事成為鼓勵，也打開我們對未來的想像，一起相信神還要成就更多。",
  "note": ""
 },
 {
  "id": 115,
  "prio": 2,
  "page": "cards",
  "section": "標題區",
  "when": "打開就看得到",
  "pos": "張數",
  "text": "已有 {N} 張 FORWARD 卡",
  "note": "{N} 自動帶入"
 },
 {
  "id": 116,
  "prio": 2,
  "page": "cards",
  "section": "標題區",
  "when": "打開就看得到",
  "pos": "按鈕",
  "text": "寫一張 FORWARD 卡",
  "note": ""
 },
 {
  "id": 117,
  "prio": 2,
  "page": "cards",
  "section": "卡片列表",
  "when": "打開就看得到",
  "pos": "按鈕 / 狀態",
  "text": "載入更多 / 載入中… / 已顯示全部 FORWARD 卡 / 重新載入 / 載入失敗",
  "note": ""
 },
 {
  "id": 118,
  "prio": 2,
  "page": "cards",
  "section": "卡片列表",
  "when": "操作後才出現",
  "pos": "沒有卡片時",
  "text": "成為第一個寫卡的人！（按鈕：寫一張 FORWARD 卡）",
  "note": ""
 },
 {
  "id": 119,
  "prio": 2,
  "page": "cards",
  "section": "卡片",
  "when": "打開就看得到",
  "pos": "時間顯示",
  "text": "剛剛 / 5 分鐘前 / 2 小時前 / 昨天 / 3 天前",
  "note": "自動產生"
 },
 {
  "id": 120,
  "prio": 2,
  "page": "cards",
  "section": "瀏覽器分頁標題",
  "when": "網頁上看不到",
  "pos": "",
  "text": "2026 回應牆 · FORWARD 2026 | The Hope",
  "note": ""
 },
 {
  "id": 121,
  "prio": 2,
  "page": "cards",
  "section": "搜尋引擎說明",
  "when": "網頁上看不到",
  "pos": "",
  "text": "全 Hope Nation 寫下的感謝與期待：FORWARD 2026 回應牆。",
  "note": ""
 },
 {
  "id": 122,
  "prio": 2,
  "page": "privacy",
  "section": "標題區",
  "when": "打開就看得到",
  "pos": "標籤",
  "text": "Privacy · 隱私與資料說明",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 123,
  "prio": 1,
  "page": "privacy",
  "section": "標題區",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "Forward Card 隱私與資料說明",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 124,
  "prio": 2,
  "page": "privacy",
  "section": "標題區",
  "when": "預覽版才有（上線拿掉）",
  "pos": "草稿提示（正式版會拿掉）",
  "text": "草稿：本說明的文字、保存期限與聯絡管道仍待 Comms 與負責同工確認，正式上線前會更新。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 125,
  "prio": 1,
  "page": "privacy",
  "section": "寫卡不需要登入",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "你只需要填寫署名（可以是暱稱）和兩段內容。我們不會要求你的真實姓名、電話、Email 或社群帳號。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 126,
  "prio": 2,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格欄位名稱",
  "text": "資料 / 用途 / 誰看得到",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 127,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格：署名（暱稱或名字）",
  "text": "資料：署名（暱稱或名字）\n用途：作為卡片署名，不要求真實姓名\n誰看得到：審閱通過後公開；審閱前僅授權審核人員",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 128,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格：「我感謝神…」與「跟神一起期待…」內容",
  "text": "資料：「我感謝神…」與「跟神一起期待…」內容\n用途：你想分享的信仰經驗與期待\n誰看得到：審閱通過後公開；審閱前僅授權審核人員",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 129,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格：公開分享同意",
  "text": "資料：公開分享同意\n用途：記錄你同意公開這張卡片\n誰看得到：僅系統維運人員",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 130,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格：卡片編號與送出時間",
  "text": "資料：卡片編號與送出時間\n用途：排序、顯示「幾小時前」與審核作業\n誰看得到：編號與時間會隨公開卡片顯示",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 131,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格：連線 IP 的單向雜湊值",
  "text": "資料：連線 IP 的單向雜湊值\n用途：防止大量灌水（限制同一個網路的送出頻率）；不保存原始 IP，也不與卡片綁定\n誰看得到：僅系統維運人員",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 132,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格：匿名送出識別（瀏覽器 cookie）",
  "text": "資料：匿名送出識別（瀏覽器 cookie）\n用途：送出卡片時設定，用來計算同一個瀏覽器的送出頻率，讓共用同一個網路的人各自有額度；不含任何個人資料，網頁程式無法讀取，2 小時後自動失效，也不與卡片綁定\n誰看得到：僅系統維運人員；伺服器只保存它的單向雜湊值",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 133,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格下方說明",
  "text": "我們不會在你的瀏覽器（localStorage 等）保存卡片內容，也不會把卡片圖片上傳到伺服器；下載的卡片圖片只存在你自己的裝置。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 134,
  "prio": 1,
  "page": "privacy",
  "section": "送出後會發生什麼事",
  "when": "打開就看得到",
  "pos": "第 1 點",
  "text": "只製作、下載或分享卡片時，卡片內容不會送到伺服器；只有你勾選同意並按下「公開到卡片牆」，卡片才會送出。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 135,
  "prio": 1,
  "page": "privacy",
  "section": "送出後會發生什麼事",
  "when": "打開就看得到",
  "pos": "第 2 點",
  "text": "卡片送出後會先進入「待審閱」狀態，審核通過後才會公開在 Forward Cards 卡片牆。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 136,
  "prio": 1,
  "page": "privacy",
  "section": "送出後會發生什麼事",
  "when": "打開就看得到",
  "pos": "第 3 點",
  "text": "內容若包含聯絡方式、他人的私密資訊或與主題無關，可能不會公開。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 137,
  "prio": 1,
  "page": "privacy",
  "section": "送出後會發生什麼事",
  "when": "打開就看得到",
  "pos": "第 4 點",
  "text": "已公開的卡片若被隱藏，只是不再顯示，並不等於資料已刪除。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 138,
  "prio": 1,
  "page": "privacy",
  "section": "送出後會發生什麼事",
  "when": "打開就看得到",
  "pos": "第 5 點",
  "text": "下載或分享你的個人卡片圖片，不代表卡片已經公開。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 139,
  "prio": 1,
  "page": "privacy",
  "section": "保存多久、如何刪除或取回",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "資料的保存期限、刪除方式，以及日後是否能取回自己寫過的卡片，目前仍在討論中（尚未定案）。確定後會更新在這裡，並提供申請管道。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 140,
  "prio": 1,
  "page": "privacy",
  "section": "第三方服務",
  "when": "打開就看得到",
  "pos": "Cloudflare Turnstile",
  "text": "用來確認送出者不是機器人，驗證資料由 Cloudflare 即時處理，本站不保存。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 141,
  "prio": 1,
  "page": "privacy",
  "section": "第三方服務",
  "when": "打開就看得到",
  "pos": "Google Analytics（若啟用）",
  "text": "只用來統計「奉獻按鈕」的點擊次數、製作卡片的次數等整體使用情況，不會傳送你的署名或卡片內容。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 142,
  "prio": 1,
  "page": "privacy",
  "section": "第三方服務",
  "when": "打開就看得到",
  "pos": "Prayer Map",
  "text": "旅程最後的「前往 Prayer Map 代禱」連到外部的 Prayer Map 網站，本站不會把你在這裡填寫的任何資料傳給它。請參考 Prayer Map 隱私權政策。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 143,
  "prio": 1,
  "page": "privacy",
  "section": "第三方服務",
  "when": "打開就看得到",
  "pos": "奉獻頁面",
  "text": "奉獻按鈕會連到教會的奉獻頁面，網址帶有活動追蹤參數（UTM），不包含任何個人資料。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 144,
  "prio": 2,
  "page": "privacy",
  "section": "結尾",
  "when": "打開就看得到",
  "pos": "按鈕",
  "text": "回到寫卡",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 145,
  "prio": 2,
  "page": "privacy",
  "section": "瀏覽器分頁標題",
  "when": "網頁上看不到",
  "pos": "",
  "text": "隱私與資料說明 · FORWARD 2026 | The Hope",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 146,
  "prio": 2,
  "page": "privacy",
  "section": "搜尋引擎說明",
  "when": "網頁上看不到",
  "pos": "",
  "text": "FORWARD 2026 Forward Card 的資料收集、公開範圍與第三方服務說明。",
  "note": "11/04 隱私頁改為法務條款全文（The Hope 教會個人資料使用與隱私政策同意條款），這列的舊文字已不在頁面上"
 },
 {
  "id": 147,
  "prio": 1,
  "page": "all",
  "section": "錯誤訊息",
  "when": "操作後才出現",
  "pos": "欄位檢查",
  "text": "這一欄還沒填寫 / 超過字數上限 / 含有無法使用的特殊字元",
  "note": ""
 },
 {
  "id": 148,
  "prio": 1,
  "page": "all",
  "section": "錯誤訊息",
  "when": "操作後才出現",
  "pos": "送出失敗",
  "text": "發送太頻繁，請稍後再試。／格式錯誤，請檢查欄位內容後再送出。／人機驗證未通過，請重新驗證後再送出。／無法完成送出驗證，請確認瀏覽器允許 Cookie 後再試一次。／網路連線不穩定，請確認網路後再試一次。／服務暫時無法使用，請稍後再試。／系統暫時發生問題，請稍後再試。／發生未預期的錯誤，請稍後再試。",
  "note": ""
 },
 {
  "id": 149,
  "prio": 2,
  "page": "all",
  "section": "瀏覽器未開 JavaScript 時",
  "when": "網頁上看不到",
  "pos": "提示",
  "text": "請開啟 JavaScript 以瀏覽 FORWARD 2026 網站。",
  "note": ""
 },
 {
  "id": 150,
  "prio": 2,
  "page": "all",
  "section": "滑鼠提示 / 讀屏文字",
  "when": "網頁上看不到",
  "pos": "右上角音樂按鈕（滑鼠移上去會看到）",
  "text": "播放背景音樂：{曲名} / 暫停背景音樂：{曲名} / 背景音樂暫時無法播放，再試一次：{曲名}",
  "note": "一般不會看到，讀屏軟體會唸"
 },
 {
  "id": 151,
  "prio": 2,
  "page": "all",
  "section": "滑鼠提示 / 讀屏文字",
  "when": "網頁上看不到",
  "pos": "鍵盤跳過連結",
  "text": "跳到主要內容",
  "note": "用 Tab 鍵時才會出現"
 },
 {
  "id": 152,
  "prio": 2,
  "page": "all",
  "section": "滑鼠提示 / 讀屏文字",
  "when": "網頁上看不到",
  "pos": "其他讀屏文字",
  "text": "FORWARD 2026 首頁 / 開啟選單 / 關閉選單 / 關閉 / （在新分頁開啟）/ 旅程章節 / 見證人物 / 開啟 {姓名} 的見證：{引言} / {姓名} 的示意肖像 / {姓名} 的見證影片 / 你的 FORWARD 卡圖片預覽 / 圖片尺寸 / 寫卡三步驟 / 已輸入字數",
  "note": ""
 },
 {
  "id": 153,
  "prio": 1,
  "page": "privacy",
  "section": "FORWARD 網站說明",
  "when": "打開就看得到",
  "pos": "第一點之後新增",
  "text": "",
  "note": "請 BB 審閱"
 },
 {
  "id": 154,
  "prio": 1,
  "page": "privacy",
  "section": "教會隱私條款",
  "when": "打開就看得到",
  "pos": "6.2 回覆日數",
  "text": "",
  "note": "BB 要求改為 7 日內"
 },
 {
  "id": 155,
  "prio": 1,
  "page": "privacy",
  "section": "教會隱私條款",
  "when": "打開就看得到",
  "pos": "帳戶綁定等字句",
  "text": "",
  "note": "與 FORWARD 不一致，請 BB 與法務確認"
 },
 {
  "id": 156,
  "prio": 1,
  "page": "all",
  "section": "頁首",
  "when": "打開就看得到",
  "pos": "Logo（THE HOPE）",
  "text": "THE HOPE Logo",
  "note": ""
 },
 {
  "id": 157,
  "prio": 1,
  "page": "privacy",
  "section": "FORWARD 網站說明",
  "when": "打開就看得到",
  "pos": "第 1 點",
  "text": "你送出 FORWARD 卡時，我們會保存你填寫的名稱、兩段內容、你勾選的同意紀錄與送出時間。內容經過文字審核後，會公開顯示在 Hope Nation 回應牆。",
  "note": ""
 },
 {
  "id": 158,
  "prio": 1,
  "page": "all",
  "section": "頁首",
  "when": "打開就看得到",
  "pos": "背景音樂開關（♪）",
  "text": "♪",
  "note": "不放音樂，拿掉（11/05）"
 }
];
