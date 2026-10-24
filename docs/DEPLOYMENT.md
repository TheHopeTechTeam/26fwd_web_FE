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
                    │  (D1: staging)    │     staging 專屬 Turnstile、noindex、測試 Give
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
| **Turnstile 防護** | staging 專屬真實 widget（hostname 僅允許 `26fwd-staging.pages.dev`） | 正式專屬 widget（hostname 僅允許 `forward.thehope.co`） | 兩個環境都走真實 siteverify，後端 `action=forward_card`／hostname 檢查行為一致。官方測試金鑰（`1x000...AA`）的回應無法通過這兩項檢查，只用於本機，並搭配模擬 siteverify 回應的自動測試 |
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

# 執行 Schema 遷移（依編號順序，每個資料庫各執行一次）
npx wrangler d1 execute forward_cards_staging --remote --file=./migrations/0001_initial.sql
npx wrangler d1 execute forward_cards_staging --remote --file=./migrations/0002_client_token_rate_limits.sql
npx wrangler d1 execute forward_cards_staging --remote --file=./migrations/0004_moderation.sql
npx wrangler d1 execute forward_cards_prod --remote --file=./migrations/0001_initial.sql
npx wrangler d1 execute forward_cards_prod --remote --file=./migrations/0002_client_token_rate_limits.sql
npx wrangler d1 execute forward_cards_prod --remote --file=./migrations/0004_moderation.sql
```

> - 已經套用過的 migration 不可修改，之後的變更一律新增下一個編號。
> - `0002` 會把限流表的鍵欄位改名，**舊版程式在套用後無法送卡**。對已上線的資料庫，套用 `0002` 後要立刻部署包含 Client Token 的版本；新建的資料庫（例如 M4 的正式庫）則在第一次部署前套用即可。
> - `0004` 新增自動公開開關（預設關閉）、模型判斷紀錄表與狀態變更紀錄表。**要在部署 M1.6 的程式之前套用**：後台列表會讀判斷紀錄表，核准與隱藏會寫入狀態變更紀錄，未套用時這些操作都會失敗。套用後舊版程式不受影響。

### 2. 環境變數綁定清單

#### Staging (`26fwd-staging`)
```ini
VITE_API_MODE=live
VITE_TURNSTILE_SITE_KEY=<staging-widget-site-key>
TURNSTILE_SECRET_KEY=<staging-widget-secret-key>
TURNSTILE_ALLOWED_HOSTNAME=26fwd-staging.pages.dev
ADMIN_API_TOKEN=<staging-secret-token-32-chars>
RATE_LIMIT_SALT=<staging-random-salt>
CLIENT_TOKEN_SECRET=<staging-random-secret-32-chars-or-more>
VITE_GIVE_URL=https://thehope.co/give?utm_campaign=staging_test
VITE_GA4_MEASUREMENT_ID=
CARD_SUBMISSIONS_ENABLED=true
```

#### Production (`26fwd-prod`)
```ini
VITE_API_MODE=live
VITE_TURNSTILE_SITE_KEY=<production-turnstile-site-key>
TURNSTILE_SECRET_KEY=<production-turnstile-secret-key>
TURNSTILE_ALLOWED_HOSTNAME=forward.thehope.co
ADMIN_API_TOKEN=<production-high-entropy-token-32-chars>
RATE_LIMIT_SALT=<production-high-entropy-salt>
CLIENT_TOKEN_SECRET=<production-random-secret-32-chars-or-more>
VITE_GIVE_URL=<official-forward-give-url-from-finance>
VITE_GA4_MEASUREMENT_ID=<official-ga4-measurement-id>
CARD_SUBMISSIONS_ENABLED=true
```

> **設定注意事項**
> - `TURNSTILE_SECRET_KEY`、`ADMIN_API_TOKEN`、`RATE_LIMIT_SALT`、`CLIENT_TOKEN_SECRET` 在 Cloudflare Pages 要設為 **Secret（加密）**類型，不要用明文變數。`CLIENT_TOKEN_SECRET` 至少 32 字元，可用 `openssl rand -base64 48` 產生；staging 與正式環境要用不同的值。更換它會讓所有 Client Token 立即失效（前端會自動重領）。
> - `VITE_*` 在 build 時寫入前端 bundle，修改後需重新部署才會生效。
> - Turnstile 的 hostname 檢查只接受主網址；Pages 每次部署的預覽網址（`<hash>.26fwd-staging.pages.dev`）會被拒絕，驗收請使用主網址。

#### 模型判斷與自動公開（M1.6）

| 設定 | 位置 | 說明 |
| --- | --- | --- |
| Workers AI 綁定 `AI` | Pages 專案 → Settings → Bindings | 呼叫 `@cf/cloudflare/clef`。沒有綁定時，每張卡都記錄 `model_error` 並維持待審 |
| `MODERATION_QUESTIONS` | **Secret（加密）** | 題目（prompt）JSON，內容只放在私有 repo `26fwd-moderation-eval`，**不可放進本 repo、PR 或任何公開留言**。沒有設定或格式不對時，每張卡都記錄 `questions_missing` 並維持待審。修改後要重新部署才會生效 |
| 自動公開開關 | D1 `app_settings` 表的 `auto_publish` | `0004` 建立時為 `off`。**只有值剛好是 `on` 才會自動公開**；改值後下一張卡就生效，不需重新部署 |

```bash
# 設定題目（從私有 repo 的檔案讀入，不要貼在指令列上）
npx wrangler pages secret put MODERATION_QUESTIONS --project-name 26fwd-staging < ../26fwd-moderation-eval/questions.json

