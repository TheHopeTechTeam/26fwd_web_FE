import { useCallback, useEffect, useRef, useState } from 'react';
import './Toast.css';

/** Minimal polite toast: one message at a time, announced to screen readers. */
export function useToast(durationMs = 2800) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number>(0);

  const show = useCallback(
    (text: string) => {
      window.clearTimeout(timer.current);
      setMessage(text);
      timer.current = window.setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const element = (
    <div className="toast-region" role="status" aria-live="polite">
      {message && <div className="toast">{message}</div>}
    </div>
  );

  return { show, element };
}
