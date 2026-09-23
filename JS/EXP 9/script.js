/* ============================================================
   Theme preference demo — localStorage vs sessionStorage
   ------------------------------------------------------------
   Loaded in <head> WITHOUT defer, so the saved theme is applied
   to <html> before the page paints (no flash of the wrong theme).
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     Constants
     ---------------------------------------------------------- */
  const THEME_KEY     = 'theme';         // "light" | "dark"
  const WHERE_KEY     = 'themeStorage';  // "local" | "session"
  const THEMES        = ['light', 'dark'];
  const STORE_NAMES   = ['local', 'session'];
  const DEFAULT_THEME = 'light';
  const DEFAULT_WHERE = 'local';

  /* ----------------------------------------------------------
     Storage access
     Some browsers throw on access (private mode, blocked cookies),
     so we probe once and fall back to null.
     ---------------------------------------------------------- */
  function openStore(name) {
    try {
      const store =
        name === 'session' ? window.sessionStorage : window.localStorage;

      const probe = '__probe__';
      store.setItem(probe, '1');
      store.removeItem(probe);
      return store;
    } catch (err) {
      return null;
    }
  }

  const stores = {
    local:   openStore('local'),
    session: openStore('session')
  };

  /* ----------------------------------------------------------
     Read helpers
     sessionStorage is checked first, so a tab-scoped choice
     always wins over a global one.
     ---------------------------------------------------------- */
  function getItem(key) {
    for (const name of STORE_NAMES) {
      const store = stores[name];
      if (!store) continue;

      try {
        const value = store.getItem(key);
        if (value !== null) return { value, store: name };
      } catch (err) {
        /* ignore and keep looking */
      }
    }
    return { value: null, store: null };
  }

  function readTheme() {
    const found = getItem(THEME_KEY);
    return THEMES.includes(found.value) ? found.value : DEFAULT_THEME;
  }

  function readWhere() {
    const found = getItem(WHERE_KEY);
    return STORE_NAMES.includes(found.value) ? found.value : DEFAULT_WHERE;
  }

  /* ----------------------------------------------------------
     Write helpers
     The preference lives in exactly ONE store: we clear both
     keys from both stores, then write to the chosen one.
     ---------------------------------------------------------- */
  function save(theme, where) {
    STORE_NAMES.forEach((name) => {
      const store = stores[name];
      if (!store) return;

      try {
        store.removeItem(THEME_KEY);
        store.removeItem(WHERE_KEY);
      } catch (err) {
        /* ignore */
      }
    });

    const target = stores[where];
    if (!target) return false;

    try {
      target.setItem(THEME_KEY, theme);
      target.setItem(WHERE_KEY, where);
      return true;
    } catch (err) {
      return false;
    }
  }

  function clearAll() {
    STORE_NAMES.forEach((name) => {
      const store = stores[name];
      if (!store) return;

      try {
        store.removeItem(THEME_KEY);
        store.removeItem(WHERE_KEY);
      } catch (err) {
        /* ignore */
      }
    });
  }

  /* ----------------------------------------------------------
     State + early paint
     ---------------------------------------------------------- */
  let currentTheme = readTheme();
  let currentWhere = readWhere();

  document.documentElement.setAttribute('data-theme', currentTheme);

  function storageLabel(where) {
    return where === 'session' ? 'sessionStorage' : 'localStorage';
  }

  function dumpStore(store) {
    if (!store) return '  (unavailable — storage is blocked)';

    let keys = [];
    try {
      for (let i = 0; i < store.length; i += 1) keys.push(store.key(i));
    } catch (err) {
      return '  (unavailable)';
    }

    if (keys.length === 0) return '  (empty)';

    return keys
      .map((key) => '  ' + key + ' = ' + JSON.stringify(store.getItem(key)))
      .join('\n');
  }

  /* ----------------------------------------------------------
     DOM wiring
     ---------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    const themeButtons = Array.from(
      document.querySelectorAll('[data-theme-value]')
    );
    const storageInputs = Array.from(
      document.querySelectorAll('input[name="storage"]')
    );
    const statusEl = document.getElementById('status');
    const dumpEl   = document.getElementById('dump');
    const resetBtn = document.getElementById('reset');

    /* ---------- rendering ---------- */
    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'info';
    }

    function renderThemeButtons() {
      themeButtons.forEach((btn) => {
        const active = btn.dataset.themeValue === currentTheme;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-checked', active ? 'true' : 'false');
        btn.tabIndex = active ? 0 : -1; // roving tabindex for the radio group
      });
    }

    function renderStorageInputs() {
      storageInputs.forEach((input) => {
        input.checked = input.value === currentWhere;
      });
    }

    function renderDump() {
      dumpEl.textContent =
        'localStorage\n' +
        dumpStore(stores.local) +
        '\n\nsessionStorage\n' +
        dumpStore(stores.session);
    }

    function render() {
      renderThemeButtons();
      renderStorageInputs();
      renderDump();
    }

    /* ---------- core action ---------- */
    function applyTheme(theme, where, message) {
      currentTheme = theme;
      currentWhere = where;

      document.documentElement.setAttribute('data-theme', theme);

      const saved = save(theme, where);
      render();

      if (!saved) {
        setStatus(
          'Storage is blocked here — the theme applies for now but will not be remembered.',
          'warn'
        );
      } else if (message) {
        setStatus(message, 'ok');
      }
    }

    /* ---------- step 1: theme buttons ---------- */
    themeButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.themeValue;

        applyTheme(
          theme,
          currentWhere,
          'Saved “' + theme + '” theme to ' + storageLabel(currentWhere) + '.'
        );
      });

      // Arrow-key navigation, like a real radio group
      btn.addEventListener('keydown', (event) => {
        const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
        if (!keys.includes(event.key)) return;

        event.preventDefault();

        const step =
          event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
        const next =
          themeButtons[(index + step + themeButtons.length) % themeButtons.length];

        next.focus();
        next.click();
      });
    });

    /* ---------- step 2: storage radios ---------- */
    storageInputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (!input.checked) return;

        applyTheme(
          currentTheme,
          input.value,
          'Moved the “' + currentTheme + '” theme to ' +
            storageLabel(input.value) + '.'
        );
      });
    });

    /* ---------- reset ---------- */
    resetBtn.addEventListener('click', () => {
      clearAll();

      currentTheme = DEFAULT_THEME;
      currentWhere = DEFAULT_WHERE;

      document.documentElement.setAttribute('data-theme', currentTheme);
      render();
      setStatus('Cleared. Back to the light default with nothing saved.', 'info');
    });

    /* ---------- stay in sync with other tabs ----------
       The "storage" event fires in *other* tabs when localStorage
       changes. (sessionStorage is per-tab, so it never fires here.) */
    window.addEventListener('storage', (event) => {
      if (
        event.key !== null &&
        event.key !== THEME_KEY &&
        event.key !== WHERE_KEY
      ) {
        return;
      }

      currentTheme = readTheme();
      currentWhere = readWhere();

      document.documentElement.setAttribute('data-theme', currentTheme);
      render();
      setStatus('Updated from another tab.', 'info');
    });

    /* ---------- initial render ---------- */
    render();

    const restored = getItem(THEME_KEY);
    if (restored.value) {
      setStatus(
        'Restored “' + currentTheme + '” from ' +
          storageLabel(restored.store) + '.',
        'ok'
      );
    } else {
      setStatus('Nothing saved yet — pick a theme and a storage location.', 'info');
    }
  });
})();