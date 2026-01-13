/**
 * SkyeMovie™ TV Remote / D-Pad navigation
 *
 * Adds spatial navigation (Arrow keys) and Back handling for Android TV / Smart TV
 * browsers. This is intentionally lightweight and framework-free.
 */

(function () {
  const TV_CLASS = 'tv-mode';

  function isProbablyTV() {
    const ua = (navigator.userAgent || '').toLowerCase();
    const uaHints = [
      'android tv',
      'smart-tv',
      'smarttv',
      'hbbtv',
      'appletv',
      'aftb', // Amazon Fire TV
      'aftt',
      'aftm',
      'tizen',
      'webos',
    ];
    if (uaHints.some((h) => ua.includes(h))) return true;

    // Heuristic fallback: big screen + no hover.
    try {
      const noHover = window.matchMedia && window.matchMedia('(hover: none)').matches;
      const bigScreen = Math.max(window.innerWidth, window.innerHeight) >= 960;
      return noHover && bigScreen;
    } catch (e) {
      return false;
    }
  }

  function isElementVisible(el) {
    if (!el) return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    return true;
  }

  function getFocusableElements() {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    const nodes = Array.from(document.querySelectorAll(selectors.join(',')));
    return nodes.filter((el) => isElementVisible(el));
  }

  function centerOfRect(rect) {
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  function findNextByDirection(currentEl, direction) {
    const focusables = getFocusableElements();
    if (!focusables.length) return null;

    if (!currentEl || !focusables.includes(currentEl)) {
      return focusables[0];
    }

    const curRect = currentEl.getBoundingClientRect();
    const cur = centerOfRect(curRect);

    let best = null;
    let bestScore = Infinity;

    for (const el of focusables) {
      if (el === currentEl) continue;
      const r = el.getBoundingClientRect();
      const c = centerOfRect(r);

      const dx = c.x - cur.x;
      const dy = c.y - cur.y;

      // Direction filter
      const MIN_AXIS_DELTA = 8;
      if (direction === 'left' && dx >= -MIN_AXIS_DELTA) continue;
      if (direction === 'right' && dx <= MIN_AXIS_DELTA) continue;
      if (direction === 'up' && dy >= -MIN_AXIS_DELTA) continue;
      if (direction === 'down' && dy <= MIN_AXIS_DELTA) continue;

      // Weighted distance score (prefer staying on same row/column)
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const score = direction === 'left' || direction === 'right'
        ? absDx + absDy * 2
        : absDy + absDx * 2;

      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }

    return best;
  }

  function focusDirection(direction) {
    const active = document.activeElement;
    const next = findNextByDirection(active, direction);
    if (next) {
      next.focus({ preventScroll: true });
      try {
        next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } catch (e) {}
    }
  }

  function isBackKey(e) {
    const key = e.key;
    const code = e.keyCode;
    // Includes Android TV (keyCode 4), Tizen (10009), some remotes (461)
    return (
      key === 'Backspace' ||
      key === 'Escape' ||
      key === 'BrowserBack' ||
      key === 'GoBack' ||
      code === 4 ||
      code === 10009 ||
      code === 461
    );
  }

  function handleBackNavigation() {
    const playerView = document.getElementById('player-view');
    const detailView = document.getElementById('detail-view');

    if (playerView && playerView.classList.contains('active-view')) {
      const closeBtn = document.getElementById('close-player-button');
      if (closeBtn) closeBtn.click();
      return true;
    }
    if (detailView && detailView.classList.contains('active-view')) {
      const backBtn = document.getElementById('back-to-list-button');
      if (backBtn) backBtn.click();
      return true;
    }
    return false;
  }

  function onKeyDown(e) {
    if (!document.body.classList.contains(TV_CLASS)) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;

    // Don't hijack arrow keys while typing in inputs.
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    const isTypingTarget = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable);
    if (isTypingTarget && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;

    if (isBackKey(e)) {
      const handled = handleBackNavigation();
      if (handled) e.preventDefault();
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        focusDirection('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        focusDirection('right');
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusDirection('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusDirection('down');
        break;
      default:
        break;
    }
  }

  function focusInitial() {
    // Prefer focusing something visible and useful.
    const first =
      document.querySelector('#auth-section.active-section input') ||
      document.querySelector('#main-app-section .nav-button') ||
      document.querySelector('button, [tabindex]:not([tabindex="-1"])');
    if (first && isElementVisible(first)) {
      first.focus({ preventScroll: true });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (isProbablyTV()) {
      document.body.classList.add(TV_CLASS);
    }
    if (document.body.classList.contains(TV_CLASS)) {
      window.addEventListener('keydown', onKeyDown, true);
      setTimeout(focusInitial, 500);
    }
  });
})();
