import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { api, ApiError, describeError, type ListCardsResponse } from '../api';
import { ForwardCardSkeleton, ForwardCardView } from '../components/ForwardCardView';
import { GiveButton } from '../components/GiveButton';
import { Modal } from '../components/Modal';
import { Reveal } from '../components/Reveal';
import { useToast } from '../components/Toast';
import { Turnstile } from '../components/Turnstile';
import { config, pageUrl } from '../config/env';
import { CARD_STYLES, FINALE, PRAYER_LINK, RAIL_GIVE, RESPOND, RESPOND_GUIDE } from '../data/content';
import { trackEvent } from '../lib/analytics';
import { CARD_FORMATS, PALETTE_SWATCH, PROMPTS, PROMPTS_EN, renderCardBlob, type CardContent, type CardFormat } from '../lib/canvasCard';
import {
  FIELD_ERROR_TEXT,
  LIMITS,
  PROMPT_MAX_LINE_BREAKS,
  displayLength,
  lineBreakCount,
  normalizeNewlines,
  truncateToLimit,
  validateFields,
  type CardField,
  type DraftErrors,
} from '../lib/text';
import './Respond.css';

/**
 * 03 · Respond: the FORWARD 卡 (US-07/09), a peek at the wall (US-10), and Give (US-12).
 * Every card is shared (11/04, no private option): the visitor agrees, the card is sent for
 * review, and only then is the card image drawn in the browser to download or share.
 */
export function Respond() {
  return (
    <section id="respond" className="chapter respond tone-light" tabIndex={-1} aria-labelledby="respond-title">
      <div className="wrap">
        <Reveal className="chapter__head">
          <p className="kicker">
            <span className="eyebrow-index">03</span> · Respond 填寫 FORWARD 卡
          </p>
          <h2 id="respond-title" className="chapter__title respond__title">
            {RESPOND.title}
          </h2>
          {RESPOND.lead.map((paragraph) => (
            <p key={paragraph} className="lead respond__lead">
              {paragraph}
            </p>
          ))}
        </Reveal>
        <ForwardCardForm />
        <CardsTeaser />
      </div>
      <Finale />
    </section>
  );
}

const EMPTY = { nickname: '', text_gratitude: '', text_anticipate: '' };

/** How the prompts are counted (#16), so a half-width-heavy text does not look miscounted. */
const PROMPT_HINT = '英文、數字、半形符號與空格算半字';

