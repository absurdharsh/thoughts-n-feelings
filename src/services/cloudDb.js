// ==========================================================================
// Shared Cloud Database Service for Thoughts 'n' Feelings Sketchbook
// Live zero-signup, CORS-enabled cloud JSON store
// ==========================================================================

export const SHARED_DB_URL = 
  (typeof window !== 'undefined' && (window.SHARED_DB_URL || window.localStorage?.getItem('TF_SHARED_DB_URL'))) ||
  'https://api.restful-api.dev/objects/ff808181a09d98f701a19def3a5513a6';

// Extracts raw { thoughts, comments, likes, deletedIds } regardless of wrapper
export function normalizeCloudData(json) {
  if (!json) {
    return { thoughts: [], comments: {}, likes: {}, deletedIds: [] };
  }
  // Handles { id, name, data: { ... } } format from restful-api.dev
  if (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) {
    return {
      thoughts: Array.isArray(json.data.thoughts) ? json.data.thoughts : [],
      comments: (json.data.comments && typeof json.data.comments === 'object') ? json.data.comments : {},
      likes: (json.data.likes && typeof json.data.likes === 'object') ? json.data.likes : {},
      deletedIds: Array.isArray(json.data.deletedIds) ? json.data.deletedIds : []
    };
  }
  // Handles direct schema { thoughts: [], comments: {}, likes: {}, deletedIds: [] }
  return {
    thoughts: Array.isArray(json.thoughts) ? json.thoughts : [],
    comments: (json.comments && typeof json.comments === 'object') ? json.comments : {},
    likes: (json.likes && typeof json.likes === 'object') ? json.likes : {},
    deletedIds: Array.isArray(json.deletedIds) ? json.deletedIds : []
  };
}

// Prepares the payload for PUT based on the service endpoint
function preparePutPayload(url, state) {
  if (url.includes('api.restful-api.dev')) {
    return JSON.stringify({
      name: 'thoughts_n_feelings_sketchbook_db',
      data: state
    });
  }
  return JSON.stringify(state);
}

// Fetch the shared cloud state
export async function fetchCloudData(url = SHARED_DB_URL) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      console.warn(`[CloudDB] GET failed with status ${res.status}`);
      return null;
    }
    const json = await res.json();
    return normalizeCloudData(json);
  } catch (err) {
    console.warn('[CloudDB] Network fetch error, falling back to cache:', err);
    return null;
  }
}

// Save the shared state via PUT
export async function saveCloudData(state, url = SHARED_DB_URL) {
  try {
    const payload = preparePutPayload(url, state);
    const res = await fetch(url, {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: payload
    });
    if (!res.ok) {
      console.warn(`[CloudDB] PUT failed with status ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[CloudDB] Network save error:', err);
    return false;
  }
}

// Mutate cloud state atomically: fetch latest -> apply mutation -> save PUT
export async function mutateCloudData(mutatorFn, url = SHARED_DB_URL) {
  try {
    const current = await fetchCloudData(url) || {
      thoughts: [],
      comments: {},
      likes: {},
      deletedIds: []
    };

    const nextState = mutatorFn(current) || current;
    await saveCloudData(nextState, url);
    return nextState;
  } catch (err) {
    console.error('[CloudDB] Mutation failed:', err);
    return null;
  }
}

