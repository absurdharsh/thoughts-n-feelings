// ==========================================================================
// Thoughts 'n' Feelings — Client Data Layer for /api/store
// Secure Vercel Serverless integration with local cache fallback
// ==========================================================================

export const API_STORE_URL = '/api/store';
export const LOCAL_STORAGE_KEY = 'tf_shared_state_v2';
import { getSeasonAndYear } from './utils/dateUtils';

export function defaultState() {
  return {
    thoughts: [],
    comments: {},
    likes: {},
    deletedIds: [],
    persistent: true
  };
}

export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return defaultState();

  const thoughts = Array.isArray(raw.thoughts)
    ? raw.thoughts
        .filter((t) => t && (t.id != null || t.title != null))
        .map((t) => ({
          ...t,
          id: String(t.id || Date.now()),
          number: t.number || '00',
          title: String(t.title || ''),
          content: String(t.content || ''),
          category: String(t.category || t.type || 'thought'),
          type: String(t.type || t.category || 'thought'),
          author: String(t.author || 'absurdharsh'),
          date: t.date && t.date.toLowerCase() !== 'just now'
            ? t.date
            : getSeasonAndYear(typeof t.createdAt === 'number' ? t.createdAt : Date.now()),
          doodle: t.doodle || (t.category === 'feeling' ? 'eye' : t.category === 'quote' ? 'spark' : 'star'),
          createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now()
        }))
    : [];

  const comments = {};
  if (raw.comments && typeof raw.comments === 'object') {
    for (const [k, list] of Object.entries(raw.comments)) {
      if (Array.isArray(list)) {
        comments[String(k)] = list
          .filter((c) => c && c.text != null)
          .map((c) => ({
            id: String(c.id || Date.now()),
            text: String(c.text || ''),
            timestamp: c.timestamp || 'just now',
            createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now()
          }));
      }
    }
  }

  const likes = {};
  if (raw.likes && typeof raw.likes === 'object') {
    for (const [k, voters] of Object.entries(raw.likes)) {
      if (Array.isArray(voters)) {
        likes[String(k)] = Array.from(new Set(voters.map(String).filter(Boolean)));
      }
    }
  }

  const deletedIds = Array.isArray(raw.deletedIds)
    ? Array.from(new Set(raw.deletedIds.map(String).filter(Boolean)))
    : [];

  const persistent = raw.persistent !== false;

  return { thoughts, comments, likes, deletedIds, persistent };
}

// Read current cached state from localStorage with migration
export function getLocalState() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultState();
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return normalizeState(JSON.parse(raw));
    }
  } catch (err) {
    console.warn('[DB] Failed reading local storage:', err);
  }

  // Fallback: migrate from older keys if present
  try {
    const legacyThoughts = JSON.parse(localStorage.getItem('thoughts_sketchbook_entries_v4') || '[]');
    const legacyComments = JSON.parse(localStorage.getItem('thoughts_sketchbook_comments_v1') || '{}');
    const legacyLikes = JSON.parse(localStorage.getItem('thoughts_sketchbook_likes_v1') || '{}');
    const legacyDeleted = JSON.parse(localStorage.getItem('thoughts_sketchbook_deleted_ids') || '[]');

    const migrated = normalizeState({
      thoughts: legacyThoughts,
      comments: legacyComments,
      likes: legacyLikes,
      deletedIds: legacyDeleted,
      persistent: true
    });
    saveLocalState(migrated);
    return migrated;
  } catch {
    return defaultState();
  }
}

export function saveLocalState(state) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalizeState(state)));
  } catch (err) {
    console.warn('[DB] Failed saving local state:', err);
  }
}

// Fetch global store from /api/store with strict cache: 'no-store'
export async function fetchStore() {
  const localFallback = getLocalState();
  try {
    const res = await fetch(`${API_STORE_URL}?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });

    if (!res.ok) {
      console.warn(`[Store] GET returned status ${res.status}, using local fallback.`);
      return localFallback;
    }

    const data = await res.json();

    if (data.persistent === false) {
      console.warn('[Store] Notice: Cloud DB not yet connected in Vercel settings (KV_REST_API_URL). Using local state.');
      return {
        ...localFallback,
        persistent: false
      };
    }

    const normalized = normalizeState(data);
    saveLocalState(normalized);
    return normalized;
  } catch (err) {
    console.warn('[Store] Network error fetching /api/store, using local fallback:', err.message);
    return localFallback;
  }
}

// Add thought to /api/store
export async function addThoughtApi(thought) {
  try {
    const res = await fetch(`${API_STORE_URL}?_t=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        action: 'add_thought',
        thought
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.state && data.persistent !== false) {
        saveLocalState(data.state);
        return data.state;
      }
    }
  } catch (err) {
    console.warn('[Store] add_thought error:', err.message);
  }
  return null;
}

