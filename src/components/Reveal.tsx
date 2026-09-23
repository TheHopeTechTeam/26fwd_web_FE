import { useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { useInView } from '../lib/hooks';

interface RevealProps {
  as?: ElementType;
  className?: string;
  delay?: number;
  children: ReactNode;
  id?: string;
}

/** Fades content up on first entry. Visible by default without JS or with reduced motion. */
export function Reveal({ as: Tag = 'div', className = '', delay = 0, children, id }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  const style = delay ? ({ '--reveal-delay': `${delay}s` } as CSSProperties) : undefined;
  return (
    <Tag ref={ref} id={id} className={`reveal ${inView ? 'is-in' : ''} ${className}`.trim()} style={style}>
      {children}
    </Tag>
  );
}
