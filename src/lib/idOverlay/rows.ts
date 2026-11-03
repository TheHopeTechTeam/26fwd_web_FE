// Generated from the cloud sheet 「FORWARD2026_網站文字表」 (columns 編號 / 頁面 / 區段 / 出現方式 / 位置 /
// 目前文字 / 備註), so reviewers can map a sheet row to the spot on the page. Review aid only (`?ids=1`).
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
}

export const SHEET_ROWS: SheetRow[] = [
 {
  "id": 1,
  "prio": 2,
  "page": "home",
  "section": "頁首導覽",
  "when": "打開就看得到",
  "pos": "導覽連結",
  "text": "感謝 / 期待 / 回應 / 卡片牆 ↗",
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
  "text": "01 Appreciate 感謝 / 02 Anticipate 期待 / 03 Respond 回應",
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
  "text": "感謝過去的信實，\n一起期待未來的更多。",
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
  "text": "01 · Appreciate 感謝",
  "note": ""
 },
 {
  "id": 16,
  "prio": 1,
  "page": "home",
  "section": "01 感謝",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "神的信實，寫在每一張臉上",
  "note": ""
 },
 {
  "id": 17,
  "prio": 1,
  "page": "home",
  "section": "01 感謝",
  "when": "打開就看得到",
  "pos": "引言",
  "text": "七年來，神在一個又一個生命裡留下記號。點開任何一張臉，讀一段故事。",
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
  "text": "Testimony · 見證",
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
  "note": ""
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
  "text": "02 · Anticipate 期待",
  "note": ""
 },
 {
  "id": 24,
  "prio": 1,
  "page": "home",
  "section": "02 期待",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "神要帶我們去的地方",
  "note": ""
 },
 {
  "id": 25,
  "prio": 1,
  "page": "home",
  "section": "02 期待",
  "when": "打開就看得到",
  "pos": "引言",
  "text": "五項事工，是我們一起期待、也一起預備的未來。",
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
  "text": "為更多生命預備空間",
  "note": ""
 },
 {
  "id": 31,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 01",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "七年來，我們在借來與租來的場地裡敬拜。接下來，我們期待一個能承接更多生命的家——讓週間的小組、孩子的主日學與社區服事都有屬於它的位置。每一筆奉獻的使用都會公開透明地交代。",
  "note": ""
 },
 {
  "id": 32,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 01",
  "when": "打開就看得到",
  "pos": "數據（數字 + 說明）",
  "text": "1200+ 每週聚會人次 / 24 週間小組據點",
  "note": "目前為示意數字"
 },
 {
  "id": 33,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 02",
  "when": "打開就看得到",
  "pos": "名稱（中 / 英）",
  "text": "宣教資助 / Missions & Donations",
  "note": ""
 },
 {
  "id": 34,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 02",
  "when": "打開就看得到",
  "pos": "副標題",
  "text": "把福音帶到更遠的地方",
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
  "text": "外展與憐憫事工 / Outreach & Hope Week",
  "note": ""
 },
 {
  "id": 38,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 03",
  "when": "打開就看得到",
  "pos": "副標題",
  "text": "走進社區，成為好鄰舍",
  "note": ""
 },
 {
  "id": 39,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 03",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "透過 Hope Week 與日常的外展服事，我們走進社區陪伴長輩、關心弱勢家庭、支持在地學校。教會存在，是為了成為城市的祝福。",
  "note": ""
 },
 {
  "id": 40,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 03",
  "when": "打開就看得到",
  "pos": "數據（數字 + 說明）",
  "text": "1200+ 服事人次 / 86 合作據點 / 340+ 志工",
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
  "text": "跨越距離的教會",
  "note": ""
 },
 {
  "id": 43,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 04",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "不論在哪個城市、哪個時區，Online Campus 讓更多人能一起敬拜、加入線上小組、被牧養與陪伴。下一步，我們期待觸及更多還沒有教會的人。",
  "note": ""
 },
 {
  "id": 44,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 04",
  "when": "打開就看得到",
  "pos": "數據（數字 + 說明）",
  "text": "520+ 每週線上參與 / 74 觸及城市 / 1800+ 線上小組成員",
  "note": "目前為示意數字"
 },
 {
  "id": 45,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 05",
  "when": "打開就看得到",
  "pos": "名稱（中 / 英）",
  "text": "其他城市分布（暫稱） / Other Cities",
  "note": ""
 },
 {
  "id": 46,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 05",
  "when": "打開就看得到",
  "pos": "副標題",
  "text": "標題待 COMMS 提供",
  "note": ""
 },
 {
  "id": 47,
  "prio": 1,
  "page": "home",
  "section": "02 期待 · 事工 05",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "其他城市分布的介紹文字、照片與數據，待 COMMS 提供後替換（名稱為暫稱）。",
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
  "text": "03 · Respond 回應",
  "note": ""
 },
 {
  "id": 50,
  "prio": 1,
  "page": "home",
  "section": "03 回應",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "Write it forward",
  "note": ""
 },
 {
  "id": 51,
  "prio": 1,
  "page": "home",
  "section": "03 回應",
  "when": "打開就看得到",
  "pos": "引言",
  "text": "寫下一張屬於你的 Forward Card：一句感謝，一個期待。做好的卡片可以下載保存，也可以選擇公開到卡片牆，與全 Hope Nation 分享。",
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
  "text": "我感謝神…",
  "note": "也會印在下載的卡片上"
 },
 {
  "id": 54,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 寫卡表單",
  "when": "網頁＋卡片圖片上",
  "pos": "第二題",
  "text": "跟神一起期待…",
  "note": "也會印在下載的卡片上"
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
  "text": "署名",
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
  "text": "可以用暱稱，不需要真實姓名",
  "note": ""
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
  "text": "製作我的卡片",
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
  "note": "標題／說明"
 },
 {
  "id": 62,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 三步驟",
  "when": "打開就看得到",
  "pos": "步驟 2",
  "text": "製作並保存卡片／選一段信心宣告，下載或分享到社群。",
  "note": "標題／說明"
 },
 {
  "id": 63,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 三步驟",
  "when": "打開就看得到",
  "pos": "步驟 3",
  "text": "決定是否公開／想讓大家一起看見，再公開到卡片牆。",
  "note": "標題／說明"
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
  "note": "⚠️ 若改成所有卡片都送給同工代禱，這句要改"
 },
 {
  "id": 66,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 寫卡小提醒",
  "when": "打開就看得到",
  "pos": "第 1 點",
  "text": "請勿寫下自己或他人的電話、地址、LINE ID 等聯絡方式。",
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
  "note": ""
 },
 {
  "id": 68,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "標籤",
  "text": "Your Card · 你的卡片",
  "note": ""
 },
 {
  "id": 69,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "標題",
  "text": "謝謝你寫下這張卡片！",
  "note": ""
 },
 {
  "id": 70,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "說明",
  "text": "恭喜完成！立即下載專屬 Forward Card 保存，或分享到社群！",
  "note": ""
 },
 {
  "id": 71,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "產生中",
  "text": "產生卡片中…",
  "note": ""
 },
 {
  "id": 72,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 信心宣告",
  "when": "操作後才出現",
  "pos": "選擇區標題",
  "text": "選一段信心宣告",
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
  "text": "向世界走去 / LOVE IN ACTION\n我願意多走一步，把愛與盼望帶進日常。",
  "note": ""
 },
 {
  "id": 75,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 信心宣告",
  "when": "操作後才出現",
  "pos": "宣告：相信還有更多",
  "text": "相信還有更多 / THERE IS MORE\n我相信神的信實，也期待祂要成就的更多。",
  "note": ""
 },
 {
  "id": 76,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 信心宣告",
  "when": "操作後才出現",
  "pos": "宣告：一起成為祝福",
  "text": "一起成為祝福 / HOPE FOR TOMORROW\n我願意與教會同行，讓更多人找到盼望。",
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
  "text": "下載卡片 / 分享",
  "note": ""
 },
 {
  "id": 79,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "下方說明",
  "text": "手機可長按上方圖片儲存到相簿。下載或分享個人卡片，不會公開到卡片牆。",
  "note": ""
 },
 {
  "id": 80,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 你的卡片",
  "when": "操作後才出現",
  "pos": "提示訊息",
  "text": "已下載卡片圖片 / 已開啟分享 / 已複製網站連結 / 無法分享，請改用下載卡片 / 卡片圖片產生失敗，請再試一次",
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
  "note": ""
 },
 {
  "id": 82,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "說明",
  "text": "和大家一起分享你的感謝與期待。不公開也沒關係，你的卡片已經可以下載保存。",
  "note": ""
 },
 {
  "id": 83,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "同意勾選",
  "text": "我同意將這張卡片（署名與兩段內容）公開分享於 FORWARD 網站的卡片牆，並了解卡片需經審核後才會公開。",
  "note": ""
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
  "text": "公開到卡片牆（送出中：送出中…）",
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
  "text": "已送出到卡片牆！",
  "note": ""
 },
 {
  "id": 89,
  "prio": 1,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "送出後說明",
  "text": "卡片會先經過審核，通過後就會出現在 Forward Cards 卡片牆。",
  "note": ""
 },
 {
  "id": 90,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 公開到卡片牆",
  "when": "操作後才出現",
  "pos": "送出後連結",
  "text": "看看大家寫的卡片 →",
  "note": ""
 },
 {
  "id": 91,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 卡片牆預覽",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "Forward Cards",
  "note": ""
 },
 {
  "id": 92,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 卡片牆預覽",
  "when": "打開就看得到",
  "pos": "張數",
  "text": "已有 {N} 張卡片公開",
  "note": "{N} 自動帶入"
 },
 {
  "id": 93,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 卡片牆預覽",
  "when": "打開就看得到",
  "pos": "按鈕",
  "text": "看全部卡片 →",
  "note": ""
 },
 {
  "id": 94,
  "prio": 2,
  "page": "home",
  "section": "03 回應 · 卡片牆預覽",
  "when": "操作後才出現",
  "pos": "沒有卡片時",
  "text": "還沒有公開的卡片，成為第一個寫卡的人！",
  "note": ""
 },
 {
  "id": 95,
  "prio": 1,
  "page": "home",
  "section": "結尾 奉獻",
  "when": "打開就看得到",
  "pos": "小標",
  "text": "FORWARD 2026 · GIVE",
  "note": ""
 },
 {
  "id": 96,
  "prio": 1,
  "page": "home",
  "section": "結尾 奉獻",
  "when": "打開就看得到",
  "pos": "大標",
  "text": "There is more",
  "note": ""
 },
 {
  "id": 97,
  "prio": 1,
  "page": "home",
  "section": "結尾 奉獻",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "透過奉獻，一起為神接下來要成就的事預備空間。你的每一份擺上，都會成為建堂、宣教、外展與網路宣教往前的一步。",
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
  "text": "Forward Cards 卡片牆 / 隱私與資料說明",
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
  "text": "本網站目前為開發預覽版：人物、見證、數據與卡片皆為合成示意內容（synthetic），不代表真實人物或正式數字。",
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
  "text": "感謝過去的信實，一起期待未來的更多。",
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
  "text": "Forward Cards · 卡片牆",
  "note": ""
 },
 {
  "id": 113,
  "prio": 2,
  "page": "cards",
  "section": "標題區",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "Write it forward",
  "note": ""
 },
 {
  "id": 114,
  "prio": 1,
  "page": "cards",
  "section": "標題區",
  "when": "打開就看得到",
  "pos": "引言",
  "text": "全 Hope Nation 寫下的感謝與期待。每一張卡片都經過審核後公開。",
  "note": ""
 },
 {
  "id": 115,
  "prio": 2,
  "page": "cards",
  "section": "標題區",
  "when": "打開就看得到",
  "pos": "張數",
  "text": "已有 {N} 張卡片",
  "note": "{N} 自動帶入"
 },
 {
  "id": 116,
  "prio": 2,
  "page": "cards",
  "section": "標題區",
  "when": "打開就看得到",
  "pos": "按鈕",
  "text": "寫一張卡片",
  "note": ""
 },
 {
  "id": 117,
  "prio": 2,
  "page": "cards",
  "section": "卡片列表",
  "when": "打開就看得到",
  "pos": "按鈕 / 狀態",
  "text": "載入更多 / 載入中… / 已顯示全部卡片 / 重新載入 / 載入失敗",
  "note": ""
 },
 {
  "id": 118,
  "prio": 2,
  "page": "cards",
  "section": "卡片列表",
  "when": "操作後才出現",
  "pos": "沒有卡片時",
  "text": "成為第一個寫卡的人！（按鈕：寫一張 Forward Card）",
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
  "text": "Forward Cards 卡片牆 · FORWARD 2026 | The Hope",
  "note": ""
 },
 {
  "id": 121,
  "prio": 2,
  "page": "cards",
  "section": "搜尋引擎說明",
  "when": "網頁上看不到",
  "pos": "",
  "text": "全 Hope Nation 寫下的感謝與期待：FORWARD 2026 Forward Cards 卡片牆。",
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
  "note": ""
 },
 {
  "id": 123,
  "prio": 1,
  "page": "privacy",
  "section": "標題區",
  "when": "打開就看得到",
  "pos": "標題",
  "text": "Forward Card 隱私與資料說明",
  "note": "整頁文字待 Comms / BB / Online 確認"
 },
 {
  "id": 124,
  "prio": 2,
  "page": "privacy",
  "section": "標題區",
  "when": "預覽版才有（上線拿掉）",
  "pos": "草稿提示（正式版會拿掉）",
  "text": "草稿：本說明的文字、保存期限與聯絡管道仍待 Comms 與負責同工確認，正式上線前會更新。",
  "note": ""
 },
 {
  "id": 125,
  "prio": 1,
  "page": "privacy",
  "section": "寫卡不需要登入",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "你只需要填寫署名（可以是暱稱）和兩段內容。我們不會要求你的真實姓名、電話、Email 或社群帳號。",
  "note": ""
 },
 {
  "id": 126,
  "prio": 2,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格欄位名稱",
  "text": "資料 / 用途 / 誰看得到",
  "note": ""
 },
 {
  "id": 127,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格：署名（暱稱或名字）",
  "text": "資料：署名（暱稱或名字）\n用途：作為卡片署名，不要求真實姓名\n誰看得到：審閱通過後公開；審閱前僅授權審核人員",
  "note": ""
 },
 {
  "id": 128,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格：「我感謝神…」與「跟神一起期待…」內容",
  "text": "資料：「我感謝神…」與「跟神一起期待…」內容\n用途：你想分享的信仰經驗與期待\n誰看得到：審閱通過後公開；審閱前僅授權審核人員",
  "note": ""
 },
 {
  "id": 129,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格：公開分享同意",
  "text": "資料：公開分享同意\n用途：記錄你同意公開這張卡片\n誰看得到：僅系統維運人員",
  "note": ""
 },
 {
  "id": 130,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格：卡片編號與送出時間",
  "text": "資料：卡片編號與送出時間\n用途：排序、顯示「幾小時前」與審核作業\n誰看得到：編號與時間會隨公開卡片顯示",
  "note": ""
 },
 {
  "id": 131,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格：連線 IP 的單向雜湊值",
  "text": "資料：連線 IP 的單向雜湊值\n用途：防止大量灌水（限制同一個網路的送出頻率）；不保存原始 IP，也不與卡片綁定\n誰看得到：僅系統維運人員",
  "note": ""
 },
 {
  "id": 132,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格：匿名送出識別（瀏覽器 cookie）",
  "text": "資料：匿名送出識別（瀏覽器 cookie）\n用途：送出卡片時設定，用來計算同一個瀏覽器的送出頻率，讓共用同一個網路的人各自有額度；不含任何個人資料，網頁程式無法讀取，2 小時後自動失效，也不與卡片綁定\n誰看得到：僅系統維運人員；伺服器只保存它的單向雜湊值",
  "note": ""
 },
 {
  "id": 133,
  "prio": 1,
  "page": "privacy",
  "section": "我們會保存哪些資料",
  "when": "打開就看得到",
  "pos": "表格下方說明",
  "text": "我們不會在你的瀏覽器（localStorage 等）保存卡片內容，也不會把卡片圖片上傳到伺服器；下載的卡片圖片只存在你自己的裝置。",
  "note": ""
 },
 {
  "id": 134,
  "prio": 1,
  "page": "privacy",
  "section": "送出後會發生什麼事",
  "when": "打開就看得到",
  "pos": "第 1 點",
  "text": "只製作、下載或分享卡片時，卡片內容不會送到伺服器；只有你勾選同意並按下「公開到卡片牆」，卡片才會送出。",
  "note": "⚠️ 若改成所有卡片都送給同工代禱，這句要改"
 },
 {
  "id": 135,
  "prio": 1,
  "page": "privacy",
  "section": "送出後會發生什麼事",
  "when": "打開就看得到",
  "pos": "第 2 點",
  "text": "卡片送出後會先進入「待審閱」狀態，審核通過後才會公開在 Forward Cards 卡片牆。",
  "note": ""
 },
 {
  "id": 136,
  "prio": 1,
  "page": "privacy",
  "section": "送出後會發生什麼事",
  "when": "打開就看得到",
  "pos": "第 3 點",
  "text": "內容若包含聯絡方式、他人的私密資訊或與主題無關，可能不會公開。",
  "note": ""
 },
 {
  "id": 137,
  "prio": 1,
  "page": "privacy",
  "section": "送出後會發生什麼事",
  "when": "打開就看得到",
  "pos": "第 4 點",
  "text": "已公開的卡片若被隱藏，只是不再顯示，並不等於資料已刪除。",
  "note": ""
 },
 {
  "id": 138,
  "prio": 1,
  "page": "privacy",
  "section": "送出後會發生什麼事",
  "when": "打開就看得到",
  "pos": "第 5 點",
  "text": "下載或分享你的個人卡片圖片，不代表卡片已經公開。",
  "note": ""
 },
 {
  "id": 139,
  "prio": 1,
  "page": "privacy",
  "section": "保存多久、如何刪除或取回",
  "when": "打開就看得到",
  "pos": "內文",
  "text": "資料的保存期限、刪除方式，以及日後是否能取回自己寫過的卡片，目前仍在討論中（尚未定案）。確定後會更新在這裡，並提供申請管道。",
  "note": "待決定"
 },
 {
  "id": 140,
  "prio": 1,
  "page": "privacy",
  "section": "第三方服務",
  "when": "打開就看得到",
  "pos": "Cloudflare Turnstile",
  "text": "用來確認送出者不是機器人，驗證資料由 Cloudflare 即時處理，本站不保存。",
  "note": ""
 },
 {
  "id": 141,
  "prio": 1,
  "page": "privacy",
  "section": "第三方服務",
  "when": "打開就看得到",
  "pos": "Google Analytics（若啟用）",
  "text": "只用來統計「奉獻按鈕」的點擊次數、製作卡片的次數等整體使用情況，不會傳送你的署名或卡片內容。",
  "note": ""
 },
 {
  "id": 142,
  "prio": 1,
  "page": "privacy",
  "section": "第三方服務",
  "when": "打開就看得到",
  "pos": "Prayer Map",
  "text": "旅程最後的「前往 Prayer Map 代禱」連到外部的 Prayer Map 網站，本站不會把你在這裡填寫的任何資料傳給它。請參考 Prayer Map 隱私權政策。",
  "note": ""
 },
 {
  "id": 143,
  "prio": 1,
  "page": "privacy",
  "section": "第三方服務",
  "when": "打開就看得到",
  "pos": "奉獻頁面",
  "text": "奉獻按鈕會連到教會的奉獻頁面，網址帶有活動追蹤參數（UTM），不包含任何個人資料。",
  "note": ""
 },
 {
  "id": 144,
  "prio": 2,
  "page": "privacy",
  "section": "結尾",
  "when": "打開就看得到",
  "pos": "按鈕",
  "text": "回到寫卡",
  "note": ""
 },
 {
  "id": 145,
  "prio": 2,
  "page": "privacy",
  "section": "瀏覽器分頁標題",
  "when": "網頁上看不到",
  "pos": "",
  "text": "隱私與資料說明 · FORWARD 2026 | The Hope",
  "note": ""
 },
 {
  "id": 146,
  "prio": 2,
  "page": "privacy",
  "section": "搜尋引擎說明",
  "when": "網頁上看不到",
  "pos": "",
  "text": "FORWARD 2026 Forward Card 的資料收集、公開範圍與第三方服務說明。",
  "note": ""
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
  "text": "FORWARD 2026 首頁 / 開啟選單 / 關閉選單 / 關閉 / （在新分頁開啟）/ 旅程章節 / 見證人物 / 開啟 {姓名} 的見證：{引言} / {姓名} 的示意肖像 / {姓名} 的見證影片 / 你的 Forward Card 圖片預覽 / 圖片尺寸 / 寫卡三步驟 / 已輸入字數",
  "note": ""
 }
];
