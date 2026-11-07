import { boot } from '../../lib/boot';
import { HomePage } from '../home/HomePage';
import '../design-trial/trial.css';
import '../design-trial-2/trial2.css';
import './trial3.css';

// Design trial 3: v2's big contrast kept, small text made readable, line breaks that never leave
// a stray last line, and a few more deliberate emphasis moves. Same rules as v1/v2.
document.documentElement.classList.add('trial', 'trial2', 'trial3');
boot(<HomePage />);
if (new URLSearchParams(location.search).has('frames')) void import('../../lib/designOverlay');
