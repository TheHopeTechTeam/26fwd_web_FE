import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { api, ApiError, describeError, type ListCardsResponse } from '../api';
import { ForwardCardSkeleton, ForwardCardView } from '../components/ForwardCardView';
import { GiveButton } from '../components/GiveButton';
import { Modal } from '../components/Modal';
import { Reveal } from '../components/Reveal';
import { useToast } from '../components/Toast';
import { Turnstile } from '../components/Turnstile';
import { config, pageUrl } from '../config/env';
import { FINALE, RESPOND } from '../data/content';
import { CARD_FORMATS, CARD_THEMES, PROMPTS, renderCardBlob, type CardContent, type CardFormat, type CardTheme } from '../lib/canvasCard';
import {
  FIELD_ERROR_TEXT,
  LIMITS,
  codePointLength,
  normalizeNewlines,
  truncateCodePoints,
  validateDraft,
  type CardField,
  type DraftErrors,
} from '../lib/text';
import './Respond.css';

/** 04 · Respond: Forward Card (US-07/09), a peek at the wall (US-10), and Give (US-12). */
export function Respond() {
  return (
    <section id="respond" className="chapter respond" tabIndex={-1} aria-labelledby="respond-title">
      <div className="wrap">
        <Reveal className="chapter__head">
          <p className="kicker">
            <span className="eyebrow-index">04</span> · Respond 回應
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
  const [agreed, setAgreed] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [exceeded, setExceeded] = useState<Partial<Record<CardField, boolean>>>({});
  const [errors, setErrors] = useState<DraftErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [result, setResult] = useState<CardContent | null>(null);
  const submitting = useRef(false);
  const fieldRefs = useRef<Partial<Record<CardField, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  const onChange = (field: CardField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const normalized = normalizeNewlines(event.target.value);
    const capped = truncateCodePoints(normalized, LIMITS[field]);
    setValues((v) => ({ ...v, [field]: capped }));
    setExceeded((x) => ({ ...x, [field]: capped !== normalized }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    setFormError(null);

    const found = validateDraft({ ...values, agreed_to_publish: agreed });
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      const first = (['text_gratitude', 'text_anticipate', 'nickname'] as CardField[]).find((f) => found[f]);
      if (first) fieldRefs.current[first]?.focus();
      return;
    }
    if (config.turnstileSiteKey && !turnstileToken) {
      setFormError('請先完成下方的人機驗證。');
      return;
    }

    submitting.current = true;
    setStatus('submitting');
    const payload = {
      nickname: values.nickname.trim(),
      text_gratitude: values.text_gratitude.trim(),
      text_anticipate: values.text_anticipate.trim(),
      agreed_to_publish: true as const,
      honeypot,
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    };
    try {
      await api.submitCard(payload);
      setResult({ nickname: payload.nickname, text_gratitude: payload.text_gratitude, text_anticipate: payload.text_anticipate });
      setValues(EMPTY);
      setAgreed(false);
      setExceeded({});
      setErrors({});
    } catch (error) {
      setFormError(describeError(error));
      if (error instanceof ApiError && error.fields) {
        const mapped: DraftErrors = {};
        for (const field of Object.keys(LIMITS) as CardField[]) {
          const code = error.fields[field];
          if (code) mapped[field] = code === 'too_long' || code === 'invalid_chars' ? code : 'required';
        }
        setErrors(mapped);
      }
    } finally {
      submitting.current = false;
      setStatus('idle');
      if (config.turnstileSiteKey) setTurnstileReset((n) => n + 1);
    }
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
      disabled: status === 'submitting',
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
            <div id="cardform-guide" className="cardform__guide">
              <p className="cardform__guide-title">寫卡小提醒</p>
              <ul>
                <li>請勿寫下自己或他人的電話、地址、LINE ID 等聯絡方式。</li>
                <li>提到家人、孩子、健康等私密細節時，請斟酌描述。</li>
                <li>卡片會先由團隊審閱，通過後才會公開；不符合主題的內容可能不會刊出。</li>
              </ul>
            </div>

            <label className={`cardform__consent ${errors.agreed_to_publish ? 'has-error' : ''}`}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={status === 'submitting'} />
              <span>
                我同意將這張卡片（署名與兩段內容）公開分享於 FORWARD 網站的卡片牆，並了解卡片需經團隊審閱後才會公開。
                <a href={pageUrl('privacy/')} target="_blank" rel="noopener">
                  隱私與資料說明
                </a>
              </span>
            </label>

            {config.turnstileSiteKey && (
              <Turnstile siteKey={config.turnstileSiteKey} onToken={setTurnstileToken} resetKey={turnstileReset} />
            )}

            <div className="cardform__submit">
              <button type="submit" className="btn btn--gold btn--lg" disabled={!agreed || status === 'submitting'} aria-describedby={!agreed ? 'consent-needed' : undefined}>
                {status === 'submitting' ? (
                  <>
                    <span className="spinner" /> 送出中…
                  </>
                ) : (
                  '送出卡片'
                )}
              </button>
              {!agreed && (
                <span id="consent-needed" className="cardform__hint">
                  勾選同意後即可送出
                </span>
              )}
            </div>
            <div role="alert" className="cardform__alert">
              {formError}
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

function CardResult({ content }: { content: CardContent }) {
  const [format, setFormat] = useState<CardFormat>('square');
  const [theme, setTheme] = useState<CardTheme>('gold');
  const [image, setImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [rendering, setRendering] = useState(true);
  const { show: showToast, element: toastElement } = useToast();
  const hostRef = useRef<HTMLDivElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRendering(true);
    renderCardBlob(content, format, theme)
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
  }, [content, format, theme, showToast]);

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
        <p className="kicker">Sent · 已送出</p>
        <h3 id="card-result-title" className="card-result__title display-zh">
          謝謝你寫下這張卡片！
        </h3>
        <p className="card-result__status">卡片已送出，將由團隊審閱後公開在 Forward Cards 卡片牆。</p>
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
        <fieldset className="swatches">
          <legend className="sr-only">卡片配色</legend>
          {(Object.keys(CARD_THEMES) as CardTheme[]).map((t) => (
            <label key={t} className={theme === t ? 'is-on' : ''} title={CARD_THEMES[t].label}>
              <input type="radio" name="card-theme" value={t} checked={theme === t} onChange={() => setTheme(t)} />
              <span style={{ background: CARD_THEMES[t].swatch }} aria-hidden="true" />
              <span className="sr-only">{CARD_THEMES[t].label}</span>
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
      <p className="note">手機可長按上方圖片儲存到相簿。下載或分享個人卡片，不代表卡片已出現在公開卡片牆。</p>
      <a className="card-result__wall" href={pageUrl('cards/')}>
        看看大家寫的卡片 →
      </a>
      {toastElement}
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
        </Reveal>
      </div>
    </div>
  );
}
