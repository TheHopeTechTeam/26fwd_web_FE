import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { api, ApiError, describeError, type ListCardsResponse } from '../api';
import { ForwardCardSkeleton, ForwardCardView } from '../components/ForwardCardView';
import { GiveButton } from '../components/GiveButton';
import { Modal } from '../components/Modal';
import { Reveal } from '../components/Reveal';
import { useToast } from '../components/Toast';
import { Turnstile } from '../components/Turnstile';
import { config, pageUrl } from '../config/env';
import { DECLARATIONS, FINALE, PRAYER_LINK, RESPOND, RESPOND_STEPS } from '../data/content';
import { trackEvent } from '../lib/analytics';
import { CARD_FORMATS, PALETTE_SWATCH, PROMPTS, renderCardBlob, type CardContent, type CardFormat } from '../lib/canvasCard';
import {
  FIELD_ERROR_TEXT,
  LIMITS,
  codePointLength,
  normalizeNewlines,
  truncateCodePoints,
  validateFields,
  type CardField,
  type DraftErrors,
} from '../lib/text';
import './Respond.css';

/**
 * 04 · Respond: Forward Card (US-07/09), a peek at the wall (US-10), and Give (US-12).
 * Making the personal card and publishing it are separate steps (#23: an unpublished card
 * can still be saved): the card is drawn in the browser first, and only a visitor who then
 * agrees to publish sends it to the server for review.
 */
export function Respond() {
  return (
    <section id="respond" className="chapter respond tone-light" tabIndex={-1} aria-labelledby="respond-title">
      <div className="wrap">
        <Reveal className="chapter__head">
          <p className="kicker">
            <span className="eyebrow-index">03</span> · Respond 回應
          </p>
          <h2 id="respond-title" className="chapter__title respond__title">
            {RESPOND.title}
          </h2>
          <p className="lead">{RESPOND.lead}</p>
        </Reveal>
        <ForwardCardForm />
        <CardsTeaser />
      </div>
      <Finale />
    </section>
  );
}

const EMPTY = { nickname: '', text_gratitude: '', text_anticipate: '' };