# 查看開關
npx wrangler d1 execute forward_cards_staging --remote --command "SELECT value, updated_at FROM app_settings WHERE key = 'auto_publish'"
# 關閉（切回全人工，下一張卡起生效）
npx wrangler d1 execute forward_cards_staging --remote --command "UPDATE app_settings SET value = 'off', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE key = 'auto_publish'"
# 開啟（只在 Ian 同意後執行）
npx wrangler d1 execute forward_cards_staging --remote --command "UPDATE app_settings SET value = 'on', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE key = 'auto_publish'"

# 列出某段時間內被自動公開的卡（例如切回全人工後，需要逐張檢查時）
npx wrangler d1 execute forward_cards_staging --remote --command "SELECT m.card_id, m.judged_at, c.status FROM card_moderations m JOIN forward_cards c ON c.id = m.card_id WHERE m.auto_published = 1 AND m.judged_at BETWEEN '<開始 ISO 時間>' AND '<結束 ISO 時間>' ORDER BY m.judged_at"

# 被模型自動公開、之後又被審核者隱藏的卡數（UAT 用）
npx wrangler d1 execute forward_cards_staging --remote --command "SELECT COUNT(DISTINCT m.card_id) AS auto_published, COUNT(DISTINCT r.card_id) AS hidden_later FROM card_status_changes m LEFT JOIN card_status_changes r ON r.card_id = m.card_id AND r.id > m.id AND r.actor = 'reviewer' AND r.to_status = 'hidden' WHERE m.actor = 'model'"
```

> - 判斷在回覆送卡請求之後於背景執行（`waitUntil`），使用者不用等待模型；判斷失敗、逾時（5 秒）或背景工作沒有執行完，卡片都維持待審。
> - 自動公開只在卡片仍是待審時發生：審核者已經處理過的卡，不會被模型覆蓋。
> - 開關關閉時完全不呼叫模型，不使用 Workers AI 額度。開啟時若額度用完，之後的卡會記錄 `model_error` 並留給審核人員。
> - 狀態變更紀錄 `card_status_changes`：模型自動公開，以及審核者的每次核准、隱藏，各記一筆（原狀態、新狀態、`model`／`reviewer`、時間），不含卡片內文，隨卡片刪除。審核者共用管理金鑰，所以無法區分是哪一位。
> - 這一版的後台畫面在核准、隱藏時會帶上審核者看到的狀態（`from`，後端改為必填）。畫面與後端在同一次部署生效；部署前就開著的後台頁面送出會被拒絕（400），整頁重新整理即可。

**停用與回復**（套用 `0004` 前先記下 Time Travel 書籤：`npx wrangler d1 time-travel info forward_cards_staging`）
- **只是要停用自動公開**：不需要回復，把開關改成 `off`（上面的指令）即可，下一張卡起生效。
- **只回復程式**：部署前一版即可。舊程式不會用到 `0004` 的三張表，表留著不影響運作。
- **回復 `0004`**：**一定要先回復程式**，因為新程式的後台列表、核准與隱藏都會用到這些表，表不存在時會失敗。刪表會一併刪除判斷紀錄與狀態變更紀錄，需要保留時先匯出（匯出檔含判斷結果，不要放進 repo）：
  ```bash
  npx wrangler d1 export forward_cards_staging --remote --table card_moderations --output card_moderations.sql
  npx wrangler d1 export forward_cards_staging --remote --table card_status_changes --output card_status_changes.sql
  npx wrangler d1 execute forward_cards_staging --remote --command "DROP TABLE IF EXISTS card_status_changes; DROP TABLE IF EXISTS card_moderations; DROP TABLE IF EXISTS app_settings"
  ```
  卡片資料不受影響；之後要恢復，重新執行 `0004` 即可，開關會回到 `off`。
- **Time Travel 還原**（`npx wrangler d1 time-travel restore forward_cards_staging --bookmark=<書籤>`）會連同書籤之後新增或變更的卡片一起還原，只在必要時使用。

#### Staging 壓測模式 `LOAD_TEST_MODE`（只用於 #5 的 300 人壓測）

自動化腳本無法通過真實的 Turnstile，所以壓測時在 `26fwd-staging` 暫時加上明文變數 `LOAD_TEST_MODE=true`：Turnstile 改用 Cloudflare 官方的「永遠通過」測試 secret，只檢查 `success`。Client Token、限流與寫入 D1 都照正常流程執行。

- **只有網域剛好是 `26fwd-staging.pages.dev` 才會生效**（寫死在程式裡）。正式網域與預覽網址即使設了這個變數也不會生效，而且每個請求都會記一行錯誤 log
- 生效期間，每個 `/api/*` 回應都帶 `X-FWD-Load-Test: on`，並記一行警告 log
- 開啟：設定變數 → 重新部署 → 確認回應出現 `X-FWD-Load-Test: on`
- 關閉：刪除變數 → 重新部署 → 確認標頭消失，並用手機以真實 Turnstile 送一張卡
- 壓測卡片的暱稱一律以 `壓測-` 開頭，方便事後清理
- **正式專案 `26fwd-prod` 永遠不設定這個變數**；M4 上線檢查要確認它不存在

---

## 四、發布與驗收時程（對齊 4 大 GitHub Milestones）

- **M1（09/30 二）Staging 預覽環境全端串接**：完成 `26fwd-staging` 部署與 `forward_cards_staging` 綁定，前後端真實 API 跑通。
- **M2（10/05 六）真實素材整合與審核演練**：置換正式文案、數據、見證照片；審核同工（澤明等）進入後台演練。
- **M3（10/10 四）Code & Content Freeze（提前封版）**：程式碼凍結，僅接受重大 Bug 修正，啟動跨裝置與安全回歸。
- **M4（10/31 五）Production-Ready（正式發布就緒）**：正式網域 `forward.thehope.co`、SSL 與生產環境配置完成，隨時具備正式對外發布條件。
