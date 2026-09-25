## 變更摘要 (Summary)
<!-- 請用 1-3 句話簡要說明本 PR 完成的功能、修正或重構目標 -->

## 對應規格與 Issue (Linked Story / Issue)
- **對應 Milestone**: M1 / M2 / M3 / M4 <!-- 請填入 -->
- **對應 User Story / FEAT**: <!-- 例如 US-07 / FEAT-08 -->
- **關聯 Issue**: Close #<!-- 請填入 Issue 編號 -->

## 變更範圍 (Scope)
- [ ] 前端 UI / 樣式 / 響應式切版 (`scope:frontend`)
- [ ] 後端 Pages Functions / API (`scope:backend/infra`)
- [ ] D1 資料庫遷移 / Schema 變更
- [ ] 專案治理 / CI 工作流 / 文檔規範

## 驗收標準與自我檢核 (Definition of Done)
- [ ] **代碼質量**: 本地執行 `npm run check`（`typecheck` + `test` + `build`）全數通過，無 Warning / Error
- [ ] **跨裝置響應式**: 以手機 390px 寬度檢視無水平溢出破版、文字無不當遮擋
- [ ] **資安與隱私合規**:
  - [ ] 嚴格未引入任何真實 API Key、Secret、管理 Token 或個人機密
  - [ ] 嚴格未將未經授權之真人姓名、肖像、影音 commit 進 Git 歷史
  - [ ] 卡片資料庫欄位符合資料最小化（嚴格不儲存 IP）
- [ ] **環境適配**: 已確認是否需於 Cloudflare Pages Staging / Production 補齊對應之環境變數

## 畫面截圖 / 驗證錄影 (Screenshots / Recordings)
<!-- 若涉及 UI/UX 變更，請附上前後對照或 390px 實機測試截圖 -->
