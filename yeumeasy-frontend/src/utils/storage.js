const prefix = "yeumeasy:";

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(prefix + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  localStorage.setItem(prefix + key, JSON.stringify(value));
}

export function uid() {
  // id แบบง่ายพอสำหรับ mock
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}