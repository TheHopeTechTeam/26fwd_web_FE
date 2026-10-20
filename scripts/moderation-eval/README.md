# Forward Card 內容判斷試驗工具

評估 Cloudflare Workers AI 的 Clef 模型能否協助審核 Forward Card（#5）。

## 資料政策
- **測試卡片、逐張結果與題目說明（prompt）都放在私有 repo `TheHopeTechTeam/26fwd-moderation-eval`**，不放在本 repo、公開 PR 或公開留言（#5，Ian 10/19 決定）。本 repo 只放工具、方法概要與彙總數字。需要存取請洽 Ian
- 所有測試資料都是合成的。staging 與 UAT 一律只用合成資料，不使用真實會友投稿、IP、管理金鑰或兒少資料

## 檔案
| 檔案 | 內容 |
|---|---|
| `proxy/` | 只在本機執行的 Worker：用你的 `wrangler login` 呼叫 Workers AI，**不部署** |
| `run.mjs` | 把私有 repo 裡的卡片逐張送給指定模型，原始回應寫回私有 repo 的 `results/raw/` |
| `score.mjs` | 對照預期答案評分，彙總寫回私有 repo 的 `results/`；畫面上只顯示彙總數字 |
| `paths.mjs` | 兩支腳本共用的路徑檢查 |

## 安全設計
**路徑**（`run.mjs`、`score.mjs` 都適用，檢查前會先解析捷徑／symlink）
- `--data` 必須是本 repo **以外**、已存在的資料夾（私有 repo 的 checkout），否則拒絕執行
- `--cards`、`--questions` 必須是 `--data` 底下的相對路徑；絕對路徑或用 `../` 跳出資料夾都會被拒絕
- `--tag` 只能用英數字、`.`、`_`、`-`，且開頭必須是英數字
- 結果只寫入 `--data` 底下的 `results/`；若該資料夾透過捷徑指到 `--data` 以外，拒絕寫入

**本機代理**（`proxy/`）只回應本機上的 `run.mjs`：
- 請求的網域不是 `127.0.0.1`／`localhost` 就拒絕；`wrangler.jsonc` 也關閉了 workers.dev 網址，萬一被誤部署，外部也無法使用
- 帶有 `Origin` 或 `Sec-Fetch-Site` 標頭的請求一律拒絕：瀏覽器從網頁發出的請求都會帶上這些標頭，所以代理開著時，其他網頁無法用它消耗帳號的 Workers AI 額度
- 必須帶 `run.mjs` 送出的自訂標頭與 `Content-Type: application/json`；網頁要跨站帶自訂標頭必須先通過 CORS 預檢，而代理不會放行

**其他**
- `run.mjs` 的 `--endpoint` 只接受本機位址，卡片內容只會送到本機代理
- 模型只看到 `nickname`、`text_gratitude`、`text_anticipate`，與真實送卡存的欄位相同；預期答案不會送出

## 執行方式
私有 repo clone 在本 repo 旁邊：

```bash
git clone git@github.com:TheHopeTechTeam/26fwd-moderation-eval.git ../26fwd-moderation-eval

# 終端機 1：本機代理（AI 綁定一律呼叫雲端，會使用帳號的 Workers AI 額度）
npx wrangler dev --config scripts/moderation-eval/proxy/wrangler.jsonc --ip 127.0.0.1 --port 8787

# 終端機 2
node scripts/moderation-eval/run.mjs --data ../26fwd-moderation-eval --model clef --cards cards.json --tag v2
node scripts/moderation-eval/score.mjs --data ../26fwd-moderation-eval --model clef --tag v2 --cards cards.json
```

- 已成功的卡片會跳過，中斷後重跑同一個指令即可接續
- 每筆原始回應都記錄題目版本（題目 JSON 的 SHA-256 前 12 碼），可追查每個結果用的是哪一版題目
- 延遲是在本機經過代理量到的，包含本機到 Cloudflare 的網路時間，只適合比較模型

## 方法概要
- 模型對卡片有任何疑慮，就轉審核人員；模型回傳的機率保留，用於後台排序
- 題目內容、類別與標註原則只放在私有 repo

## 彙總結果

| 日期 | 題目 | 卡片數 | Clef：問題卡抓到／一般卡誤報 | Clef-flash |
|---|---|---|---|---|
| 10/12 | v1 | 90 | 50/50、2/40 | 47/50、2/40 |
| 10/18 | v1 | 24（補充組） | 18/18、0/6 | 15/18、0/6 |
| 10/20 | v2 | 130（主資料集＋補充組） | **80/80、0/50** | — |

- 依上表，#5 採用 Clef；v2 題目依 #5 的審核政策更新
- 這是合成資料的測試，不等於 UAT 通過；0/50 誤報的 95% 信賴區間上限約 7%，正式比例要在 UAT 用更多資料確認