// Add anonymous comment to /api/store
export async function addCommentApi(thoughtId, text) {
  try {
    const res = await fetch(`${API_STORE_URL}?_t=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        action: 'add_comment',
        thoughtId: String(thoughtId),
        text
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.state && data.persistent !== false) {
        saveLocalState(data.state);
        return data.state;
      }
    }
  } catch (err) {
    console.warn('[Store] add_comment error:', err.message);
  }
  return null;
}

// Toggle like for an entry on /api/store
export async function toggleLikeApi(thoughtId, voterId) {
  try {
    const res = await fetch(`${API_STORE_URL}?_t=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        action: 'toggle_like',
        thoughtId: String(thoughtId),
        voterId
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.state && data.persistent !== false) {
        saveLocalState(data.state);
        return data.state;
      }
    }
  } catch (err) {
    console.warn('[Store] toggle_like error:', err.message);
  }
  return null;
}

// Verify owner passkey on /api/store
export async function verifyOwnerApi(passkey) {
  if (!passkey) return false;
  try {
    const res = await fetch(`${API_STORE_URL}?_t=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        action: 'verify_owner',
        passkey: passkey.trim()
      })
    });
    return res.status === 200;
  } catch (err) {
    console.warn('[Store] verify_owner error:', err.message);
    return false;
  }
}

// Owner delete thought or comment on /api/store
export async function ownerDeleteApi({ thoughtId, commentId, passkey }) {
  try {
    const res = await fetch(`${API_STORE_URL}?_t=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        action: 'owner_delete',
        thoughtId: thoughtId ? String(thoughtId) : undefined,
        commentId: commentId ? String(commentId) : undefined,
        passkey: passkey ? passkey.trim() : ''
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.state && data.persistent !== false) {
        saveLocalState(data.state);
        return data.state;
      }
    }
  } catch (err) {
    console.warn('[Store] owner_delete error:', err.message);
  }
  return null;
}

// Owner update thought metadata (author, date/month/season, title, content) on /api/store
export async function ownerUpdateThoughtApi({ thoughtId, updates, passkey }) {
  try {
    const res = await fetch(`${API_STORE_URL}?_t=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        action: 'owner_update',
        thoughtId: String(thoughtId),
        updates: updates || {},
        passkey: passkey ? passkey.trim() : ''
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.state && data.persistent !== false) {
        saveLocalState(data.state);
        return data.state;
      }
    }
  } catch (err) {
    console.warn('[Store] owner_update error:', err.message);
  }
  return null;
}

// Combine INITIAL_ENTRIES and dynamic server thoughts while excluding deletedIds
export function mergeEntries(initialEntries = [], cloudThoughts = [], deletedIds = []) {
  const deletedSet = new Set((deletedIds || []).map((id) => String(id)));
  const map = new Map();

  // 1. Dynamic thoughts from server (excluding deleted)
  (cloudThoughts || []).forEach((t) => {
    if (t && t.id != null) {
      const idStr = String(t.id);
      if (!deletedSet.has(idStr)) {
        map.set(idStr, {
          ...t,
          id: idStr
        });
      }
    }
  });

  // 2. Static initial thoughts (excluding deleted and overridden)
  (initialEntries || []).forEach((init) => {
    if (init && init.id != null) {
      const idStr = String(init.id);
      if (!deletedSet.has(idStr) && !map.has(idStr)) {
        map.set(idStr, {
          ...init,
          id: idStr
        });
      }
    }
  });

  // Sort descending by creation timestamp so most recent appears first
  return Array.from(map.values()).sort((a, b) => {
    const timeA = a.createdAt || (a.id && a.id.startsWith('entry-') ? parseInt(a.id.replace('entry-', ''), 10) || 0 : 0);
    const timeB = b.createdAt || (b.id && b.id.startsWith('entry-') ? parseInt(b.id.replace('entry-', ''), 10) || 0 : 0);
    return timeB - timeA;
  });
}
