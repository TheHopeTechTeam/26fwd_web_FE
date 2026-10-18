# FORWARD 2026 · Forward Card API 契約（給後端）

> 版本 v0.2（2026-10-13，新增 Client Token，見 #5）｜v0.1（2026-09-22）｜對應規格表 ⑦ US-07／US-10／US-13／US-17、⑧ DATA-01～24
> 前端目前以瀏覽器內的 mock server（`src/api/mock/server.ts`）實作**完全相同**的契約，後端照本文件實作後，只要把 `VITE_API_MODE=live`、`VITE_API_BASE_URL` 指向後端即可切換。
> 機器可讀版本：[`openapi.yaml`](./openapi.yaml)（可直接匯入 Postman）。TypeScript 型別：`src/api/types.ts`。三者須保持一致。

## 通則

| 項目 | 規則 |
| --- | --- |
| 格式 | Request／Response 皆為 `application/json; charset=utf-8` |
| 時間 | 一律 ISO 8601 UTC（例：`2026-11-14T10:00:00.000Z`）。前端也能解析 SQLite `YYYY-MM-DD HH:MM:SS`（視為 UTC），但新資料請輸出 ISO |
| 字數 | 一律以 **trim 後的 Unicode code point** 計算（emoji 算 1），前後端規則一致 |
| 換行 | 前端送出前會把 `\r\n`／`\r` 正規化為 `\n` |
| Cookie | 只有領取 Client Token 與送卡兩個請求使用 `credentials: 'same-origin'`（帶 Client Token cookie），其餘請求 `credentials: 'omit'`。Client Token cookie 為 `__Host-` 前綴且 `SameSite=Strict`，**API 必須與網站同網域**（目前即是：Pages Functions 與網站同一個網域） |
| 快取 | 公開 `GET /api/cards` 可設 `Cache-Control: public, max-age=15`（下架最多延遲約 15 秒生效）；所有 admin 端點 `Cache-Control: no-store` |

