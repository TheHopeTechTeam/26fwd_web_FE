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
import { PROMPTS, PROMPTS_EN, renderCardBlob, type CardContent, type CardFormat } from '../lib/canvasCard';
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
            <span className="chapter-step">第三步</span>Respond 我願意這樣回應神…
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
        <RespondActions />
        <CardsTeaser />
      </div>
    </section>
  );
}

const EMPTY = { nickname: '', text_gratitude: '', text_anticipate: '' };


function ForwardCardForm({ cardLabel }: { cardLabel: string }) {
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
      <Reveal id="respond-part-card" className="respond-actions__card">
        <form className="cardform" onSubmit={onSubmit} noValidate aria-describedby="cardform-guide">
          <div className="cardform__card-col">
            <p className="respond-actions__label">{cardLabel}</p>
            <div className="cardform__card tone-dark">
              {/* Styled like the printed FORWARD 卡 (11/04): title, prompts with their English lines. */}
              <p className="cardform__kicker" aria-hidden="true">
                FORWARD CARD
              </p>
              {/* Wide screens: the two prompts and the name on the left; tips, consent and button on the right (11/05). */}
              <div className="cardform__write">
                {/* Under each box, its guiding question (11/05, in place of the half-width counting note). */}
                {field('text_gratitude', PROMPTS.gratitude, true, RESPOND_GUIDE[0]?.text, PROMPTS_EN.gratitude)}
                {field('text_anticipate', PROMPTS.anticipate, true, RESPOND_GUIDE[1]?.text, PROMPTS_EN.anticipate)}
                {field('nickname', '你的名稱', false)}
              </div>
              <div className="cardform__send">

                {/* Bot trap: invisible to people and assistive tech; bots tend to fill it. */}
                <div className="cardform__trap" aria-hidden="true">
                  <label htmlFor="card-website">Website</label>
                  <input id="card-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </div>

                {/* Tips, consent and button inside the card (11/05). */}
                <div id="cardform-guide" className="cardform__guide">
                  <p className="cardform__guide-title">寫卡小提醒</p>
                  <p>
                    送出後，你的內容將公開顯示在 2026 回應牆。請勿留下自己或他人的電話、地址、LINE ID 等個人資料；提到家人、孩子、健康或其他私密內容時，也請斟酌描述。
                  </p>
                </div>

                <label className="cardform__consent">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={sending} />
                  {/* BB's sharing line, then Legal's consent statement (privacy policy §10, which ZY
                      asked to be a checkbox) word for word, in one box (11/04). Legal's words are not
                      edited; the link to the policy sits after them. */}
                  <span>
                    我了解送出後，這張 FORWARD 卡將經過審核，並公開顯示於 2026 回應牆。我已詳閱並瞭解上述條款，同意 The Hope 教會依上述內容蒐集、處理及利用我的個人資料。
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
                      '分享到 2026 回應牆'
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
function CardResult({ content }: { content: CardContent }) {
  // One size only, 1:1 (11/06, team choice): the 貼文／限時動態 choice went.
  const format: CardFormat = 'square';
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

  return (
    <div className="card-result tone-light" ref={hostRef}>
      <div className="card-result__intro">
        <h3 id="card-result-title" className="card-result__title display-zh">
          謝謝你寫下這張 FORWARD 卡！
        </h3>
        <div className="card-result__sent" role="status">
          <p className="card-result__sent-title display-zh">已成功送出！</p>
          <p>每一份 FORWARD 卡都會先經過文字審核，通過後就會出現在 2026 回應牆。</p>
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
            <span className="declarations__text">
              <span className="declarations__en">{d.en}</span>
              <strong>{d.title}</strong>
              <span className="declarations__sentence">{d.text}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {/* Download, and Give beside it (11/06: no 分享 button). */}
      <div className="card-result__actions">
        <button type="button" className="btn btn--gold" onClick={download} disabled={!image || rendering}>
          下載 FORWARD 卡
        </button>
        <GiveButton
          placement="card_result"
          label={FINALE.cta}
          className="btn card-result__give"
          disabledHint={FINALE.disabled}
        />
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
          2026 回應牆
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

/**
 * The two ways to respond (11/05, team choice): 參與奉獻 on the left and the FORWARD 卡 on the
 * right, the card wider, so nobody has to finish the card to reach Give. The wide card splits
 * into two columns inside, which keeps it short; both sides end level. Narrower screens put Give
 * first as a band, then the card. The rail's Give stop lands here.
 */
type RespondPart = 'give' | 'card';

const RESPOND_PARTS: { id: RespondPart; label: string }[] = [
  { id: 'give', label: '我要參與奉獻' },
  { id: 'card', label: '我要填寫線上 FORWARD 卡' },
];

/**
 * Both ways to respond. Below 900px, where the two would stack, two buttons side by side show
 * one at a time, the FORWARD 卡 first (11/06, the user's choice); wider screens show both and
 * hide the buttons. The hidden side stays mounted, so a half-written card is kept.
 */
function RespondActions() {
  const [part, setPart] = useState<RespondPart>('card');
  // Arriving at #give opens the Give side: the rail's 我要參與奉獻 stop focuses this block, and a
  // shared link may land on it.
  useEffect(() => {
    if (window.location.hash === `#${RAIL_GIVE.id}`) setPart('give');
  }, []);
  const label = (id: RespondPart) => RESPOND_PARTS.find((p) => p.id === id)?.label ?? '';

  return (
    <div
      id={RAIL_GIVE.id}
      className="respond-actions"
      data-show={part}
      role="group"
      aria-label="兩種回應方式"
      tabIndex={-1}
      onFocus={(e) => {
        if (e.target === e.currentTarget) setPart('give');
      }}
    >
      <div className="respond-actions__switch">
        {RESPOND_PARTS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`respond-actions__tab ${part === p.id ? 'is-on' : ''}`}
            aria-pressed={part === p.id}
            aria-controls={`respond-part-${p.id}`}
            onClick={() => setPart(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div id="respond-part-give" className="respond-actions__give">
        <p className="respond-actions__label">{label('give')}</p>
        <GivePanel />
      </div>
      <ForwardCardForm cardLabel={label('card')} />
    </div>
  );
}

/** 參與奉獻 (There is More): the Give call and the Prayer Map link, as a 金黃 band (11/05). */
function GivePanel() {
  return (
    <div className="finale" aria-labelledby="finale-title">
      <div className="finale__head">
        <p className="finale__kicker">{FINALE.kicker}</p>
        <h3 id="finale-title" className="finale__title">
          {FINALE.title[0]}
          <br />
          {FINALE.title[1]}
        </h3>
      </div>
      <p className="finale__body">{FINALE.body}</p>
      <div className="finale__actions">
        <GiveButton placement="respond_finale" label={FINALE.cta} className="btn btn--dark btn--lg finale__give" disabledHint={FINALE.disabled} />
        <div className="finale__prayer">
          <p className="finale__body">{PRAYER_LINK.lead}</p>
          <a className="btn btn--dark btn--lg finale__prayer-link" href={config.prayerMapUrl} target="_blank" rel="noopener noreferrer">
            {PRAYER_LINK.label}
            <span aria-hidden="true">↗</span>
            <span className="sr-only">（在新分頁開啟）</span>
          </a>
        </div>
      </div>
    </div>
  );
}
