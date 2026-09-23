import { SiteFooter } from '../../components/SiteFooter';
import { SiteHeader } from '../../components/SiteHeader';
import { config, pageUrl } from '../../config/env';
import './PrivacyPage.css';

// Plain-language summary of the ⑧ data inventory (DATA-01～24). DRAFT: wording, retention
// and the contact channel still need Comms / BB / Online sign-off (Q-32).
const COLLECTED: Array<{ item: string; why: string; who: string }> = [
  { item: '署名（暱稱或名字）', why: '作為卡片署名，不要求真實姓名', who: '審閱通過後公開；審閱前僅授權審核人員' },
  { item: '「我感謝神…」與「跟神一起期待…」內容', why: '你想分享的信仰經驗與期待', who: '審閱通過後公開；審閱前僅授權審核人員' },
  { item: '公開分享同意', why: '記錄你同意公開這張卡片', who: '僅系統維運人員' },
  { item: '卡片編號與送出時間', why: '排序、顯示「幾小時前」與審核作業', who: '編號與時間會隨公開卡片顯示' },
  { item: '連線 IP 的單向雜湊值', why: '防止大量灌水（每分鐘 1 張、每小時 3 張）；不保存原始 IP，也不與卡片綁定', who: '僅系統維運人員' },
];

export function PrivacyPage() {
  return (
    <>
      <SiteHeader backLabel="回到 FORWARD" />
      <main className="privacy">
        <div className="wrap wrap--no-rail privacy__inner">
          <p className="kicker">Privacy · 隱私與資料說明</p>
          <h1 className="privacy__title display-zh">Forward Card 隱私與資料說明</h1>
          <p className="privacy__draft">草稿：本說明的文字、保存期限與聯絡管道仍待 Comms 與負責同工確認，正式上線前會更新。</p>

          <section>
            <h2>寫卡不需要登入</h2>
            <p>你只需要填寫署名（可以是暱稱）和兩段內容。我們不會要求你的真實姓名、電話、Email 或社群帳號。</p>
          </section>

          <section>
            <h2>我們會保存哪些資料</h2>
            <div className="privacy__table-wrap">
              <table className="privacy__table">
                <thead>
                  <tr>
                    <th scope="col">資料</th>
                    <th scope="col">用途</th>
                    <th scope="col">誰看得到</th>
                  </tr>
                </thead>
                <tbody>
                  {COLLECTED.map((row) => (
                    <tr key={row.item}>
                      <th scope="row">{row.item}</th>
                      <td>{row.why}</td>
                      <td>{row.who}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note">我們不會在你的瀏覽器（localStorage 等）保存卡片內容，也不會把卡片圖片上傳到伺服器；下載的卡片圖片只存在你自己的裝置。</p>
          </section>

          <section>
            <h2>送出後會發生什麼事</h2>
            <ul>
              <li>卡片送出後會先進入「待審閱」狀態，由團隊審閱通過後才會公開在 Forward Cards 卡片牆。</li>
              <li>內容若包含聯絡方式、他人的私密資訊或與主題無關，可能不會公開。</li>
              <li>已公開的卡片若被隱藏，只是不再顯示，並不等於資料已刪除。</li>
              <li>下載或分享你的個人卡片圖片，不代表卡片已經公開。</li>
            </ul>
          </section>

          <section>
            <h2>保存多久、如何刪除或取回</h2>
            <p>資料的保存期限、刪除方式，以及日後是否能取回自己寫過的卡片，目前仍在討論中（尚未定案）。確定後會更新在這裡，並提供申請管道。</p>
          </section>

          <section>
            <h2>第三方服務</h2>
            <ul>
              <li>
                <strong>Cloudflare Turnstile</strong>：用來確認送出者不是機器人，驗證資料由 Cloudflare 即時處理，本站不保存。
              </li>
              <li>
                <strong>Google Analytics（若啟用）</strong>：只用來統計「奉獻按鈕」的點擊次數等整體使用情況，不會傳送你的署名或卡片內容。
              </li>
              <li>
                <strong>Prayer Map</strong>：The One Wall 連到外部的 Prayer Map 網站，本站不會把你在這裡填寫的任何資料傳給它。請參考
                <a href={config.prayerMapPrivacyUrl} target="_blank" rel="noopener noreferrer">
                  Prayer Map 隱私權政策
                </a>
                。
              </li>
              <li>
                <strong>奉獻頁面</strong>：奉獻按鈕會連到教會的奉獻頁面，網址帶有活動追蹤參數（UTM），不包含任何個人資料。
              </li>
            </ul>
          </section>

          <p>
            <a className="btn btn--gold" href={pageUrl('#respond')}>
              回到寫卡
            </a>
          </p>
        </div>
      </main>
      <SiteFooter railSpace={false} />
    </>
  );
}