### 錯誤格式（所有非 2xx）

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid",
    "fields": { "nickname": "required", "text_gratitude": "too_long" },
    "retry_after_seconds": 42
  }
}
```

- `fields` 只在 `VALIDATION_ERROR` 出現；值為 `required`｜`too_long`｜`invalid_chars`｜`must_be_true`｜`invalid`。
- `retry_after_seconds` 只在 `RATE_LIMITED` 出現，並同時送 `Retry-After` header。
- `message` 給工程除錯用（英文即可），**前端不會直接顯示**，也不應包含判斷規則或命中詞（US-16）。

| HTTP | `error.code` | 何時 | 前端顯示 |
| --- | --- | --- | --- |
| 400 | `VALIDATION_ERROR` | 欄位格式錯、JSON 壞掉、查詢參數超出範圍 | 格式錯誤，請檢查欄位內容後再送出。 |
| 400 | `TURNSTILE_FAILED` | Turnstile 驗證失敗或過期 | 人機驗證未通過，請重新驗證後再送出。 |
| 401 | `CLIENT_TOKEN_INVALID` | 送卡時 Client Token 缺少、過期或簽章不符 | 不顯示：前端自動重新領取並重送一次 |
| 401 | `UNAUTHORIZED` | admin token 缺少或錯誤 | 驗證失敗，請重新輸入管理金鑰。 |
| 404 | `NOT_FOUND` | 卡片不存在／路徑不存在 | — |
| 405 | `METHOD_NOT_ALLOWED` | 方法不支援 | — |
| 413 | `PAYLOAD_TOO_LARGE` | body > 4 KiB | 格式錯誤… |
| 429 | `RATE_LIMITED` | 超過限流 | 發送太頻繁，請稍後再試。 |
| 500 | `INTERNAL_ERROR` | 未預期錯誤 | 系統暫時發生問題，請稍後再試。 |
| 503 | `SERVICE_UNAVAILABLE` | 維護中／依賴服務掛掉 | 服務暫時無法使用，請稍後再試。 |

---

## 0. 領取 Client Token `POST /api/client-token`

前端**每次送卡前**呼叫一次（`credentials: 'same-origin'`，不需要 body）。Client Token 是伺服器簽發的匿名 token，讓共用同一個對外 IP 的人（會場 wifi、行動網路）各自有送卡額度；它不含使用者資料，也不作為身分識別。

| 情況 | 回應 |
| --- | --- |
| 瀏覽器已有有效 token | `204`，**不換新**（沒有 `Set-Cookie`）。重新整理頁面也沿用同一個 token，送卡額度不會重算 |
| 沒有 token，或已過期、竄改、由舊密鑰簽發 | `204`，以 `Set-Cookie` 設定新 token |
| 同一個 IP 每分鐘領取超過 600 個新 token | `429 RATE_LIMITED`（已有有效 token 的請求不計入） |
| 暫停收卡、伺服器設定缺漏 | `503 SERVICE_UNAVAILABLE` |

Cookie：`__Host-fwd_ct=v1.<隨機 ID>.<到期時間（Unix 秒）>.<HMAC-SHA256 簽章>; Max-Age=7200; Path=/; Secure; HttpOnly; SameSite=Strict`

- `HttpOnly`：前端 JavaScript 讀不到，XSS 也偷不到
- `__Host-` 前綴：必須 `Secure`、`Path=/` 且不能指定 Domain，其他 thehope.co 子網域無法植入或覆寫
- 簽章密鑰 `CLIENT_TOKEN_SECRET` 只在伺服器；驗證只看簽章與到期時間，不查資料庫。更換密鑰會讓所有 token 立即失效，前端會自動重領

---

## 1. 送出卡片 `POST /api/cards`

免登入（Q-09）。成功後卡片狀態固定為 `pending`，**不會直接公開**，需經人工核准（Q-10／US-16）。

需要帶上第 0 節的 Client Token cookie（`credentials: 'same-origin'`）。缺少、過期或簽章不符時回 `401 CLIENT_TOKEN_INVALID`，不寫入任何資料；這時 Turnstile token 還沒被使用，前端重新領取 Client Token 後，以**同一個 request** 重送一次。

**Request**

```json
{
  "nickname": "小恩",
  "text_gratitude": "感謝神這一年的帶領",
  "text_anticipate": "期待 There is more！",
  "agreed_to_publish": true,
  "honeypot": "",
  "turnstile_token": "<Cloudflare Turnstile response>"
}
```

| 欄位 | 型別 | 規則 |
| --- | --- | --- |
| `nickname` | string | trim 後 1–20 code points；不可含控制字元（U+0000–001F、U+007F–009F）及 bidi 控制字元（U+202A–202E、U+2066–2069） |
| `text_gratitude` | string | trim 後 1–140 code points；允許 `\t` `\n`，其餘控制字元與 bidi 控制字元拒絕 |
| `text_anticipate` | string | 同上 |
| `agreed_to_publish` | boolean | 必須為 `true`，否則 400（`fields.agreed_to_publish = "must_be_true"`） |
| `honeypot` | string | 人類永遠送 `""`。**有值時回 201 假成功，不寫入、不消耗限流**（DATA-10） |
| `turnstile_token` | string | 啟用 Turnstile 時必填；伺服器以 Siteverify 驗證 `success`／`action = forward_card`／`hostname`，不落地（DATA-09） |

**處理順序**（US-16）：body 大小 → JSON／欄位驗證 → honeypot → **Client Token** → Turnstile → 限流（IP 與 Client Token 兩層都通過才計數）→ 寫入 `pending`（之後若導入風險辨識，放在寫入前，且結果一律維持 `pending`）。Client Token 放在 Turnstile 之前，是因為 Turnstile token 只能用一次。

**限流**（US-13，staging 測試候選，壓測後確認）：超過回 429，並附上需要等待的秒數。

| 層 | 上限 |
| --- | --- |
| 每個 Client Token | 距上一張 **60 秒**內不可再送（從上一張的送出時間起算，不是整點分鐘）；每個整點小時 **3 張** |
| 每個 IP | 每分鐘 **400 張**、每小時 **2,000 張** |

兩層會先全部檢查、都通過才一起計數：被任一層拒絕的請求不會消耗任何一層的額度（例如 60 秒內重送被擋下，不會占用同一個 IP 其他人的額度），也不會延後可以再送的時間。IP 與 Client Token 都只以加鹽 SHA-256 雜湊存在 `submission_rate_limits`，不保存原文，也不寫入卡片（DATA-08）。

**Response `201`**

```json
{ "success": true, "card_id": "c_7f3c2a9e-3b1d-4c55-9a0e-2f6f1d8b9c10" }
```

- `card_id` = `c_` + UUID v4（共 38 字元），由伺服器 `crypto.randomUUID()` 產生（DATA-05）。
- 回應**不含** status、風險資訊或任何審核細節。

---

## 2. 公開卡片牆 `GET /api/cards?page=1&limit=12`

只回傳 `status = 'approved'` 的卡片，依 `created_at` 由新到舊（同時間再依 `id` 由大到小）。

| 參數 | 規則 |
| --- | --- |
| `page` | 整數 ≥ 1，預設 1 |
| `limit` | 整數 1–12，預設 12；超出回 400 |

**Response `200`**

```json
{
  "items": [
    {
      "id": "c_7f3c2a9e-3b1d-4c55-9a0e-2f6f1d8b9c10",
      "nickname": "Sarah",
      "text_gratitude": "…",
      "text_anticipate": "…",
      "created_at": "2026-11-14T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 12, "has_more": true, "total_count": 215 }
}
```

- `items` 只能有這五個欄位；**不得**回傳 `status`、`agreed_to_publish`、`ip_hash` 或任何審核資料。
- `total_count` 為已核准卡片總數（首頁與卡片牆會顯示「已有 N 張卡片」）。
- 首頁預覽使用 `limit=3`。

---

## 3. 審核後台（Bearer token）

所有 `/api/admin/*` 需要 `Authorization: Bearer <ADMIN_SECRET>`（≥ 32 字元，存在伺服器 secret，前端只放記憶體）。token 錯誤或缺少回 401。回應一律 `Cache-Control: no-store`，且不要在 log 記錄完整 header。

### 3.1 列表 `GET /api/admin/cards?status=pending`

`status` 必填：`pending`｜`approved`｜`hidden`。依 `created_at` 由新到舊，**最多 100 筆**。

```json
{
  "items": [
    {
      "id": "c_…",
      "nickname": "小羊",
      "text_gratitude": "…",
      "text_anticipate": "…",
      "created_at": "2026-11-14T09:12:00.000Z",
      "status": "pending"
    }
  ],
  "has_more": false
}
```

### 3.2 變更狀態 `PATCH /api/admin/cards/:id/status`

```json
{ "status": "approved" }
```

`status` 只接受 `approved`｜`hidden`。`:id` 需符合 `^[A-Za-z0-9_-]{1,80}$`，否則 400；找不到回 404。

**Response `200`**

```json
{ "success": true, "card_id": "c_…", "status": "approved" }
```

### 3.3 緊急下架 `PATCH /api/admin/cards/:id/hide`

不需 body，等同把狀態設為 `hidden`。回應同 3.2（`"status": "hidden"`）。`hidden` 是下架，**不是刪除**。

---

## 資料表建議（對照 ⑧）

```sql
CREATE TABLE forward_cards (
  id                TEXT PRIMARY KEY,               -- c_ + UUID
  nickname          TEXT NOT NULL,                  -- 1–20 code points
  text_gratitude    TEXT NOT NULL,                  -- 1–140 code points
  text_anticipate   TEXT NOT NULL,                  -- 1–140 code points
  agreed_to_publish INTEGER NOT NULL CHECK (agreed_to_publish IN (0, 1)),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden')),
  created_at        TEXT NOT NULL                   -- ISO 8601 UTC
);
CREATE INDEX idx_forward_cards_status_created ON forward_cards (status, created_at DESC);

CREATE TABLE submission_rate_limits (           -- migrations 0001 + 0002
  limiter_key    TEXT PRIMARY KEY,                  -- 'ip:' | 'iss:' | 'tok:' + SHA-256(salt:值) hex
  minute_bucket  INTEGER NOT NULL,
  minute_count   INTEGER NOT NULL,
  hour_bucket    INTEGER NOT NULL,
  hour_count     INTEGER NOT NULL,
  last_submit_ms INTEGER                            -- 上一次放行的時間（Unix 毫秒）
);
```

## 尚未定案、本契約刻意不包含的部分

- 內容風險辨識／LLM、退件、改寫、稽核紀錄（Q-29～Q-31，US-16／US-17）
- 保存期限、刪除與跨年度取回（Q-32，US-15）

這些拍板後會以**新增欄位／新端點**的方式擴充，不改動上面既有的欄位與回應形狀。

## 前端串接設定

| 變數 | 說明 |
| --- | --- |
| `VITE_API_MODE` | `mock`（預設，瀏覽器內假資料）／`live` |
| `VITE_API_BASE_URL` | 後端 origin，例如 `https://api.example.org`；留空代表同網域 `/api/...` |
| `VITE_TURNSTILE_SITE_KEY` | 設定後前端才會顯示 Turnstile 並送出 `turnstile_token` |
