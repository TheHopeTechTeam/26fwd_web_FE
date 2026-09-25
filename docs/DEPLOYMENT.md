# FORWARD 2026｜測試環境（Staging）與正式環境（Production）部署與環境治理規劃

本文件為 **FORWARD 2026 Campaign 網站** 於 GitHub 與 Cloudflare Pages 之雙環境部署規範，落實開發測試隔離、資料最小化與上線安全。

---

## 一、雙環境架構概覽 (Overview)

```
                       [開發者分支 PR]
                              │
                              ▼ (自動觸發 PR Preview)
                    ┌───────────────────┐
                    │  PR Preview 環境  │ ◄── 獨立臨時網址、Mock / Staging D1
                    └───────────────────┘
                              │ (Merge to main)
                              ▼
                    ┌───────────────────┐
                    │  Staging 測試環境 │ ◄── 26fwd-staging.pages.dev
                    │  (D1: staging)    │     測試 Turnstile、noindex、測試 Give
                    └───────────────────┘
                              │ (手動發布 Release / Tag v1.0.x)
                              ▼ (需 PM/Lead 簽核批准: Environment Gate)
                    ┌───────────────────┐
                    │ Production正式環境│ ◄── forward.thehope.co
                    │  (D1: production) │     正式 Turnstile、正式 Token、正式金流
                    └───────────────────┘
```

---

## 二、環境差異對照矩陣 (Staging vs. Production)

| 規劃維度 | 測試環境（Staging / Preview） | 正式環境（Production） | 設計理由與安全防禦 |
|---|---|---|---|
| **Cloudflare Pages 專案** | `26fwd-staging` | `26fwd-prod` | 專案實體分開，環境變數與綁定互不干擾 |
| **自訂網域** | `26fwd-staging.pages.dev` | `forward.thehope.co` | 正式官方獨立網域，配置 SSL 與 CDN 快取 |
| **GitHub 觸發條件** | `main` 分支自動部署；PR 產生 Preview | 打 Release Tag（如 `v1.0.0`）或推 `release` 分支 | 正式環境必須有人工審查簽核門檻（Approval Gate） |
| **D1 資料庫** | `forward_cards_staging` | `forward_cards_prod` | **最核心隔離**：測試卡片隨時可清空重置，絕不污染正式牆 |
| **Turnstile 防護** | Cloudflare 測試 Key（`1x000...AA`，Always Pass） | 正式專屬 Site Key / Secret Key | 測試環境自動化測試不卡關；正式環境嚴格阻擋機器人 |
| **管理後台 Token** | 測試用 Token（僅工程團隊知悉） | 正式 Token（僅發給指定審核同工，長度 ≥32 字） | 權限完全隔離，防止以測試 Token 操作正式後台 |
| **金流奉獻 (Give CTA)** | 測試金流網址（帶 `utm_campaign=staging_test`） | 正式 Forward 專案 Give URL | 防止測試產生真實款項扣繳 |
| **數據分析 (GA4)** | 測試 GA4 ID（或留空不發送） | 正式 GA4 Measurement ID（`G-XXXXXXX`） | 避免內部測試稀釋並污染正式行銷指標與轉換率 |
| **搜尋引擎收錄 (SEO)** | `X-Robots-Tag: noindex, nofollow, noarchive` | 展覽前維持 `noindex`；11/14 開展轉為允許索引 | 避免未定稿素材遭 Google 搜尋提前曝光 |

---

## 三、Cloudflare Pages 與 D1 資料庫配置步驟

### 1. D1 資料庫建立（由 Alvis 執行）
```bash
# 建立測試庫與正式庫
npx wrangler d1 create forward_cards_staging
npx wrangler d1 create forward_cards_prod

# 執行 Schema 遷移
npx wrangler d1 execute forward_cards_staging --file=./migrations/0001_initial.sql
npx wrangler d1 execute forward_cards_prod --file=./migrations/0001_initial.sql
```

### 2. 環境變數綁定清單

#### Staging (`26fwd-staging`)
```ini
VITE_API_MODE=live
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
TURNSTILE_ALLOWED_HOSTNAME=26fwd-staging.pages.dev
ADMIN_API_TOKEN=<staging-secret-token-32-chars>
RATE_LIMIT_SALT=<staging-random-salt>
VITE_GIVE_URL=https://thehope.co/give?utm_campaign=staging_test
VITE_GA4_MEASUREMENT_ID=
CARD_SUBMISSIONS_ENABLED=true
```

#### Production (`26fwd-prod`)
```ini
VITE_API_MODE=live
TURNSTILE_SITE_KEY=<production-turnstile-site-key>
TURNSTILE_SECRET_KEY=<production-turnstile-secret-key>
TURNSTILE_ALLOWED_HOSTNAME=forward.thehope.co
ADMIN_API_TOKEN=<production-high-entropy-token-32-chars>
RATE_LIMIT_SALT=<production-high-entropy-salt>
VITE_GIVE_URL=<official-forward-give-url-from-finance>
VITE_GA4_MEASUREMENT_ID=<official-ga4-measurement-id>
CARD_SUBMISSIONS_ENABLED=true
```

---

## 四、發布與驗收時程（對齊 4 大 GitHub Milestones）

- **M1（09/30 二）Staging 預覽環境全端串接**：完成 `26fwd-staging` 部署與 `forward_cards_staging` 綁定，前後端真實 API 跑通。
- **M2（10/05 六）真實素材整合與審核演練**：置換正式文案、數據、見證照片；審核同工（澤明等）進入後台演練。
- **M3（10/10 四）Code & Content Freeze（提前封版）**：程式碼凍結，僅接受重大 Bug 修正，啟動跨裝置與安全回歸。
- **M4（10/31 五）Production-Ready（正式發布就緒）**：正式網域 `forward.thehope.co`、SSL 與生產環境配置完成，隨時具備正式對外發布條件。
