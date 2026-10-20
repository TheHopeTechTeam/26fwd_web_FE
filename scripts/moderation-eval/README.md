# Forward Card 內容判斷試驗工具

評估 Cloudflare Workers AI 的 Clef 模型能否協助審核 Forward Card（#5）。

## 資料政策
- **測試卡片、逐張結果與題目說明（prompt）都放在私有 repo `TheHopeTechTeam/26fwd-moderation-eval`**，不放在本 repo、公開 PR 或公開留言（#5，Ian 10/19 決定）。本 repo 只放工具、方法說明與彙總數字。需要存取請洽 Ian
- 所有測試資料都是合成的。staging 與 UAT 一律只用合成資料，不使用真實會友投稿、IP、管理金鑰或兒少資料

## 檔案
| 檔案 | 內容 |
|---|---|
| `proxy/` | 只在本機執行的 Worker：用你的 `wrangler login` 呼叫 Workers AI，**不部署** |
| `run.mjs` | 把私有 repo 裡的卡片逐張送給指定模型，原始回應寫回私有 repo 的 `results/raw/` |
| `score.mjs` | 對照預期答案評分，彙總寫回私有 repo；畫面上只顯示彙總數字 |

## 安全設計
- `--data` 必須指向本 repo **以外**的私有 repo checkout，否則腳本拒絕執行，避免卡片或結果被放進公開 repo
- `--endpoint` 只接受本機位址，卡片內容只會送到本機代理
- 代理只回應發給本機的請求，`wrangler.jsonc` 也關閉了 workers.dev 網址；萬一被誤部署，外部也無法用它消耗帳號的 Workers AI 額度
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

## 方法
- **標示規則**：模型選了 `none` 以外的任何原因，就轉審核人員（#5 採用的「原因規則」）。「是否需要注意」的機率保留，用於後台排序
- 模型是確定性的：同一張卡重跑，結果相同

## 彙總結果

| 日期 | 題目 | 資料 | Clef | Clef-flash |
|---|---|---|---|---|
| 10/12 | v1 | 主資料集 90 張 | 問題卡 50/50、一般卡誤報 2/40 | 47/50、2/40 |
| 10/18 | v1 | 格式變化組 24 張（廣告與聯絡方式的變形寫法） | 18/18、0/6 | 15/18、0/6 |
| 10/20 | v2 | 主資料集 90 張＋他人病況組 16 張＋格式變化組 24 張 | **80/80、0/50** | — |

- 依上表，#5 採用 Clef
- v2 題目加入 Ian 10/15 決定的「提到他人病況一律轉人工」規則；10/12 的 2 張誤報依此規則改標為需要注意
- 同一組他人病況卡用 v1 題目只抓到 2/10，用 v2 題目抓到 10/10，對照組兩版都沒有誤報：規則必須寫進題目，模型才會照做
- 樣本小：0/50 誤報的 95% 信賴區間上限約 7%，正式比例要在 UAT 用更多資料確認
