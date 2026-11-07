import { boot } from '../../lib/boot';
import { HomePage } from '../home/HomePage';

// Internal design-review page: the home page with a frame around every block a designer may
// strengthen. Never part of a production build (see vite.config.ts) and never indexed.
boot(<HomePage />);
void import('../../lib/designOverlay');
