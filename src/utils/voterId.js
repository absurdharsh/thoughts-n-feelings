// Multi-tier voter identity: localStorage + Cookies + IndexedDB
// Combines crypto.randomUUID() and browser fingerprint for persistent one-like enforcement

const STORAGE_KEY = 'sketchbook_voter_id';
const COOKIE_NAME = 'sketchbook_voter_id';
const DB_NAME = 'sketchbook_db';
const STORE_NAME = 'identity';

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, val) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(val)}; path=/; max-age=31536000; SameSite=Lax`;
}

function openDB() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function getFromIndexedDB() {
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STORAGE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveToIndexedDB(val) {
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(val, STORAGE_KEY);
  } catch {}
}

function getBrowserFingerprint() {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const scr = typeof screen !== 'undefined' ? screen : {};
  const raw = [
    nav.userAgent || '',
    nav.language || '',
    scr.width || '',
    scr.height || '',
    scr.colorDepth || '',
    new Date().getTimezoneOffset()
  ].join('|');

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function getPersistentVoterId() {
  // 1. Check localStorage
  let id = null;
  try {
    id = localStorage.getItem(STORAGE_KEY);
  } catch {}

  // 2. Check Cookie
  if (!id) {
    id = getCookie(COOKIE_NAME);
  }

  // 3. Check IndexedDB
  if (!id) {
    id = await getFromIndexedDB();
  }

  // If found, ensure all storage layers are synced
  if (id) {
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    setCookie(COOKIE_NAME, id);
    saveToIndexedDB(id);
    return id;
  }

  // Generate new voterId using crypto.randomUUID() + fingerprint
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const fp = getBrowserFingerprint();
  const newVoterId = `voter_${uuid}_${fp}`;

  // Persist across all 3 tiers
  try { localStorage.setItem(STORAGE_KEY, newVoterId); } catch {}
  setCookie(COOKIE_NAME, newVoterId);
  await saveToIndexedDB(newVoterId);

  return newVoterId;
}

