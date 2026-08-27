const KEY = 'anbikyeo';

export function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

export function save(patch) {
  const s = { best: 0, total: 0, crumbs: 0, equipped: [], muted: false, ...load(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 사파리 시크릿 등 */ }
  return s;
}
