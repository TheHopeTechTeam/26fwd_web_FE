## 變更摘要 (Summary)
<!-- 請用 1-3 句話簡要說明本 PR 完成的功能、修正或重構目標 -->

## 對應規格與 Milestone (Linked Story / Milestone)
- **對應 Milestone**: M1 (09/30) / M2 (10/05) / M3 (10/10) / M4 (10/31)
- **對應 User Story / FEAT**: <!-- 例如 US-07 / FEAT-08 -->
- **關聯 Issue**: Close #<!-- 請填入 Issue 編號 -->

## 變更範圍 (Scope)
- [ ] 前端 UI / 樣式 / 響應式切版 (`scope:frontend`)
- [ ] 後端 Pages Functions / API (`scope:backend/infra`)
- [ ] D1 資料庫遷移 / Schema 變更
- [ ] 專案治理 / CI 工作流 / 文檔規範

## 現代工程發布檢核 (Definition of Done)

### 1. 代碼與基礎品質 (Core Standards)
- [ ] 本地執行 `npm run check`（`typecheck` + `test` + `build`）全數通過，無 Warning / Error
- [ ] 手機版（390px 實機或 DevTools）檢視無水平溢出破版、文字無不當遮擋
- [ ] 零依賴膨脹（未隨意引入體積龐大的第三方 npm 套件）

### 2. 介面體驗與邊界韌性 (UX & Resilience)
- [ ] 具備完整 UI 狀態處理（按鈕防重複連點 Loading、卡片牆加載骨架屏、斷網或報錯時的友善提示）
- [ ] 彈窗支援鍵盤無障礙（ESC 鍵關閉、焦點自動返回原按鈕）
- [ ] 支援動效降級（開啟「減少動態效果 prefers-reduced-motion」時不會卡住或破版）
- [ ] 極限字數與 Emoji 測試（滿額 140 字及特殊符號在卡片與分享圖上排版正常）

### 3. 資安、隱私與合規 (Security & Privacy)
- [ ] 嚴格未引入真實 API Key、Secret、管理 Token 或個人機密
- [ ] 嚴格未將未經授權之真人姓名、肖像、影音 commit 進 Git 歷史
- [ ] 卡片資料庫符合個資最小化（資料表嚴格不儲存 IP）
- [ ] GA4 數據追蹤僅發送動作事件，嚴格未夾帶卡片內文或訪客暱稱

### 4. 環境與配置 (Environment & Config)
- [ ] 已在對應環境實測過（[ ] 本機 Mock / [ ] 本機 Live / [ ] Cloudflare Preview）
- [ ] 若有新增變數，已同步於 `.env.example` 補齊說明

## 畫面截圖 / 驗證錄影 (Screenshots / Recordings)
<!-- 若涉及 UI/UX 變更，請附上前後對照或 390px 實機測試截圖 -->