function ForwardCardForm() {
  const [values, setValues] = useState<Record<CardField, string>>(EMPTY);
  const [honeypot, setHoneypot] = useState('');
  // Why the last input was cut: too long, or too many line breaks (#16).
  const [exceeded, setExceeded] = useState<Partial<Record<CardField, 'length' | 'breaks'>>>({});
  const [errors, setErrors] = useState<DraftErrors>({});
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [result, setResult] = useState<CardContent | null>(null);
  const submitting = useRef(false);
  const fieldRefs = useRef<Partial<Record<CardField, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  const onChange = (field: CardField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const normalized = normalizeNewlines(event.target.value);
    const capped = truncateToLimit(field, normalized);
    setValues((v) => ({ ...v, [field]: capped }));
    const cut = capped === normalized ? undefined : field !== 'nickname' && lineBreakCount(normalized) > PROMPT_MAX_LINE_BREAKS ? 'breaks' : 'length';
    setExceeded((x) => ({ ...x, [field]: cut }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const focusFirstError = (found: DraftErrors) => {
    const first = (['text_gratitude', 'text_anticipate', 'nickname'] as CardField[]).find((f) => found[f]);
    if (first) fieldRefs.current[first]?.focus();
  };

  // Send the card for review (US-07); the card image is made only once it has been sent.
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current || !agreed) return;
    setAlert(null);
    const found = validateFields(values);
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      focusFirstError(found);
      return;
    }
    if (config.turnstileSiteKey && !turnstileToken) {
      setAlert('請先完成上方的人機驗證。');
      return;
    }
    const content: CardContent = {
      nickname: values.nickname.trim(),
      text_gratitude: values.text_gratitude.trim(),
      text_anticipate: values.text_anticipate.trim(),
    };
    submitting.current = true;
    setSending(true);
    try {
      await api.submitCard({
        ...content,
        agreed_to_publish: true,
        honeypot,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      });
      trackEvent('create_card');
      setValues(EMPTY);
      setExceeded({});
      setErrors({});
      setAgreed(false);
      setResult(content);
    } catch (err) {
      // A field the server rejected is shown on that field, like the form's own checks.
      const mapped = serverFieldErrors(err);
      if (mapped) {
        setErrors(mapped);
        focusFirstError(mapped);
      } else {
        setAlert(describeError(err));
      }
    } finally {
      submitting.current = false;
      setSending(false);
      if (config.turnstileSiteKey) setTurnstileReset((n) => n + 1);
    }
  };

  const field = (name: CardField, label: string, multiline: boolean, hint?: string, labelEn?: string) => {
    const count = displayLength(name, values[name]);
    const max = LIMITS[name];
    const error = errors[name];
    const describedBy = [`${name}-count`, hint ? `${name}-hint` : '', error ? `${name}-error` : ''].filter(Boolean).join(' ');
    const common = {
      id: `card-${name}`,
      name,
      value: values[name],
      onChange: onChange(name),
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedBy,
    };
    return (
      <div className={`cardform__field ${multiline ? 'cardform__field--text' : ''} ${error ? 'has-error' : ''}`}>
        <label htmlFor={`card-${name}`} className={multiline ? 'cardform__prompt' : 'cardform__label'}>
          {label}
          {labelEn && (
            <span className="cardform__prompt-en" aria-hidden="true">
              {labelEn}
            </span>
          )}
        </label>
        {multiline ? (
          <textarea
            {...common}
            ref={(el) => {
              fieldRefs.current[name] = el;
            }}
            rows={4}
            placeholder="在這裡寫下你的話…"
          />
        ) : (
          <input
            {...common}
            ref={(el) => {
              fieldRefs.current[name] = el;
            }}
            type="text"
            autoComplete="nickname"
            placeholder="暱稱或名字"
          />
        )}
        <div className="cardform__meta">
          {hint && (
            <span id={`${name}-hint`} className="cardform__hint">
              {hint}
            </span>
          )}
          {error && (
            <span id={`${name}-error`} className="cardform__error">
              {FIELD_ERROR_TEXT[error]}
            </span>
          )}
          {exceeded[name] && !error && (
            <span className="cardform__error">
              {exceeded[name] === 'breaks' ? `最多換行 ${PROMPT_MAX_LINE_BREAKS} 次，多的換行沒有輸入` : '已達字數上限，超出的部分沒有輸入'}
            </span>
          )}
          <span id={`${name}-count`} className={`cardform__count ${count >= max ? 'is-full' : ''}`}>
            <span className="sr-only">已輸入字數</span>
            {count} / {max}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Reveal>
        <form className="cardform" onSubmit={onSubmit} noValidate aria-describedby="cardform-guide">
          <div className="cardform__card">
            {/* Styled like the printed FORWARD 卡 (11/04): title, prompts with their English lines. */}
            <p className="cardform__kicker" aria-hidden="true">
              FORWARD CARD
            </p>
            {field('text_gratitude', PROMPTS.gratitude, true, PROMPT_HINT, PROMPTS_EN.gratitude)}
            {field('text_anticipate', PROMPTS.anticipate, true, PROMPT_HINT, PROMPTS_EN.anticipate)}
            {field('nickname', '你的名稱', false)}

            {/* Bot trap: invisible to people and assistive tech; bots tend to fill it. */}
            <div className="cardform__trap" aria-hidden="true">
              <label htmlFor="card-website">Website</label>
              <input id="card-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>
          </div>

          {/* Beside the card: the two guiding questions, then the tips, consent and button. */}
          <div className="cardform__side">
            <ol className="cardform__steps" aria-label="寫卡引導">
              {RESPOND_GUIDE.map((item) => (
                <li key={item.title}>
                  <span className="cardform__step-icon" aria-hidden="true">
                    <GuideIcon kind={item.icon} />
                  </span>
                  <span>
                    <strong className="cardform__step-title">{item.title}</strong>
                    <span className="cardform__step-text">{item.text}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div id="cardform-guide" className="cardform__guide">
              <p className="cardform__guide-title">寫卡小提醒</p>
              <p>
                分享至線上回應牆後，你的內容將公開顯示。請勿留下自己或他人的電話、地址、LINE ID 等個人資料；提到家人、孩子、健康或其他私密內容時，也請斟酌描述。
              </p>
            </div>

            <label className="cardform__consent">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={sending} />
              {/* BB's sharing line, then Legal's consent statement (privacy policy §10, which ZY
                  asked to be a checkbox) word for word, in one box (11/04). Legal's words are not
                  edited; the link to the policy sits after them. */}
              <span>
                我了解分享後，這張 FORWARD 卡將公開顯示於線上回應牆。我已詳閱並瞭解上述條款，同意 The Hope 教會依上述內容蒐集、處理及利用我的個人資料。
                <a href={pageUrl('privacy/')} target="_blank" rel="noopener">
                  隱私與資料說明
                </a>
              </span>
            </label>
            {config.turnstileSiteKey && <Turnstile siteKey={config.turnstileSiteKey} onToken={setTurnstileToken} resetKey={turnstileReset} />}

            <div className="cardform__submit">
              <button
                type="submit"
                className="btn btn--gold btn--lg"
                disabled={!agreed || sending}
                aria-describedby={!agreed ? 'card-consent-needed' : undefined}
              >
                {sending ? (
                  <>
                    <span className="spinner" /> 送出中…
                  </>
                ) : (
                  '分享到 Hope Nation 回應牆'
                )}
              </button>
              {!agreed && (
                <span id="card-consent-needed" className="cardform__hint">
                  勾選同意後即可送出
                </span>
              )}
            </div>
            <div role="alert" className="cardform__alert">
              {alert}
            </div>
          </div>
        </form>
      </Reveal>

      <Modal open={result !== null} onClose={() => setResult(null)} labelledBy="card-result-title" className="card-result-modal">
        {result && <CardResult content={result} />}
      </Modal>
    </>
  );
}

/** Line icons for the two guiding questions: a heart for gratitude, a sunrise for what's ahead. */
function GuideIcon({ kind }: { kind: 'heart' | 'sunrise' }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {kind === 'heart' ? (
        <path d="M12 20s-7.5-4.4-7.5-10.1A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.5 2.7C19.5 15.6 12 20 12 20z" />
      ) : (
        <path d="M3 18.5h18M7 18.5a5 5 0 0 1 10 0M12 7.5V10M5.6 11.6l1.7 1.7M18.4 11.6l-1.7 1.7M8 21.5h8" />
      )}
    </svg>
  );
}

function CardResult({ content }: { content: CardContent }) {
  const [format, setFormat] = useState<CardFormat>('square');
  const [declaration, setDeclaration] = useState(CARD_STYLES[0]!);
  const [image, setImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [rendering, setRendering] = useState(true);
  const { show: showToast, element: toastElement } = useToast();
  const hostRef = useRef<HTMLDivElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRendering(true);
    renderCardBlob(content, format, declaration)
      .then((blob) => {
        if (cancelled) return;
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = URL.createObjectURL(blob);
        setImage({ url: urlRef.current, blob });
      })
      .catch(() => {
        if (!cancelled) showToast('FORWARD 卡圖片產生失敗，請再試一次');
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
    };
  }, [content, format, declaration, showToast]);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  const download = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `forward-card-${format}.png`;
    (hostRef.current ?? document.body).appendChild(link);
    link.click();
    link.remove();
    showToast('已下載 FORWARD 卡圖片');
  };

  const share = async () => {
    if (!image) return;
    const siteUrl = new URL(pageUrl(), window.location.origin).toString();
    const file = new File([image.blob], 'forward-card.png', { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '我的 FORWARD 卡', text: 'FORWARD 2026 · There is more' });
        showToast('已開啟分享');
      } else if (navigator.share) {
        await navigator.share({ title: 'FORWARD 2026 · There is more', url: siteUrl });
        showToast('已開啟分享');
      } else {
        await navigator.clipboard.writeText(siteUrl);
        showToast('已複製網站連結');
      }
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') showToast('無法分享，請改用下載 FORWARD 卡');
    }
  };

  return (
    <div className="card-result" ref={hostRef}>
      <div className="card-result__intro">
        <p className="kicker">Your Card · 你的 FORWARD 卡</p>
        <h3 id="card-result-title" className="card-result__title display-zh">
          謝謝你寫下這張 FORWARD 卡！
        </h3>
        <div className="card-result__sent" role="status">
          <p className="card-result__sent-title display-zh">已成功送出！</p>
          <p>每一張 FORWARD 卡都會先經過文字審核，完成後就會出現在 Hope Nation 回應牆。</p>
        </div>
        <p className="card-result__cta">恭喜完成！立即下載專屬 FORWARD 卡保存，或分享到社群！</p>
      </div>

      <div className={`card-result__preview card-result__preview--${format}`} aria-busy={rendering}>
        {image && <img src={image.url} alt="你的 FORWARD 卡圖片預覽" />}
        {rendering && (
          <div className="card-result__rendering">
            <span className="spinner" /> 產生 FORWARD 卡中…
          </div>
        )}
      </div>

      <fieldset className="declarations">
        <legend className="declarations__legend display-zh">選擇你的 FORWARD 卡樣式</legend>
        {CARD_STYLES.map((d) => (
          <label key={d.id} className={`declarations__item ${declaration.id === d.id ? 'is-on' : ''}`}>
            <input type="radio" name="card-declaration" value={d.id} checked={declaration.id === d.id} onChange={() => setDeclaration(d)} />
            <span className="declarations__swatch" style={{ background: PALETTE_SWATCH[d.palette] }} aria-hidden="true" />
            <span className="declarations__text">
              <span className="declarations__en">{d.en}</span>
              <strong>{d.title}</strong>
              <span>{d.text}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="card-result__controls">
        <fieldset className="segmented">
          <legend className="sr-only">圖片尺寸</legend>
          {(Object.keys(CARD_FORMATS) as CardFormat[]).map((f) => (
            <label key={f} className={format === f ? 'is-on' : ''}>
              <input type="radio" name="card-format" value={f} checked={format === f} onChange={() => setFormat(f)} />
              {CARD_FORMATS[f].label}
            </label>
          ))}
        </fieldset>
      </div>

      <div className="card-result__actions">
        <button type="button" className="btn btn--gold" onClick={download} disabled={!image || rendering}>
          下載 FORWARD 卡
        </button>
        <button type="button" className="btn btn--outline" onClick={share} disabled={!image || rendering}>
          分享
        </button>
      </div>
      <p className="note">手機可長按上方圖片儲存到相簿</p>
      <a className="card-result__wall" href={pageUrl('cards/')}>
        看看大家寫的 FORWARD 卡 →
      </a>
      {toastElement}
    </div>
  );
}

/** Map the server's per-field rejections (US-07) onto the form's own error codes. */
function serverFieldErrors(err: unknown): DraftErrors | null {
  if (!(err instanceof ApiError) || !err.fields) return null;
  const mapped: DraftErrors = {};
  for (const field of Object.keys(LIMITS) as CardField[]) {
    const code = err.fields[field];
    if (code) mapped[field] = code === 'too_long' || code === 'invalid_chars' ? code : 'required';
  }
  return Object.keys(mapped).length ? mapped : null;
}

/** Newest published cards shown on the home page; the rest are on the wall. */
const TEASER_COUNT = 6;

function CardsTeaser() {
  const [data, setData] = useState<ListCardsResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const now = Date.now();

  useEffect(() => {
    const controller = new AbortController();
    api
      .listCards({ page: 1, limit: TEASER_COUNT }, controller.signal)
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <Reveal className="teaser">
      <div className="teaser__head">
        <h3 className="teaser__title">
          Hope Nation 回應牆
          {data && <span className="teaser__count">已有 {data.pagination.total_count} 張 FORWARD 卡公開</span>}
        </h3>
        <a className="btn btn--outline btn--sm" href={pageUrl('cards/')}>
          看全部 FORWARD 卡 →
        </a>
      </div>
      {!failed && (
        <div className="teaser__grid">
          {data
            ? data.items.map((card, i) => <ForwardCardView key={card.id} card={card} index={i} now={now} />)
            : Array.from({ length: TEASER_COUNT }, (_, i) => <ForwardCardSkeleton key={i} />)}
        </div>
      )}
      {data && data.items.length === 0 && <p className="note">還沒有公開的 FORWARD 卡，成為第一個寫卡的人！</p>}
    </Reveal>
  );
}

function Finale() {
  return (
    <div id={RAIL_GIVE.id} className="finale" tabIndex={-1} aria-labelledby="finale-title">
      <div className="wrap finale__inner">
        <Reveal>
          <p className="finale__kicker">{FINALE.kicker}</p>
          <h3 id="finale-title" className="finale__title">
            {FINALE.title[0]}
            <br />
            {FINALE.title[1]}
          </h3>
        </Reveal>
        <Reveal className="finale__side" delay={0.1}>
          <p className="finale__body">{FINALE.body}</p>
          <GiveButton placement="respond_finale" label={FINALE.cta} className="btn btn--dark btn--lg finale__give" disabledHint={FINALE.disabled} />
          {!config.giveUrl && <p className="finale__hint">{FINALE.disabled}</p>}
          <div className="finale__prayer">
            <p className="finale__body">{PRAYER_LINK.lead}</p>
            <a className="btn btn--dark btn--lg finale__prayer-link" href={config.prayerMapUrl} target="_blank" rel="noopener noreferrer">
              {PRAYER_LINK.label}
              <span aria-hidden="true">↗</span>
              <span className="sr-only">（在新分頁開啟）</span>
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