function ForwardCardForm() {
  const [values, setValues] = useState<Record<CardField, string>>(EMPTY);
  const [honeypot, setHoneypot] = useState('');
  const [exceeded, setExceeded] = useState<Partial<Record<CardField, boolean>>>({});
  const [errors, setErrors] = useState<DraftErrors>({});
  const [result, setResult] = useState<CardContent | null>(null);
  const fieldRefs = useRef<Partial<Record<CardField, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  const onChange = (field: CardField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const normalized = normalizeNewlines(event.target.value);
    const capped = truncateCodePoints(normalized, LIMITS[field]);
    setValues((v) => ({ ...v, [field]: capped }));
    setExceeded((x) => ({ ...x, [field]: capped !== normalized }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const focusFirstError = (found: DraftErrors) => {
    const first = (['text_gratitude', 'text_anticipate', 'nickname'] as CardField[]).find((f) => found[f]);
    if (first) fieldRefs.current[first]?.focus();
  };

  // Making the card is local: nothing is sent until the visitor chooses to publish it.
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateFields(values);
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      focusFirstError(found);
      return;
    }
    trackEvent('create_card');
    setResult({ nickname: values.nickname.trim(), text_gratitude: values.text_gratitude.trim(), text_anticipate: values.text_anticipate.trim() });
  };

  const onPublished = () => {
    setValues(EMPTY);
    setExceeded({});
    setErrors({});
  };

  // The server rejected a field: close the card so the visitor can fix the form.
  const onFieldErrors = (found: DraftErrors) => {
    setResult(null);
    setErrors(found);
    requestAnimationFrame(() => focusFirstError(found));
  };

  const field = (name: CardField, label: string, multiline: boolean, hint?: string) => {
    const count = codePointLength(values[name]);
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
          {exceeded[name] && !error && <span className="cardform__error">已達 {max} 字上限，超出的部分沒有輸入</span>}
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
            <p className="cardform__kicker" aria-hidden="true">
              <span>FORWARD CARD</span>
              <span>2026</span>
            </p>
            {field('text_gratitude', PROMPTS.gratitude, true)}
            {field('text_anticipate', PROMPTS.anticipate, true)}
            {field('nickname', '署名', false, '可以用暱稱，不需要真實姓名')}

            {/* Bot trap: invisible to people and assistive tech; bots tend to fill it. */}
            <div className="cardform__trap" aria-hidden="true">
              <label htmlFor="card-website">Website</label>
              <input id="card-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>
          </div>

          <div className="cardform__side">
            <ol className="cardform__steps" aria-label="寫卡三步驟">
              {RESPOND_STEPS.map((step, i) => (
                <li key={step.title}>
                  <span className="cardform__step-num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <strong className="cardform__step-title">{step.title}</strong>
                    <span className="cardform__step-text">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div id="cardform-guide" className="cardform__guide tone-dark">
              <p className="cardform__guide-title">寫卡小提醒</p>
              <p className="cardform__guide-lead">只下載保存的卡片不會送出；打算公開到卡片牆的話，請留意：</p>
              <ul>
                <li>請勿寫下自己或他人的電話、地址、LINE ID 等聯絡方式。</li>
                <li>提到家人、孩子、健康等私密細節時，請斟酌描述。</li>
              </ul>
            </div>

            <div className="cardform__submit">
              <button type="submit" className="btn btn--gold btn--lg">
                製作我的卡片
              </button>
            </div>
          </div>
        </form>
      </Reveal>

      <Modal open={result !== null} onClose={() => setResult(null)} labelledBy="card-result-title" className="card-result-modal">
        {result && (
          <>
            <CardResult content={result} />
            <PublishCard content={result} honeypot={honeypot} onPublished={onPublished} onFieldErrors={onFieldErrors} />
          </>
        )}
      </Modal>
    </>
  );
}

function CardResult({ content }: { content: CardContent }) {
  const [format, setFormat] = useState<CardFormat>('square');
  const [declaration, setDeclaration] = useState(DECLARATIONS[0]!);
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
        if (!cancelled) showToast('卡片圖片產生失敗，請再試一次');
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
    showToast('已下載卡片圖片');
  };

  const share = async () => {
    if (!image) return;
    const siteUrl = new URL(pageUrl(), window.location.origin).toString();
    const file = new File([image.blob], 'forward-card.png', { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Forward Card', text: 'FORWARD 2026 · There is more' });
        showToast('已開啟分享');
      } else if (navigator.share) {
        await navigator.share({ title: 'FORWARD 2026 · There is more', url: siteUrl });
        showToast('已開啟分享');
      } else {
        await navigator.clipboard.writeText(siteUrl);
        showToast('已複製網站連結');
      }
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') showToast('無法分享，請改用下載卡片');
    }
  };

  return (
    <div className="card-result" ref={hostRef}>
      <div className="card-result__intro">
        <p className="kicker">Your Card · 你的卡片</p>
        <h3 id="card-result-title" className="card-result__title display-zh">
          謝謝你寫下這張卡片！
        </h3>
        <p className="card-result__cta">恭喜完成！立即下載專屬 Forward Card 保存，或分享到社群！</p>
      </div>

      <div className={`card-result__preview card-result__preview--${format}`} aria-busy={rendering}>
        {image && <img src={image.url} alt="你的 Forward Card 圖片預覽" />}
        {rendering && (
          <div className="card-result__rendering">
            <span className="spinner" /> 產生卡片中…
          </div>
        )}
      </div>

      <fieldset className="declarations">
        <legend className="declarations__legend display-zh">選一段信心宣告</legend>
        {DECLARATIONS.map((d) => (
          <label key={d.id} className={`declarations__item ${declaration.id === d.id ? 'is-on' : ''}`}>
            <input type="radio" name="card-declaration" value={d.id} checked={declaration.id === d.id} onChange={() => setDeclaration(d)} />
            <span className="declarations__swatch" style={{ background: PALETTE_SWATCH[d.palette] }} aria-hidden="true" />
            <span className="declarations__text">
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
          下載卡片
        </button>
        <button type="button" className="btn btn--outline" onClick={share} disabled={!image || rendering}>
          分享
        </button>
      </div>
      <p className="note">手機可長按上方圖片儲存到相簿。下載或分享個人卡片，不會公開到卡片牆。</p>
      {toastElement}
    </div>
  );
}

interface PublishCardProps {
  content: CardContent;
  honeypot: string;
  onPublished: () => void;
  onFieldErrors: (errors: DraftErrors) => void;
}

/** The optional second step: consent, then send the card for review (US-07). */
function PublishCard({ content, honeypot, onPublished, onFieldErrors }: PublishCardProps) {
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const submitting = useRef(false);

  const publish = async () => {
    if (submitting.current || !agreed) return;
    setError(null);
    if (config.turnstileSiteKey && !turnstileToken) {
      setError('請先完成上方的人機驗證。');
      return;
    }
    submitting.current = true;
    setStatus('submitting');
    try {
      await api.submitCard({
        ...content,
        agreed_to_publish: true,
        honeypot,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      });
      setStatus('done');
      onPublished();
    } catch (err) {
      setStatus('idle');
      if (err instanceof ApiError && err.fields) {
        const mapped: DraftErrors = {};
        for (const field of Object.keys(LIMITS) as CardField[]) {
          const code = err.fields[field];
          if (code) mapped[field] = code === 'too_long' || code === 'invalid_chars' ? code : 'required';
        }
        if (Object.keys(mapped).length) {
          onFieldErrors(mapped);
          return;
        }
      }
      setError(describeError(err));
    } finally {
      submitting.current = false;
      if (config.turnstileSiteKey) setTurnstileReset((n) => n + 1);
    }
  };

  if (status === 'done') {
    return (
      <div className="card-publish card-publish--done" role="status">
        <p className="card-publish__title display-zh">已送出到卡片牆！</p>
        <p>卡片會先經過審核，通過後就會出現在 Forward Cards 卡片牆。</p>
        <a className="card-publish__wall" href={pageUrl('cards/')}>
          看看大家寫的卡片 →
        </a>
      </div>
    );
  }

  return (
    <div className="card-publish">
      <p className="card-publish__title display-zh">也想公開到卡片牆嗎？</p>
      <p className="card-publish__lead">和大家一起分享你的感謝與期待。不公開也沒關係，你的卡片已經可以下載保存。</p>
      <label className="cardform__consent">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={status === 'submitting'} />
        <span>
          我同意將這張卡片（署名與兩段內容）公開分享於 FORWARD 網站的卡片牆，並了解卡片需經審核後才會公開。
          <a href={pageUrl('privacy/')} target="_blank" rel="noopener">
            隱私與資料說明
          </a>
        </span>
      </label>
      {config.turnstileSiteKey && <Turnstile siteKey={config.turnstileSiteKey} onToken={setTurnstileToken} resetKey={turnstileReset} />}
      <div className="cardform__submit">
        <button
          type="button"
          className="btn btn--outline"
          onClick={publish}
          disabled={!agreed || status === 'submitting'}
          aria-describedby={!agreed ? 'publish-consent-needed' : undefined}
        >
          {status === 'submitting' ? (
            <>
              <span className="spinner" /> 送出中…
            </>
          ) : (
            '公開到卡片牆'
          )}
        </button>
        {!agreed && (
          <span id="publish-consent-needed" className="cardform__hint">
            勾選同意後即可送出
          </span>
        )}
      </div>
      <div role="alert" className="cardform__alert">
        {error}
      </div>
    </div>
  );
}

function CardsTeaser() {
  const [data, setData] = useState<ListCardsResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const now = Date.now();

  useEffect(() => {
    const controller = new AbortController();
    api
      .listCards({ page: 1, limit: 3 }, controller.signal)
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
          Forward Cards
          {data && <span className="teaser__count">已有 {data.pagination.total_count} 張卡片公開</span>}
        </h3>
        <a className="btn btn--outline btn--sm" href={pageUrl('cards/')}>
          看全部卡片 →
        </a>
      </div>
      {!failed && (
        <div className="teaser__grid">
          {data
            ? data.items.map((card, i) => <ForwardCardView key={card.id} card={card} index={i} now={now} />)
            : [0, 1, 2].map((i) => <ForwardCardSkeleton key={i} />)}
        </div>
      )}
      {data && data.items.length === 0 && <p className="note">還沒有公開的卡片，成為第一個寫卡的人！</p>}
    </Reveal>
  );
}

function Finale() {
  return (
    <div className="finale" aria-labelledby="finale-title">
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
