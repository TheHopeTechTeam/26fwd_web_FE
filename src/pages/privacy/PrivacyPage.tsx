import { SiteFooter } from '../../components/SiteFooter';
import { SiteHeader } from '../../components/SiteHeader';
import { pageUrl } from '../../config/env';
import './PrivacyPage.css';

/**
 * The church's privacy policy, copied word for word (numbering included) from Legal's document
 * 「The Hope 教會個人資料使用與隱私政策同意條款」 (ZY revised, 2025-02-22), sections 1–9. Legal's
 * text must not be edited here: any change has to come from Legal. Section 10 (the consent
 * statement) is left out as ZY's note asks; it is the checkbox on the card form instead. The
 * blanks [*] in 6.2 are shown as they are, highlighted, until Legal fills them in.
 */
const BLANK = <span className="privacy__tbc">[*]</span>;

export function PrivacyPage() {
  return (
    <>
      <SiteHeader backLabel="回到 FORWARD" />
      <main className="privacy">
        <div className="wrap wrap--no-rail privacy__inner">
          <p className="kicker">Privacy · 隱私與資料說明</p>
          <h1 className="privacy__title display-zh">隱私與資料說明</h1>

          {/* The site's own note (11/04, wording pending review); Legal's policy follows, unedited. */}
          <section className="privacy__site">
            <h2>FORWARD 網站說明</h2>
            <ul>
              <li>
                你送出 FORWARD 卡時，我們會保存你填寫的名稱、兩段內容、你勾選的同意紀錄與送出時間。內容經過文字審核後，會公開顯示在 Hope
                Nation 回應牆。
              </li>
              <li>為了防止大量灌水，我們會保存連線資訊的雜湊值，並使用一個 2 小時後自動失效的匿名 cookie，不含個人資料。</li>
              <li>
                我們使用 Cloudflare Turnstile 確認送出者不是機器人；若啟用 Google Analytics，只統計奉獻按鈕點擊與送出次數等整體使用情況，不會傳送你的名稱或內容。
              </li>
              <li>以上資料保存至 2027 年 12 月 31 日。</li>
              <li>本網站的個人資料蒐集、處理與利用，依下方「The Hope 教會個人資料使用與隱私政策同意條款」辦理。</li>
            </ul>
          </section>

          <h2 className="privacy__policy-title display-zh">The Hope 教會個人資料使用與隱私政策同意條款</h2>

          <p className="privacy__intro">
            感謝您參與在 The Hope 教會當中！為確保您的個人資料安全並遵循《個人資料保護法》及相關法令規定，The Hope
            教會將依法保護並妥善處理您的個人資料。請仔細閱讀以下條款，並確認您同意 The Hope
            教會對您的個人資料的蒐集、處理與利用方式。當您註冊綁定為此系統用戶，將視為您同意本隱私政策及條款。如您不同意，請立刻停止使用本系統及相關服務：
          </p>

          <section>
            <h3>1. 個人資料蒐集之目的及利用</h3>
            <p>於適用法律允許的範圍內，The Hope 教會基於以下目的蒐集您的個人資料，且僅供 The Hope 教會依照蒐集之目的進行處理和利用：</p>
            <ul className="privacy__numbered">
              <li>1.1. 與教會相關的活動、事工及關懷服務之聯繫與通知。</li>
              <li>1.2. 活動報名管理與統計分析，以提升服務品質。</li>
              <li>1.3. 教會內部的行政與資料紀錄管理需求。</li>
            </ul>
          </section>

          <section>
            <h3>2. 蒐集之個人資料類別</h3>
            <p>依您參與的活動性質，The Hope 教會可能蒐集的資料包括但不限於：</p>
            <ul className="privacy__numbered">
              <li>2.1. 基本識別資訊（如姓名、出生年月日、聯絡電話、電子郵件地址、婚姻狀態、家庭及成員情況等）。</li>
              <li>2.2. 特殊情況下的其他必要資訊（如健康狀況、緊急聯絡人資訊等）。</li>
              <li>2.3 其他得以直接或間接識別您的身分之個人資料。</li>
            </ul>
          </section>

          <section>
            <h3>3. 個人資料利用的期間、地區</h3>
            <p>
              除下列情形外，The Hope
              教會僅會基於您授權的範圍，於帳戶綁定期間或法律另有規定之保存期間及台灣境內、或基於活動需求且經您授權後跨境而於前開蒐集目的範圍內為作業之必要運用個人資料：
            </p>
            <ul>
              <li>法律明文規定。</li>
              <li>為增進公共利益所必要。</li>
              <li>為免除當事人之生命、身體、自由或財產上之危險。</li>
              <li>為防止他人權益之重大危害。</li>
              <li>經當事人同意。</li>
              <li>有利於當事人權益。</li>
            </ul>
          </section>

          <section>
            <h3>4. 個人資料利用的對象及方式</h3>
            <ul className="privacy__numbered">
              <li>4.1 對象：僅限 The Hope 教會內部相關單位或經授權之合作機構使用。</li>
              <li>4.2 方式：以電子或紙本方式蒐集、處理及利用您的資料。</li>
            </ul>
          </section>

          <section>
            <h3>5. 個人資料保存期間</h3>
            <p>您提供之個人資料，The Hope 教會將於帳戶綁定期間持續保存，直至您刪除綁定帳戶，或當您行使相關個人權利時為止。</p>
          </section>

          <section>
            <h3>6. 個人資料權利行使</h3>
            <p>6.1 依《個人資料保護法》，您對您的個人資料擁有以下權利：</p>
            <ul className="privacy__numbered">
              <li>6.1. 1查詢或請求閱覽您的個人資料。</li>
              <li>6.1.2. 請求補充、更正或刪除不完整或不正確的資料。</li>
              <li>6.1.3. 請求停止蒐集、處理或利用您的個人資料。</li>
              <li>6.1.4. 請求刪除您的個人資料，惟法律另有規定者不在此限。</li>
            </ul>
            <p>
              6.2 如需行使上述權利，請聯繫 The Hope 教會。The Hope 教會受理您行使各項個人權利，若為查詢或請求閱覽、請求製給複製本，The Hope
              教會將於提出請求之{BLANK}日內回覆，必要時得再延長{BLANK}日；若為請求補充或更正、請求停止蒐集處理或利用、請求刪除，The Hope
              教會將於提出請求之{BLANK}日內回覆，必要時得再延長{BLANK}日。
            </p>
          </section>

          <section>
            <h3>7. 個人資料正確性之影響</h3>
            <p>在此提醒您，請確保您提供個人資料之正確性，以避免影響帳戶綁定資格，或使用、參與用戶相關活動之權益。</p>
          </section>

          <section>
            <h3>8. 隱私保護承諾</h3>
            <p>8.1 The Hope 教會承諾將採取適當的技術與管理措施，保護您的個人資料安全，避免資料遭受未經授權的存取、洩漏、竄改或損壞。</p>
            <p>8.2 若因個人疏忽導致之損失， The Hope 教會將無法承擔其賠償責任，故為了保護您的綁定帳戶及個人資料的安全，請遵守以下規定：</p>
            <ul>
              <li>請勿提供您的個人資料予第三人申請帳號及密碼。</li>
              <li>請妥善保管個人申請之帳號及密碼，並勿任意將其資料提供予第三人。</li>
            </ul>
          </section>

          {/* Item 9 has no heading in the document; the whole item is set in bold there. */}
          <section>
            <p className="privacy__clause">
              9. The Hope
              教會保留隨時修訂本隱私政策及相關告知事項之權利。建議您隨時注意本隱私政策及相關告知事項之修改或變更。若您不同意前開修改或變更，請停止繼續使用本系統之服務。
            </p>
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
