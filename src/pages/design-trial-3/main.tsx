import { boot } from '../../lib/boot';
import { HomePage } from '../home/HomePage';
import '../design-trial/trial.css';
import '../design-trial-2/trial2.css';
import './trial3.css';
import { emphasiseKeywords } from './keywords';

// Design trial 3: v2's big contrast kept, small text made readable, line breaks that never leave
// a stray last line, and a few more deliberate emphasis moves. Same rules as v1/v2.
document.documentElement.classList.add('trial', 'trial2', 'trial3');
boot(<HomePage />);
// 「FORWARD／是十一之外的／慷慨奉獻。」 on three lines (the user's call, 11/08); trial only.
function breakAnticipateTitle(): void {
  const title = document.getElementById('anticipate-title');
  if (!title || title.querySelector('br')) return;

  if ((title.textContent ?? '').replace(/\s+/g, '') !== 'FORWARD是十一之外的慷慨奉獻。') return;
  title.replaceChildren('FORWARD', document.createElement('br'), '是十一之外的', document.createElement('br'), '慷慨奉獻。');
}
// React renders after boot() returns, so wait for the title before breaking it.
const titleWatch = new MutationObserver(() => {
  if (!document.getElementById('anticipate-title')) return;
  titleWatch.disconnect();
  breakAnticipateTitle();
});
titleWatch.observe(document.body, { childList: true, subtree: true });
requestAnimationFrame(emphasiseKeywords);
if (new URLSearchParams(location.search).has('frames')) void import('../../lib/designOverlay');
