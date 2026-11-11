import { boot } from '../../lib/boot';
import { AdminPage } from './AdminPage';

// The review console keeps its key in this tab and loads no GA4 (#67).
boot(<AdminPage />, { admin: true });
