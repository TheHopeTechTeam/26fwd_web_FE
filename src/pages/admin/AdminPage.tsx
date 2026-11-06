import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ADMIN_TOKEN_MIN_LENGTH, api, ApiError, describeError, type AdminCard, type CardStatus } from '../../api';
import { config, pageUrl } from '../../config/env';
import { PROMPTS } from '../../lib/canvasCard';
import { formatDateTime, relativeTime } from '../../lib/format';
import { DELETE_WORD, deleteConfirmed } from './confirm';
import { describeJudgment, percent } from './judgment';
import './AdminPage.css';

const TABS: Array<{ status: CardStatus; label: string }> = [
  { status: 'pending', label: '待審核' },
  { status: 'approved', label: '已公開' },
  { status: 'hidden', label: '已隱藏' },
];

// `from`: the status the card was listed with; if someone has changed it since, the API answers 409.
// `deleted` is the delete of a hidden card (#35), which checks on the server that it is still hidden.
type Action = { id: string; next: 'approved' | 'hidden' | 'deleted'; from: CardStatus };

const ACTION_LABEL: Record<Action['next'], { verb: string; confirm: string; done: string }> = {
  approved: { verb: '核准公開', confirm: '確認公開這張 FORWARD 卡？', done: '已核准，FORWARD 卡將出現在2026 回應牆（快取最長約 15 秒）。' },
  hidden: { verb: '隱藏', confirm: '確認隱藏這張 FORWARD 卡？', done: '已隱藏，FORWARD 卡將從2026 回應牆移除（快取最長約 15 秒）。' },
  deleted: { verb: '永久刪除', confirm: '確認永久刪除這張 FORWARD 卡？刪除後無法復原，它的 AI 判斷紀錄也會一起刪除。', done: '已永久刪除。' },
};

/**
 * Review console (US-17 scope for this round): switch pending / approved / hidden, approve or hide,
 * and delete a hidden card for good (#35), each with an explicit confirm step. Every card shows its
 * AI judgment (M1.6). The token lives only in React state — never in storage, the URL or logs — and
 * is gone on reload. No edits or rejections are shown because no backend exists for them yet
 * (Q-29～Q-32).
 */
export function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);
  return (
    <div className="admin">
      <header className="admin__header">
        <div className="admin__brand">
          <span className="admin__logo">FORWARD</span> 審核後台
        </div>
        <div className="admin__header-side">
          {config.apiMode === 'mock' && <span className="admin__mode">MOCK API</span>}
          {token && (
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setToken(null)}>
              登出
            </button>
          )}
        </div>
      </header>
      <main className="admin__main">
        {token ? (
          <ReviewConsole
            token={token}
            onUnauthorized={() => {
              setToken(null);
              setLockError('管理金鑰無效或已過期，請重新輸入。');
            }}
          />
        ) : (
          <LockScreen
            error={lockError}
            onUnlock={(t) => {
              setLockError(null);
              setToken(t);
            }}
          />
        )}
      </main>
    </div>
  );
}

function LockScreen({ onUnlock, error }: { onUnlock: (token: string) => void; error: string | null }) {
  const [value, setValue] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < ADMIN_TOKEN_MIN_LENGTH) {
      setLocalError(`管理金鑰至少需要 ${ADMIN_TOKEN_MIN_LENGTH} 個字元。`);
      return;
    }
    setValue('');
    onUnlock(trimmed);
  };
  return (
    <form className="admin__lock" onSubmit={submit}>
      <h1>輸入管理金鑰</h1>
      <p className="admin__muted">金鑰只保存在這個分頁的記憶體中，重新整理或關閉頁面後即清除。</p>
      <label htmlFor="admin-token">管理金鑰（Bearer token）</label>
      <input
        id="admin-token"
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setLocalError(null);
        }}
      />
      {config.apiMode === 'mock' && <p className="admin__muted">Mock 模式：任何長度 ≥ {ADMIN_TOKEN_MIN_LENGTH} 字元的字串都可登入，資料為合成示意 FORWARD 卡。</p>}
      <div role="alert" className="admin__error">
        {localError ?? error}
      </div>
      <button type="submit" className="btn btn--gold">
        進入後台
      </button>
    </form>
  );
}

