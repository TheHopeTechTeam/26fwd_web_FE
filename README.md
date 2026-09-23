# FORWARD 2026 · There is more — 前端

The Hope 2026 FORWARD campaign 線上數位展覽與互動網站。旅程依規格表分為四段：
**Appreciate 感謝 → Transition 轉身 → Anticipate 期待 → Respond 回應**。

> ⚠️ 目前是 **synthetic preview**：人物、見證、數據、卡片與音樂皆為合成示意內容，API 使用瀏覽器內假資料。正式素材、文案與後端到位後再替換（見下方「待交付／待決策」）。

## 技術

- Vite 8 + React 19 + TypeScript（多頁：`/`、`/cards/`、`/admin/`、`/privacy/`，GitHub Pages 可直接部署，不需 SPA 路由）
- 純 CSS（`src/styles/tokens.css` 集中色票與字型，主視覺定案後只要改 tokens）
- 無動畫套件；卡片圖片用原生 Canvas 2D 產生
- 首頁 JS 約 97 KB gzip（規格上限 200 KB）

## 開發

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # 型別檢查 + 單元測試 + production build（CI 也跑這個）
npm run preview    # 預覽 build 結果
```

環境變數見 [`.env.example`](.env.example)（全部是公開值，會進到前端 bundle，**不要放任何 secret**）。

## 頁面與規格對照

| 區段 | 規格 | 檔案 |
| --- | --- | --- |
| 右側旅程導覽（桌機／手機皆固定右側） | FEAT-01 / US-01 | `src/components/JourneyRail.tsx` |
| 00 Hero＋右上常駐奉獻 | FEAT-02 / US-02 | `src/sections/Hero.tsx`, `src/components/SiteHeader.tsx` |
| 01 Appreciate 漂浮見證＋Tag 聚焦＋見證彈窗 | FEAT-03/04 / US-03/04 | `src/sections/Appreciate.tsx`, `src/data/testimonies.ts` |
| 02 Transition 三情境＋手動播放音樂 | FEAT-05 / US-05 | `src/sections/Transition.tsx`, `public/audio/` |
| 03 Anticipate 四項事工＋Count-up＋The One Wall／Prayer Map | FEAT-06/07/12 / US-06/11 | `src/sections/Anticipate.tsx`, `src/data/content.ts` |
| 04 Respond 寫卡表單 | FEAT-08 / US-07 | `src/sections/Respond.tsx` |
| 卡片圖片下載／分享（1080×1080、1080×1920、三主題） | FEAT-10 / US-09 | `src/lib/canvasCard.ts` |
| 公開卡片牆（獨立頁、Masonry、每批 12 張） | FEAT-11 / US-10 | `src/pages/cards/` |
| 奉獻 CTA＋UTM＋GA4 `click_give_cta` | FEAT-13 / US-12 | `src/components/GiveButton.tsx`, `src/config/give.ts` |
| Honeypot、防連點、429 提示 | FEAT-14 / US-13 | `src/sections/Respond.tsx` |
| 審核後台（待審／已公開／已隱藏、核准／隱藏） | FEAT-16 / US-17 | `src/pages/admin/` |
| 隱私與資料說明（草稿） | FEAT-18 / US-15 | `src/pages/privacy/` |

## API（先用假資料）

- 契約文件（給後端）：[`docs/api/README.md`](docs/api/README.md)、[`docs/api/openapi.yaml`](docs/api/openapi.yaml)
- 前端呼叫一律經過 `src/api/client.ts`；`VITE_API_MODE=mock`（預設）時由 `src/api/mock/server.ts` 在瀏覽器內模擬**同一份 HTTP 契約**（狀態碼、錯誤格式、限流 1 次／分、3 次／時、honeypot、分頁），假資料只存在記憶體，重新整理即重置。
- 後端完成後：設定 `VITE_API_MODE=live` 與 `VITE_API_BASE_URL` 即可切換，不需改程式。
- Mock 模式的審核後台：輸入任意 ≥ 32 字元字串即可登入。

## 部署（GitHub Pages）

`.github/workflows/deploy-pages.yml`：PR 只跑 `npm run check`；push 到 `main` 會 build 並部署到 GitHub Pages。

第一次需要 repo 管理員設定：**Settings → Pages → Build and deployment → Source 選「GitHub Actions」**。
網址會是 `https://thehopetechteam.github.io/26fwd_web_FE/`。

可選的 Actions Variables（Settings → Secrets and variables → Actions → Variables）：

| 變數 | 用途 |
| --- | --- |
| `VITE_GIVE_URL` | 正式奉獻網址（https）。未設定時奉獻按鈕維持安全停用 |
| `VITE_GA4_MEASUREMENT_ID` | GA4 ID（`G-XXXX`）。未設定則不載入 GA |
| `VITE_TURNSTILE_SITE_KEY` | Turnstile site key（接上真後端後再設） |
| `VITE_PRAYER_MAP_EMBED_ENABLED` | Prayer Map 開放內嵌後設為 `true` |

## 素材產生腳本

合成素材由腳本產生並已 commit，正式素材到位後直接替換檔案即可：

| 指令 | 產出 |
| --- | --- |
| `npm run assets:portraits` | 20 張合成插畫頭像 `public/synthetic/portraits/` |
| `npm run assets:audio` | 三首自製測試音樂 `public/audio/*.m4a`（需 macOS `afconvert`） |
| `npm run assets:font` | 中文標題子集字型 `src/assets/fonts/fwd-heading-tc.woff2`（標題文案改動後要重跑） |
| `npm run assets:brand` | Logo、apple-touch-icon、OG 分享圖 |

設計原型保留在 `Forward_ There is more/`（僅供參考，不參與 build）。

## 待交付／待決策（上線前）

- **Comms／Online**：正式見證照片、故事、影片與授權紀錄；Tag 正式字詞；01–05 文案與統計數據；正式選曲與授權；主視覺與色票（Q-33）；隱私說明正式文字
- **BB**：正式 Forward 奉獻網址與 UTM 命名；審核負責人（Q-29）
- **Prayer Map 維運方**：開放 FWD 網域內嵌（目前 `frame-ancestors 'none'`、`X-Frame-Options: DENY`）
- **後端（Alvis）**：依 `docs/api` 實作；風險辨識、退件／改寫、保存期限與取回待 Q-29～Q-32
