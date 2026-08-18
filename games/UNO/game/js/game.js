/**
 * UNO Game - Phase 4 Entry Point
 */

import { initPhase4UI } from './phase4-ui.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase4UI);
} else {
  initPhase4UI();
}