function ReviewConsole({ token, onUnauthorized }: { token: string; onUnauthorized: () => void }) {
  const [status, setStatus] = useState<CardStatus>('pending');
  const [items, setItems] = useState<AdminCard[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [confirming, setConfirming] = useState<Action | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  // What the reviewer typed to confirm a delete; it starts empty for every new confirm step.
  const [typed, setTyped] = useState('');
  const confirmRef = useRef<HTMLButtonElement>(null);
  const wordRef = useRef<HTMLInputElement>(null);

  const handleError = useCallback(
    (error: unknown): string => {
      if (error instanceof ApiError && error.code === 'UNAUTHORIZED') onUnauthorized();
      return describeError(error);
    },
    [onUnauthorized],
  );

  const load = useCallback(
    async (target: CardStatus, signal?: AbortSignal) => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await api.adminListCards(token, target, signal);
        setItems(res.items);
        setHasMore(res.has_more);
      } catch (error) {
        if (signal?.aborted) return;
        setItems([]);
        setLoadError(handleError(error));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [token, handleError],
  );

  useEffect(() => {
    const controller = new AbortController();
    setConfirming(null);
    void load(status, controller.signal);
    return () => controller.abort();
  }, [status, load]);

  useEffect(() => {
    setTyped('');
    (confirming?.next === 'deleted' ? wordRef : confirmRef).current?.focus();
  }, [confirming]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => [c.nickname, c.text_gratitude, c.text_anticipate, c.id].some((v) => v.toLowerCase().includes(q)));
  }, [items, query]);

  const run = async (action: Action) => {
    if (busyId || (action.next === 'deleted' && !deleteConfirmed(typed))) return;
    setBusyId(action.id);
    setMessage(null);
    const leave = (text: string) => {
      setItems((list) => list.filter((c) => c.id !== action.id));
      setMessage({ tone: 'ok', text });
      setConfirming(null);
    };
    try {
      if (action.next === 'deleted') await api.adminDeleteCard(token, action.id);
      else if (action.next === 'hidden') await api.adminHide(token, action.id, action.from);
      else await api.adminSetStatus(token, action.id, 'approved', action.from);
      leave(ACTION_LABEL[action.next].done);
    } catch (error) {
      // Someone else deleted it first: the card is gone either way.
      if (action.next === 'deleted' && error instanceof ApiError && error.code === 'NOT_FOUND') leave('這張卡已經不存在，可能已被其他人刪除。');
      else setMessage({ tone: 'error', text: `操作失敗：${handleError(error)}` });
    } finally {
      setBusyId(null);
    }
  };

  const actionsFor = (card: AdminCard): Array<Action['next']> =>
    card.status === 'pending' ? ['approved', 'hidden'] : card.status === 'approved' ? ['hidden'] : ['approved', 'deleted'];

  const now = Date.now();

  return (
    <div className="review">
      <p className="review__scope">
        可以核准公開、隱藏，以及永久刪除已隱藏的卡；每張卡都會顯示 AI 判斷。改寫、退件理由與個別審核者的紀錄尚未實作（待 Q-29～Q-32 拍板）。隱藏的卡可以重新公開，刪除後無法復原。
      </p>

      <div className="review__toolbar">
        <div className="review__tabs" role="tablist" aria-label="FORWARD 卡狀態">
          {TABS.map((tab) => (
            <button
              key={tab.status}
              type="button"
              role="tab"
              aria-selected={status === tab.status}
              className={status === tab.status ? 'is-on' : ''}
              onClick={() => setStatus(tab.status)}
            >
              {tab.label}
              {status === tab.status && !loading && <span className="review__tab-count">{items.length}</span>}
            </button>
          ))}
        </div>
        <label className="review__search">
          <span className="sr-only">搜尋目前載入的 FORWARD 卡</span>
          <input type="search" placeholder="搜尋暱稱、內容或 ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => void load(status)} disabled={loading}>
          重新整理
        </button>
      </div>
      <p className="admin__muted">搜尋只在目前載入的這一批（最多 100 筆）中進行{hasMore ? '；此狀態還有更多 FORWARD 卡未載入' : ''}。</p>

      <div className={`review__message ${message ? `is-${message.tone}` : ''}`} role="status" aria-live="polite">
        {message?.text}
      </div>

      {loading ? (
        <p className="review__state">
          <span className="spinner" /> 載入中…
        </p>
      ) : loadError ? (
        <div className="review__state review__state--error" role="alert">
          <p>{loadError}</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={() => void load(status)}>
            再試一次
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="review__state">{query ? '沒有符合搜尋的 FORWARD 卡。' : '這個狀態目前沒有 FORWARD 卡。'}</p>
      ) : (
        <ul className="review__list">
          {filtered.map((card) => (
            <li key={card.id} className="review__item">
              <div className="review__content">
                <p className="review__prompt">{PROMPTS.gratitude}</p>
                <p className="review__text">{card.text_gratitude}</p>
                <p className="review__prompt">{PROMPTS.anticipate}</p>
                <p className="review__text">{card.text_anticipate}</p>
              </div>
              <div className="review__meta">
                <p className="review__name">— {card.nickname}</p>
                <p>
                  <time dateTime={card.created_at}>{formatDateTime(card.created_at)}</time>（{relativeTime(card.created_at, now)}）
                </p>
                <p className="review__id">{card.id}</p>
                <Judgment card={card} />
                <div className="review__actions">
                  {confirming?.id === card.id ? (
                    <div className="review__confirm">
                      <span>{ACTION_LABEL[confirming.next].confirm}</span>
                      {confirming.next === 'deleted' && (
                        <label className="review__confirm-word">
                          請輸入「{DELETE_WORD}」兩個字
                          <input
                            ref={wordRef}
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            disabled={busyId === card.id}
                          />
                        </label>
                      )}
                      <button
                        ref={confirmRef}
                        type="button"
                        className={`btn btn--sm ${confirming.next === 'approved' ? 'btn--gold' : 'btn--danger'}`}
                        onClick={() => void run(confirming)}
                        disabled={busyId === card.id || (confirming.next === 'deleted' && !deleteConfirmed(typed))}
                      >
                        {busyId === card.id ? <span className="spinner" /> : '確認'}
                      </button>
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => setConfirming(null)} disabled={busyId === card.id}>
                        取消
                      </button>
                    </div>
                  ) : (
                    actionsFor(card).map((next) => (
                      <button
                        key={next}
                        type="button"
                        className={`btn btn--sm ${next === 'approved' ? 'btn--gold' : 'btn--outline'}`}
                        onClick={() => setConfirming({ id: card.id, next, from: card.status })}
                        disabled={!!busyId}
                      >
                        {card.status === 'hidden' && next === 'approved' ? '重新公開' : ACTION_LABEL[next].verb}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="admin__muted review__back">
        <a href={pageUrl()}>回到 FORWARD 網站</a>
      </p>
    </div>
  );
}

// The card's AI judgment (M1.6): one line for scanning the list, the full record on demand.
function Judgment({ card }: { card: AdminCard }) {
  const view = describeJudgment(card.moderation, card.status);
  const m = card.moderation;
  return (
    <div className={`review__judgment is-${view.tone}`}>
      <p className="review__judgment-label">{view.label}</p>
      <p>{view.note}</p>
      {m && (
        <details className="review__judgment-record">
          <summary>判斷紀錄</summary>
          <dl>
            <dt>模型</dt>
            <dd>{m.model}</dd>
            <dt>題目版本</dt>
            <dd>{m.questions_version ?? '—'}</dd>
            <dt>理由代碼</dt>
            <dd>
              {m.reason ?? '—'}
              {m.reason_probability !== null && `（${percent(m.reason_probability)}）`}
            </dd>
            <dt>需要注意的機率</dt>
            <dd>{m.needs_attention_probability === null ? '—' : percent(m.needs_attention_probability)}</dd>
            <dt>判斷時間</dt>
            <dd>
              <time dateTime={m.judged_at}>{formatDateTime(m.judged_at)}</time>
            </dd>
          </dl>
        </details>
      )}
    </div>
  );
}
