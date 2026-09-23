import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, describeError, PUBLIC_PAGE_LIMIT, type PublicCard } from '../../api';
import { ForwardCardSkeleton, ForwardCardView } from '../../components/ForwardCardView';
import { SiteFooter } from '../../components/SiteFooter';
import { SiteHeader } from '../../components/SiteHeader';
import { pageUrl } from '../../config/env';
import { codePointLength } from '../../lib/text';
import { assignColumns, columnsForWidth } from '../../lib/masonry';
import './CardsPage.css';

type LoadState = 'initial' | 'idle' | 'loading-more' | 'error';

// Rough rendered height, only used to balance columns.
const estimate = (card: PublicCard & { index: number }) =>
  150 + (codePointLength(card.text_gratitude) + codePointLength(card.text_anticipate)) * 1.3;

/**
 * Forward Cards wall (US-10): its own page so 200+ cards never slow the journey page.
 * Approved cards only, 12 per batch, newest first, with a stable masonry layout.
 */
export function CardsPage() {
  const [cards, setCards] = useState<PublicCard[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [state, setState] = useState<LoadState>('initial');
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async (nextPage: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setState(nextPage === 1 ? 'initial' : 'loading-more');
    setError(null);
    try {
      const res = await api.listCards({ page: nextPage, limit: PUBLIC_PAGE_LIMIT });
      setCards((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...res.items.filter((c) => !seen.has(c.id))];
      });
      setPage(res.pagination.page);
      setHasMore(res.pagination.has_more);
      setTotal(res.pagination.total_count);
      setState('idle');
    } catch (e) {
      setError(describeError(e));
      setState('error');
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setColumns(columnsForWidth(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const indexed = useMemo(() => cards.map((card, index) => ({ ...card, index })), [cards]);
  const cols = useMemo(() => assignColumns(indexed, columns, estimate), [indexed, columns]);
  const initialLoading = state === 'initial' && cards.length === 0;
  const now = Date.now();

  return (
    <>
      <SiteHeader backLabel="回到 FORWARD" />
      <main className="cards-page">
        <div className="wrap wrap--no-rail">
          <header className="cards-page__head">
            <p className="kicker">Forward Cards · 卡片牆</p>
            <h1 className="cards-page__title">Write it forward</h1>
            <p className="lead">全 Hope Nation 寫下的感謝與期待。每一張卡片都經過團隊審閱後公開。</p>
            <div className="cards-page__meta">
              {total !== null && (
                <p className="cards-page__count" aria-live="polite">
                  已有 <strong>{total}</strong> 張卡片
                </p>
              )}
              <a className="btn btn--gold btn--sm" href={pageUrl('#respond')}>
                寫一張卡片
              </a>
            </div>
          </header>

          <div ref={gridRef} className="masonry" aria-busy={state === 'initial' || state === 'loading-more'}>
            {initialLoading ? (
              <div className="masonry__col">
                {Array.from({ length: 4 }, (_, i) => (
                  <ForwardCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              cols.map((col, c) => (
                <div key={c} className="masonry__col">
                  {col.map((card) => (
                    <ForwardCardView key={card.id} card={card} index={card.index} now={now} />
                  ))}
                </div>
              ))
            )}
          </div>

          <div className="cards-page__footer">
            {state === 'error' && (
              <div className="cards-page__error" role="alert">
                <p>{error ?? '載入失敗'}</p>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => void load(page + 1)}>
                  重新載入
                </button>
              </div>
            )}
            {state !== 'error' && cards.length === 0 && state === 'idle' && (
              <div className="cards-page__empty">
                <p>成為第一個寫卡的人！</p>
                <a className="btn btn--gold" href={pageUrl('#respond')}>
                  寫一張 Forward Card
                </a>
              </div>
            )}
            {cards.length > 0 && hasMore && state !== 'error' && (
              <button type="button" className="btn btn--outline" onClick={() => void load(page + 1)} disabled={state === 'loading-more'}>
                {state === 'loading-more' ? (
                  <>
                    <span className="spinner" /> 載入中…
                  </>
                ) : (
                  '載入更多'
                )}
              </button>
            )}
            {cards.length > 0 && !hasMore && <p className="note">已顯示全部卡片</p>}
          </div>
        </div>
      </main>
      <SiteFooter railSpace={false} />
    </>
  );
}
