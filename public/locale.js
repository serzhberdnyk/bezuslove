/* Static locale URLs work without JS. Only a neutral home entry may auto-select. */
(() => {
  const storageKey = 'bezuslove:language:v1';
  const markerKey = 'bez_lang';
  const isLocale = value => value === 'ru' || value === 'en';
  const decode = value => {
    try { return decodeURIComponent(value.replace(/\+/g, ' ')); } catch { return ''; }
  };
  // Keep unrelated query bytes unchanged (UTM tags, duplicate keys, signed values).
  const queryParts = () => window.location.search ? window.location.search.slice(1).split('&') : [];
  const isMarker = part => decode(part.split('=')[0]) === markerKey;
  const cleanQuery = () => {
    const parts = queryParts().filter(part => !isMarker(part));
    return parts.length ? '?' + parts.join('&') : '';
  };
  const marker = queryParts().filter(isMarker).map(part => decode(part.slice(part.indexOf('=') + 1))).find(isLocale);
  const readChoice = () => {
    const choices = [];
    for (const name of ['localStorage', 'sessionStorage']) {
      try {
        const choice = JSON.parse(window[name].getItem(storageKey));
        if (isLocale(choice?.locale) && Number.isFinite(choice.updatedAt)) choices.push(choice);
      } catch { /* Private browsing, denied storage and malformed data are safe. */ }
    }
    return choices.sort((a, b) => b.updatedAt - a.updatedAt)[0];
  };
  const remember = locale => {
    const previous = readChoice();
    const value = JSON.stringify({ locale, updatedAt: Math.max(Date.now(), (previous?.updatedAt || 0) + 1) });
    let saved = false;
    for (const name of ['localStorage', 'sessionStorage']) {
      try {
        window[name].setItem(storageKey, value);
        saved = window[name].getItem(storageKey) === value || saved;
      } catch { /* The URL marker remains a fallback if both stores are blocked. */ }
    }
    return saved;
  };
  const browserLocale = () => {
    const browser = window.navigator || {};
    const languages = browser.languages?.length ? browser.languages : [browser.language];
    for (const tag of languages) {
      const base = typeof tag === 'string' ? tag.toLowerCase().split(/[-_]/)[0] : '';
      if (isLocale(base)) return base;
    }
    return 'en';
  };
  const path = window.location.pathname;
  const pageLocale = path === '/en' || path?.startsWith('/en/') ? 'en' : 'ru';
  // A marker is written only by a deliberate language link. Explicit EN URLs win.
  const explicitChoice = marker && (marker === pageLocale || path === '/') ? marker : null;
  const choiceSaved = explicitChoice ? remember(explicitChoice) : false;
  if (choiceSaved) {
    try { window.history.replaceState(window.history.state, '', path + cleanQuery() + window.location.hash); }
    catch { /* Retaining the marker is safe if history access is restricted. */ }
  }
  const neutral = path === '/' || path === '/index.html';
  let returning = false;
  try { returning = window.history.state?.bezusloveLocale === pageLocale || window.performance?.getEntriesByType('navigation')[0]?.type === 'back_forward'; } catch {}
  if (neutral && !returning && (explicitChoice || readChoice()?.locale || browserLocale()) === 'en') {
    const query = cleanQuery();
    const targetQuery = explicitChoice === 'en' && !choiceSaved
      ? query + (query ? '&' : '?') + markerKey + '=en' : query;
    window.location.replace('/en/' + targetQuery + window.location.hash);
    return;
  }
  try { window.history.replaceState({...window.history.state, bezusloveLocale: pageLocale}, ''); } catch {}
  document.addEventListener('DOMContentLoaded', () => {
  const links = [...document.querySelectorAll('[data-language-path]')];
  const synchronize = () => {
    for (const link of links) {
      const target = link.getAttribute('data-language-path');
      const locale = target === '/en/' || target.startsWith('/en/') ? 'en' : 'ru';
      const query = cleanQuery();
      // Destination markers also work with middle-click and “open in a new tab”.
      link.setAttribute('href', target + query + (query ? '&' : '?') + markerKey + '=' + locale + window.location.hash);
    }
  };
  synchronize();
  window.addEventListener('hashchange', synchronize);
  window.addEventListener('popstate', synchronize);
  for (const link of links) {
    link.addEventListener('pointerdown', synchronize);
    link.addEventListener('focus', synchronize);
    link.addEventListener('click', event => {
      if (event?.defaultPrevented) return;
      const target = link.getAttribute('data-language-path');
      remember(target === '/en/' || target.startsWith('/en/') ? 'en' : 'ru');
      synchronize();
    });
  }
  window.addEventListener('pageshow', synchronize);
  const menu = document.querySelector('.menu');
  if (menu) menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-label', pageLocale === 'en' ? (open ? 'Close menu' : 'Open menu') : (open ? 'Закрыть меню' : 'Открыть меню'));
  });
  document.querySelectorAll('.header nav a').forEach(link => link.addEventListener('click', () => menu?.setAttribute('aria-label', pageLocale === 'en' ? 'Open menu' : 'Открыть меню')));
  });
})();
