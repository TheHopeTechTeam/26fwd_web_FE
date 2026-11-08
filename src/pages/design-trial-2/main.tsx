import { boot } from '../../lib/boot';
import { HomePage } from '../home/HomePage';
import '../design-trial/trial.css';
import './trial2.css';

// Design trial 2: v1 plus a looser, higher-contrast layout (staggered lines, much larger key
// words, mixed line heights). Same rules as v1: overrides under `html.trial`, real pages untouched.
document.documentElement.classList.add('trial', 'trial2');
boot(<HomePage />);
if (new URLSearchParams(location.search).has('frames')) void import('../../lib/designOverlay');
