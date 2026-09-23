import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { lockScroll, prefersReducedMotion, unlockScroll } from '../lib/hooks';
import './Modal.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  /** Children may be a function to know when the exit animation has started. */
  children: ReactNode | ((state: { closing: boolean }) => ReactNode);
}

const EXIT_MS = 220;

/**
 * Accessible modal on the native <dialog>: showModal() gives the focus trap and inert
 * background, ESC / backdrop click / close button all route through requestClose so
 * the exit animation plays and callers can stop media immediately (US-04).
 */
export function Modal({ open, onClose, labelledBy, className = '', children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setClosing(false);
      dialog.showModal();
      lockScroll();
    } else if (!open && dialog.open) {
      dialog.close();
      unlockScroll();
      returnFocus.current?.focus({ preventScroll: true });
    }
  }, [open]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (ref.current?.open) unlockScroll();
    },
    [],
  );

  const requestClose = useCallback(() => {
    if (closing) return;
    if (prefersReducedMotion()) {
      onClose();
      return;
    }
    setClosing(true);
    timer.current = window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, EXIT_MS);
  }, [closing, onClose]);

  return (
    <dialog
      ref={ref}
      className={`modal ${closing ? 'is-closing' : ''} ${className}`.trim()}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      {open && (
        <div className="modal__panel">
          <button type="button" className="modal__close" onClick={requestClose} aria-label="關閉">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          {typeof children === 'function' ? children({ closing }) : children}
        </div>
      )}
    </dialog>
  );
}
