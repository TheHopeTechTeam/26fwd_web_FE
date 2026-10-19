# Staging 壓測：多人共用同一個 IP（#5、#15）

模擬聚會現場：很多人連同一個 wifi（同一個對外 IP），在短時間內各自寫卡。腳本的行為跟前端 `src/api/client.ts` 一樣：每張卡先呼叫 `/api/client-token`、各自保存自己的 cookie，再送卡；Turnstile 使用 Cloudflare 官方的 dummy token。

只用 Node 內建模組，不需要安裝任何套件。

## 三個階段

| 階段 | 做什麼 | 預期 |
|---|---|---|
| A 湧入 | `--users` 個瀏覽器（預設 300）在 `--ramp` 秒內（預設 20）陸續各送一張卡 | 全部領到新 token（204）、全部寫入（201） |
| B 重送 | 同一批人在 60 秒內用同一個 cookie 再送一次 | token 沿用（204、沒有新 cookie）、全部被擋（429，附等待秒數） |
| C 新來的人 | 另外 `--newcomers` 個瀏覽器（預設 50）各送一張卡 | 全部寫入（201） |

C 用來確認 B 被擋下的重送沒有占用同一個 IP 的額度（PR #13 review 第 1 點、#27）。預設會等到整分鐘剛過才開始，讓三個階段落在同一個「每 IP 每分鐘」的計數區間。

## 安全設計

- 只接受 `https://26fwd-staging.pages.dev` 或本機的 wrangler 伺服器，其他網址一律拒絕
- 第一個回應沒有 `X-FWD-Load-Test: on` 就中止。後端只有在 staging 網域開啟 `LOAD_TEST_MODE` 時才會帶這個標頭，所以腳本不可能對正式環境或沒開壓測模式的環境送出卡片
- `--users` + `--newcomers` 不能超過每 IP 每分鐘 400 張的上限
- 卡片暱稱都是 `壓測-<本次代號>-<序號>`，事後可以精確計數與清理

## 執行步驟（staging）

1. 事先在 #5 公告時段，取得 Ian 同意
2. 在 Cloudflare 的 `26fwd-staging` 加上變數 `LOAD_TEST_MODE=true`，重新部署
3. 確認標頭：`curl -s -o /dev/null -D - -X POST https://26fwd-staging.pages.dev/api/client-token | grep -i x-fwd-load-test`
4. 執行：`node scripts/load-test/run.mjs`
5. 用腳本最後印出的兩個 `wrangler d1 execute` 指令核對：本次卡片數 = 寫入成功數、暱稱不重複、全部 pending；IP 計數 = 寫入成功數（不含被擋下的重送）
6. 刪除 `LOAD_TEST_MODE`，重新部署；確認標頭消失，並用手機以真實 Turnstile 送一張卡
7. 結果（含 p50／p95）回報在 #5；壓測卡片經 Ian 同意後再清理：
   `npx wrangler d1 execute forward_cards_staging --remote --command "DELETE FROM forward_cards WHERE nickname LIKE '壓測-%' AND status = 'pending'"`

報告 JSON 存在 `scripts/load-test/reports/`（不進 git）。

## 參數

| 參數 | 預設 | 說明 |
|---|---|---|
| `--users` | 300 | A 階段的人數 |
| `--newcomers` | 50 | C 階段的人數 |
| `--ramp` | 20 | A 階段的人在幾秒內陸續送出 |
| `--no-align` | — | 不等整分鐘，立刻開始 |
| `--base` | staging | 本機試跑時改成 `http://127.0.0.1:<port>` |
| `--host-header`、`--client-ip` | — | 只限本機試跑：模擬 Cloudflare 會帶的網域與 `CF-Connecting-IP` |

## 限制

- 從一台電腦送出，只有一個對外 IP；「不同 IP」的情境由後端單元測試涵蓋，另外用 2～3 個不同網路（wifi、行動網路）的手機實際送卡補充
- 回應時間是從執行腳本的電腦量的，包含網路來回時間
- 連線會重複使用（keep-alive），比真實的多支手機少了大部分的 TLS 交握時間
