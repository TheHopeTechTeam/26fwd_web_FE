import { boot } from '../../lib/boot';
import { HomePage } from '../home/HomePage';
import './trial.css';

// Design trial: the home page with the 優先 blocks of the 設計強化規格 applied. Every change is a
// CSS override under `html.trial` (trial.css, loaded only here), plus the card image in
// canvasCard.ts, which reads the same class. The real pages are untouched. `?frames=1` adds the
// /design/ frames and spec panel on top.
document.documentElement.classList.add('trial');
boot(<HomePage />);
if (new URLSearchParams(location.search).has('frames')) void import('../../lib/designOverlay');
