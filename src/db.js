// ==========================================================================
// Thoughts 'n' Feelings — Unified Cloud & Local Database Store
// Live CORS-enabled persistent store with atomic Fetch-Modify-Save cycle
// ==========================================================================

export const SHARED_DB_URL =
  (typeof window !== 'undefined' && (window.SHARED_DB_URL || window.localStorage?.getItem('TF_SHARED_DB_URL'))) ||
  'https://extendsclass.com/api/json-storage/bin/ecfaffc';

export const LOCAL_STORAGE_KEY = 'tf_shared_state_v2';

// Clean empty schema template
export function createEmptyState() {
  return {
    thoughts: [],
    comments: {},
    likes: {},
    deletedIds: []
  };
}

// Normalizes any raw cloud/local data into the standard strict schema
// Forces EVERY thought.id, comment.id, like voterId, and deletedId to String
export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') {
    return createEmptyState();
  }

  // Handle nested wrapper responses (e.g., extendsclass { status: 0, data: "..." } or restful-api { data: { ... } })
  let obj = raw;
  if (typeof raw.data === 'string') {
    try {
      obj = JSON.parse(raw.data);
    } catch {
      obj = raw;
    }
  } else if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    obj = raw.data;
  }

  // 1. Normalize thoughts
  const thoughts = Array.isArray(obj.thoughts)
    ? obj.thoughts
        .filter((t) => t && (t.id != null || t.title != null))
        .map((t) => ({
          ...t,
          id: String(t.id || `thought_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
          title: String(t.title || ''),
          content: String(t.content || ''),
          category: String(t.category || t.type || 'thought'),
          createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now()
        }))
    : [];

  // 2. Normalize comments
  const comments = {};
  if (obj.comments && typeof obj.comments === 'object') {
    for (const [entryId, list] of Object.entries(obj.comments)) {
      if (Array.isArray(list)) {
        comments[String(entryId)] = list
          .filter((c) => c && c.text != null)
          .map((c) => ({
            id: String(c.id || `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
            text: String(c.text || ''),
            timestamp: c.timestamp || (c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'),
            createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now()
          }));
      }
    }
  }

  // 3. Normalize likes
  const likes = {};
  if (obj.likes && typeof obj.likes === 'object') {
    for (const [entryId, voters] of Object.entries(obj.likes)) {
      if (Array.isArray(voters)) {
        likes[String(entryId)] = Array.from(new Set(voters.map(String).filter(Boolean)));
      } else if (voters && typeof voters === 'object' && Array.isArray(voters.likedBy)) {
        likes[String(entryId)] = Array.from(new Set(voters.likedBy.map(String).filter(Boolean)));
      }
    }
  }

  // 4. Normalize deletedIds
  const deletedIds = Array.isArray(obj.deletedIds)
    ? Array.from(new Set(obj.deletedIds.map(String).filter(Boolean)))
    : [];

  return { thoughts, comments, likes, deletedIds };
}

// Read current cached state from localStorage with migration from legacy keys
export function getLocalState() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createEmptyState();
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return normalizeState(JSON.parse(raw));
    }
  } catch (err) {
    console.warn('[DB] Failed reading local storage:', err);
  }

  // Fallback: migrate from legacy keys if available
  try {
    const legacyThoughts = JSON.parse(localStorage.getItem('thoughts_sketchbook_entries_v4') || '[]');
    const legacyComments = JSON.parse(localStorage.getItem('thoughts_sketchbook_comments_v1') || '{}');
    const legacyLikes = JSON.parse(localStorage.getItem('thoughts_sketchbook_likes_v1') || '{}');
    const legacyDeleted = JSON.parse(localStorage.getItem('thoughts_sketchbook_deleted_ids') || '[]');

    const migrated = normalizeState({
      thoughts: legacyThoughts,
      comments: legacyComments,
      likes: legacyLikes,
      deletedIds: legacyDeleted
    });

    saveLocalState(migrated);
    return migrated;
  } catch {
    return createEmptyState();
  }
}

// Save state to localStorage immediately
export function saveLocalState(state) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const normalized = normalizeState(state);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    console.warn('[DB] Failed saving local state:', err);
  }
}

// Fetch the latest state from the shared cloud store
export async function fetchCloudState() {
  const localFallback = getLocalState();
  try {
    const cacheBuster = SHARED_DB_URL.includes('?') 
      ? `${SHARED_DB_URL}&_t=${Date.now()}` 
      : `${SHARED_DB_URL}?_t=${Date.now()}`;

    const res = await fetch(cacheBuster, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });

    if (!res.ok) {
      console.warn(`[DB] Cloud GET returned status ${res.status}, using local cache.`);
      return localFallback;
    }

    const data = await res.json();
    const normalized = normalizeState(data);
    saveLocalState(normalized);
    return normalized;
  } catch (err) {
    console.warn('[DB] Cloud GET error (offline or network blocked), using local cache:', err);
    return localFallback;
  }
}

// Save the state to the shared cloud store via PUT
export async function saveCloudState(state) {
  const normalized = normalizeState(state);
  saveLocalState(normalized);

  try {
    const res = await fetch(SHARED_DB_URL, {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(normalized)
    });

    if (!res.ok) {
      console.warn(`[DB] Cloud PUT returned status ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[DB] Cloud PUT network error:', err);
    return false;
  }
}

// Atomic Fetch-Modify-Save cycle (prevents lost updates)
// 1. GET latest JSON with cache: 'no-store'
// 2. Ensure all keys exist
// 3. Run mutatorFn(state)
// 4. Save state to localStorage immediately AND PUT to SHARED_DB_URL
// 5. Return the updated normalized state
export async function syncWithCloud(mutatorFn) {
  // 1. Fetch latest state from cloud (cache: 'no-store'), falling back to localStorage
  const current = await fetchCloudState();

  // 2. Ensure all keys exist
  let state = normalizeState(current);

  // 3. Run mutator
  if (typeof mutatorFn === 'function') {
    const result = mutatorFn(state);
    if (result && typeof result === 'object') {
      state = result;
    }
  }

  // Force clean normalization after mutation
  state = normalizeState(state);

  // 4. Save to local storage immediately
  saveLocalState(state);

  // 5. Save to cloud asynchronously
  saveCloudState(state).catch((err) => {
    console.warn('[DB] Background cloud save error:', err);
  });

  return state;
}

// Merge INITIAL_ENTRIES and dynamic cloud thoughts while excluding deletedIds
export function mergeEntries(initialEntries = [], cloudThoughts = [], deletedIds = []) {
  const deletedSet = new Set((deletedIds || []).map((id) => String(id)));
  const map = new Map();

  // 1. Dynamic thoughts added by users (excluding deleted)
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

  // Sort descending by creation date / timestamp / ID so most recent appears first
  return Array.from(map.values()).sort((a, b) => {
    const timeA = a.createdAt || (a.id && a.id.startsWith('entry-') ? parseInt(a.id.replace('entry-', ''), 10) || 0 : 0);
    const timeB = b.createdAt || (b.id && b.id.startsWith('entry-') ? parseInt(b.id.replace('entry-', ''), 10) || 0 : 0);
    return timeB - timeA;
  });
}

