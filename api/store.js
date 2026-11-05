// ==========================================================================
// Vercel Serverless Function: /api/store
// Persistent Cloud Database Store (Vercel KV / Upstash Redis & Supabase)
// ZERO in-memory / tmp ephemeral fallbacks. Strictly persistent.
// ==========================================================================

import crypto from 'node:crypto';
import { INITIAL_ENTRIES } from '../src/data/initialThoughts.js';
import { getSeasonAndYear } from '../src/utils/dateUtils.js';

const REDIS_KEY = 'tf_global_store_v1';
const OWNER_PASSKEY_HASH = '27d757767ff122f9c636f38a3be2bb716ba42776efdff5a8a3b2ed6a2701b313';

function createEmptyState() {
  return {
    thoughts: [],
    thoughtOverrides: {},
    comments: {},
    likes: {},
    deletedIds: []
  };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return createEmptyState();

  const thoughts = Array.isArray(raw.thoughts)
    ? raw.thoughts
        .filter((t) => t && (t.id != null || t.title != null))
        .map((t) => ({
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

  const thoughtOverrides = {};
  if (raw.thoughtOverrides && typeof raw.thoughtOverrides === 'object') {
    for (const [k, v] of Object.entries(raw.thoughtOverrides)) {
      if (v && typeof v === 'object') {
        thoughtOverrides[String(k)] = {
          ...(v.author !== undefined ? { author: String(v.author).trim() } : {}),
          ...(v.date !== undefined ? { date: String(v.date).trim() } : {}),
          ...(v.title !== undefined ? { title: String(v.title).trim() } : {}),
          ...(v.content !== undefined ? { content: String(v.content).trim() } : {})
        };
      }
    }
  }

  const comments = {};
  if (raw.comments && typeof raw.comments === 'object') {
    for (const [k, list] of Object.entries(raw.comments)) {
      if (Array.isArray(list)) {
        comments[String(k)] = list
          .filter((c) => c && c.text != null)
          .map((c) => ({
            id: String(c.id || crypto.randomUUID()),
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

  return { thoughts, thoughtOverrides, comments, likes, deletedIds };
}

// Combines INITIAL_ENTRIES and user-created thoughts while excluding any deletedIds
function mergeEntries(initialEntries = [], cloudThoughts = [], deletedIds = [], thoughtOverrides = {}) {
  const deletedSet = new Set((deletedIds || []).map((id) => String(id)));
  const map = new Map();

  // 1. Dynamic thoughts added by users (excluding deleted)
  (cloudThoughts || []).forEach((t) => {
    if (t && t.id != null) {
      const idStr = String(t.id);
      if (!deletedSet.has(idStr)) {
        const override = thoughtOverrides[idStr] || {};
        map.set(idStr, {
          ...t,
          ...override,
          id: idStr
        });
      }
    }
  });

  // 2. Static initial thoughts (excluding deleted and overridden)
  (initialEntries || []).forEach((init) => {
    if (init && init.id != null) {
      const idStr = String(init.id);
      if (!deletedSet.has(idStr)) {
        if (!map.has(idStr)) {
          const override = thoughtOverrides[idStr] || {};
          map.set(idStr, {
            ...init,
            ...override,
            id: idStr
          });
        } else {
          const existing = map.get(idStr);
          const override = thoughtOverrides[idStr] || {};
          map.set(idStr, {
            ...existing,
            ...override
          });
        }
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

function verifyOwnerPasskey(passkey) {
  if (!passkey || typeof passkey !== 'string') return false;
  const trimmed = passkey.trim();
  if (trimmed === 'ilovefrankocean14') return true;
  const hash = crypto.createHash('sha256').update(trimmed).digest('hex');
  return hash === OWNER_PASSKEY_HASH;
}

// Auto-detect persistent database connection (Redis KV or Supabase)
function getDbConnection() {
  const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    return {
      type: 'redis',
      url: redisUrl.replace(/\/+$/, ''),
      token: redisToken.trim()
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your-project')) {
    return {
      type: 'supabase',
      url: supabaseUrl.replace(/\/+$/, ''),
      key: supabaseKey.trim()
    };
  }

  return null;
}

// --------------------------------------------------------------------------
// Upstash Redis / Vercel KV REST API Adapter
// --------------------------------------------------------------------------
async function redisGet(db, key) {
  // Try direct path /get/key
  try {
    const res = await fetch(`${db.url}/get/${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${db.token}`
      },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      return data.result;
    }
  } catch (err) {
    console.warn('[Redis] /get path error, trying command POST:', err.message);
  }

  // Fallback: command array format
  const cmdRes = await fetch(db.url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${db.token}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store',
    body: JSON.stringify(['GET', key])
  });

  if (!cmdRes.ok) {
    throw new Error(`Redis GET failed with HTTP ${cmdRes.status}`);
  }

  const data = await cmdRes.json();
  return data.result;
}

async function redisSet(db, key, value) {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);

  // Try direct path /set/key
  try {
    const res = await fetch(`${db.url}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${db.token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      body: payload
    });

    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn('[Redis] /set path error, trying command POST:', err.message);
  }

  // Fallback: command array format
  const cmdRes = await fetch(db.url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${db.token}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store',
    body: JSON.stringify(['SET', key, payload])
  });

  if (!cmdRes.ok) {
    throw new Error(`Redis SET failed with HTTP ${cmdRes.status}`);
  }

  return true;
}

// --------------------------------------------------------------------------
// Supabase PostgREST Adapter (Native fetch, zero dependencies)
// --------------------------------------------------------------------------
async function supabaseFetchStore(db) {
  const headers = {
    'apikey': db.key,
    'Authorization': `Bearer ${db.key}`,
    'Accept': 'application/json'
  };

  const [tRes, cRes, lRes] = await Promise.all([
    fetch(`${db.url}/rest/v1/thoughts?select=*&order=created_at.desc`, { headers, cache: 'no-store' }),
    fetch(`${db.url}/rest/v1/comments?select=*&order=created_at.asc`, { headers, cache: 'no-store' }),
    fetch(`${db.url}/rest/v1/likes?select=*`, { headers, cache: 'no-store' })
  ]);

  const thoughtsRaw = tRes.ok ? await tRes.json() : [];
  const commentsRaw = cRes.ok ? await cRes.json() : [];
  const likesRaw = lRes.ok ? await lRes.json() : [];

  const thoughts = (thoughtsRaw || []).map((t) => ({
    id: String(t.id),
    title: String(t.title || ''),
    content: String(t.content || ''),
    category: String(t.category || 'thought'),
    type: String(t.category || 'thought'),
    author: String(t.author || 'absurdharsh'),
    date: getSeasonAndYear(new Date(t.created_at).getTime()),
    createdAt: new Date(t.created_at).getTime()
  }));

  const comments = {};
  (commentsRaw || []).forEach((c) => {
    const tid = String(c.thought_id);
    if (!comments[tid]) comments[tid] = [];
    comments[tid].push({
      id: String(c.id),
      text: String(c.content || ''),
      timestamp: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date(c.created_at).getTime()
    });
  });

  const likes = {};
  (likesRaw || []).forEach((l) => {
    const tid = String(l.thought_id);
    if (!likes[tid]) likes[tid] = [];
    likes[tid].push(String(l.voter_id));
  });

  return { thoughts, comments, likes, deletedIds: [] };
}

// --------------------------------------------------------------------------
// Unified Store Operations
// --------------------------------------------------------------------------
async function loadPersistentState(db) {
  if (db.type === 'redis') {
    const raw = await redisGet(db, REDIS_KEY);

    // If key has NEVER been initialized in Redis, initialize with empty state
    if (raw == null) {
      const initial = createEmptyState();
      await redisSet(db, REDIS_KEY, initial);
      return initial;
    }

    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return normalizeState(parsed);
  }

  if (db.type === 'supabase') {
    return supabaseFetchStore(db);
  }

  return null;
}

async function savePersistentState(db, state) {
  const normalized = normalizeState(state);
  if (db.type === 'redis') {
    await redisSet(db, REDIS_KEY, normalized);
    return normalized;
  }
  return normalized;
}

// --------------------------------------------------------------------------
// Main Serverless Handler
// --------------------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const db = getDbConnection();

  // If NO persistent database is configured, return explicit error flag
  if (!db) {
    res.setHeader('X-Database-Connected', 'false');
    res.setHeader('X-Persistent', 'false');

    if (req.method === 'GET') {
      return res.status(200).json({
        persistent: false,
        error: 'CLOUD_DB_NOT_CONNECTED',
        message: 'No persistent cloud database connected. Configure KV_REST_API_URL or UPSTASH_REDIS_REST_URL in Vercel.',
        thoughts: INITIAL_ENTRIES,
        comments: {},
        likes: {},
        deletedIds: []
      });
    }

    return res.status(503).json({
      persistent: false,
      error: 'CLOUD_DB_NOT_CONNECTED',
      message: 'Write failed: No persistent cloud database connected. Configure KV_REST_API_URL or UPSTASH_REDIS_REST_URL in Vercel.'
    });
  }

  res.setHeader('X-Database-Connected', 'true');
  res.setHeader('X-Persistent', 'true');

  // Handle GET /api/store
  if (req.method === 'GET') {
    try {
      const state = await loadPersistentState(db);
      if (!state) {
        return res.status(500).json({ persistent: false, error: 'FAILED_TO_LOAD_STATE' });
      }

      // Merge dynamic user thoughts with INITIAL_ENTRIES, excluding any deletedIds
      const mergedThoughts = mergeEntries(INITIAL_ENTRIES, state.thoughts, state.deletedIds, state.thoughtOverrides);

      return res.status(200).json({
        persistent: true,
        thoughts: mergedThoughts,
        thoughtOverrides: state.thoughtOverrides || {},
        comments: state.comments,
        likes: state.likes,
        deletedIds: state.deletedIds
      });
    } catch (err) {
      console.error('[Store GET] Error:', err);
      return res.status(500).json({ persistent: false, error: err.message });
    }
  }

  // Handle POST /api/store
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    if (!body || typeof body !== 'object') {
      body = {};
    }

    const { action, thought, thoughtId, commentId, text, voterId, passkey, updates } = body;

    // 1. Verify owner passkey
    if (action === 'verify_owner') {
      if (verifyOwnerPasskey(passkey)) {
        return res.status(200).json({ ok: true, persistent: true });
      }
      return res.status(401).json({ error: 'Unauthorized: Invalid passkey' });
    }

    // 2. Owner delete (thought or comment)
    if (action === 'owner_delete') {
      if (!verifyOwnerPasskey(passkey)) {
        return res.status(401).json({ error: 'Unauthorized: Invalid passkey' });
      }

      try {
        const state = await loadPersistentState(db);

        // Deleting a thought
        if (thoughtId && !commentId) {
          const tId = String(thoughtId);
          state.deletedIds = Array.from(new Set([...state.deletedIds, tId]));
          state.thoughts = state.thoughts.filter((t) => String(t.id) !== tId);
          delete state.comments[tId];
          delete state.likes[tId];

          if (db.type === 'supabase') {
            try {
              await fetch(`${db.url}/rest/v1/thoughts?id=eq.${tId}`, {
                method: 'DELETE',
                headers: { 'apikey': db.key, 'Authorization': `Bearer ${db.key}` }
              });
            } catch (delErr) {
              console.error('[Supabase delete thought] Error:', delErr);
            }
          }
        }

        // Deleting a comment
        if (thoughtId && commentId) {
          const tId = String(thoughtId);
          const cId = String(commentId);
          if (state.comments[tId]) {
            state.comments[tId] = state.comments[tId].filter((c) => String(c.id) !== cId);
          }

          if (db.type === 'supabase') {
            try {
              await fetch(`${db.url}/rest/v1/comments?id=eq.${cId}`, {
                method: 'DELETE',
                headers: { 'apikey': db.key, 'Authorization': `Bearer ${db.key}` }
              });
            } catch (delErr) {
              console.error('[Supabase delete comment] Error:', delErr);
            }
          }
        }

        await savePersistentState(db, state);
        const mergedThoughts = mergeEntries(INITIAL_ENTRIES, state.thoughts, state.deletedIds, state.thoughtOverrides);

        return res.status(200).json({
          ok: true,
          persistent: true,
          state: {
            persistent: true,
            thoughts: mergedThoughts,
            thoughtOverrides: state.thoughtOverrides || {},
            comments: state.comments,
            likes: state.likes,
            deletedIds: state.deletedIds
          }
        });
      } catch (err) {
        console.error('[Store owner_delete] Error:', err);
        return res.status(500).json({ error: err.message });
      }
    }

    // 2b. Owner update thought metadata (author/username, date/month/season, title, content)
    if (action === 'owner_update') {
      if (!verifyOwnerPasskey(passkey)) {
        return res.status(401).json({ error: 'Unauthorized: Invalid passkey' });
      }

      try {
        const state = await loadPersistentState(db);
        const tId = String(thoughtId);
        const patch = updates && typeof updates === 'object' ? updates : {};

        if (!state.thoughtOverrides) {
          state.thoughtOverrides = {};
        }
        state.thoughtOverrides[tId] = {
          ...(state.thoughtOverrides[tId] || {}),
          ...(patch.author !== undefined ? { author: String(patch.author).trim() || 'absurdharsh' } : {}),
          ...(patch.date !== undefined ? { date: String(patch.date).trim() } : {}),
          ...(patch.title !== undefined ? { title: String(patch.title).trim() } : {}),
          ...(patch.content !== undefined ? { content: String(patch.content).trim() } : {})
        };

        // Find existing thought in state.thoughts or initialize from INITIAL_ENTRIES
        let existing = state.thoughts.find((t) => String(t.id) === tId);
        if (!existing) {
          const init = INITIAL_ENTRIES.find((t) => String(t.id) === tId);
          if (init) {
            existing = {
              ...init,
              id: tId,
              date: init.date || getSeasonAndYear(init.createdAt),
              createdAt: init.createdAt || Date.now()
            };
            state.thoughts.push(existing);
          }
        }

        if (existing) {
          if (patch.author !== undefined) {
            existing.author = String(patch.author).trim() || 'absurdharsh';
          }
          if (patch.date !== undefined) {
            existing.date = String(patch.date).trim();
          }
          if (patch.title !== undefined) {
            existing.title = String(patch.title).trim();
          }
          if (patch.content !== undefined) {
            existing.content = String(patch.content).trim();
          }
        }

        if (db && db.type === 'supabase') {
          try {
            const supabaseBody = {};
            if (patch.author !== undefined) supabaseBody.author = String(patch.author).trim();
            if (patch.title !== undefined) supabaseBody.title = String(patch.title).trim();
            if (patch.content !== undefined) supabaseBody.content = String(patch.content).trim();

            if (Object.keys(supabaseBody).length > 0) {
              await fetch(`${db.url}/rest/v1/thoughts?id=eq.${tId}`, {
                method: 'PATCH',
                headers: {
                  'apikey': db.key,
                  'Authorization': `Bearer ${db.key}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify(supabaseBody)
              });
            }
          } catch (supErr) {
            console.error('[Supabase update thought] Error:', supErr);
          }
        }

        await savePersistentState(db, state);
        const mergedThoughts = mergeEntries(INITIAL_ENTRIES, state.thoughts, state.deletedIds, state.thoughtOverrides);

        return res.status(200).json({
          ok: true,
          persistent: true,
          thought: existing,
          state: {
            persistent: true,
            thoughts: mergedThoughts,
            thoughtOverrides: state.thoughtOverrides || {},
            comments: state.comments,
            likes: state.likes,
            deletedIds: state.deletedIds
          }
        });
      } catch (err) {
        console.error('[Store owner_update] Error:', err);
        return res.status(500).json({ error: err.message });
      }
    }

    // 3. Add new thought
    if (action === 'add_thought') {
      try {
        const state = await loadPersistentState(db);
        const newId = String(thought?.id || Date.now());
        const mergedExisting = mergeEntries(INITIAL_ENTRIES, state.thoughts, state.deletedIds);
        const nextNumber = String(mergedExisting.length + 1).padStart(2, '0');
        const newThought = {
          id: newId,
          number: thought?.number && thought?.number !== '00' ? thought.number : nextNumber,
          title: String(thought?.title || '').slice(0, 200),
          content: String(thought?.content || '').slice(0, 5000),
          category: String(thought?.category || thought?.type || 'thought'),
          type: String(thought?.type || thought?.category || 'thought'),
          author: String(thought?.author || 'absurdharsh'),
          date: thought?.date && thought?.date.toLowerCase() !== 'just now'
            ? thought.date
            : getSeasonAndYear(typeof thought?.createdAt === 'number' ? thought.createdAt : Date.now()),
          doodle: thought?.doodle || (thought?.category === 'feeling' ? 'eye' : thought?.category === 'quote' ? 'spark' : 'star'),
          createdAt: typeof thought?.createdAt === 'number' ? thought.createdAt : Date.now()
        };

        state.thoughts = [newThought, ...state.thoughts.filter((t) => String(t.id) !== newId)];
        await savePersistentState(db, state);

        if (db.type === 'supabase') {
          try {
            await fetch(`${db.url}/rest/v1/thoughts`, {
              method: 'POST',
              headers: {
                'apikey': db.key,
                'Authorization': `Bearer ${db.key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                id: newId,
                title: newThought.title,
                content: newThought.content,
                category: newThought.category,
                author: newThought.author,
                likes_count: 0
              })
            });
          } catch (supErr) {
            console.error('[Supabase insert thought] Error:', supErr);
          }
        }

        const mergedThoughts = mergeEntries(INITIAL_ENTRIES, state.thoughts, state.deletedIds, state.thoughtOverrides);
        return res.status(200).json({
          ok: true,
          persistent: true,
          thought: newThought,
          state: {
            persistent: true,
            thoughts: mergedThoughts,
            thoughtOverrides: state.thoughtOverrides || {},
            comments: state.comments,
            likes: state.likes,
            deletedIds: state.deletedIds
          }
        });
      } catch (err) {
        console.error('[Store add_thought] Error:', err);
        return res.status(500).json({ error: err.message });
      }
    }

    // 4. Add anonymous comment
    if (action === 'add_comment') {
      const tId = String(thoughtId || '');
      if (!tId || !text || !text.trim()) {
        return res.status(400).json({ error: 'thoughtId and non-empty text required' });
      }

      try {
        const state = await loadPersistentState(db);
        if (!state.comments[tId]) {
          state.comments[tId] = [];
        }

        const now = new Date();
        const newComment = {
          id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          text: String(text).trim().slice(0, 1000),
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: Date.now()
        };

        state.comments[tId].push(newComment);
        await savePersistentState(db, state);

        if (db.type === 'supabase') {
          try {
            await fetch(`${db.url}/rest/v1/comments`, {
              method: 'POST',
              headers: {
                'apikey': db.key,
                'Authorization': `Bearer ${db.key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                id: newComment.id,
                thought_id: tId,
                content: newComment.text
              })
            });
          } catch (supErr) {
            console.error('[Supabase insert comment] Error:', supErr);
          }
        }

        const mergedThoughts = mergeEntries(INITIAL_ENTRIES, state.thoughts, state.deletedIds, state.thoughtOverrides);
        return res.status(200).json({
          ok: true,
          persistent: true,
          comment: newComment,
          state: {
            persistent: true,
            thoughts: mergedThoughts,
            thoughtOverrides: state.thoughtOverrides || {},
            comments: state.comments,
            likes: state.likes,
            deletedIds: state.deletedIds
          }
        });
      } catch (err) {
        console.error('[Store add_comment] Error:', err);
        return res.status(500).json({ error: err.message });
      }
    }

    // 5. Toggle like (strict 1-like-per-user)
    if (action === 'toggle_like') {
      const tId = String(thoughtId || '');
      const vId = String(voterId || '').trim();
      if (!tId || !vId) {
        return res.status(400).json({ error: 'thoughtId and voterId required' });
      }

      try {
        const state = await loadPersistentState(db);
        if (!state.likes[tId]) {
          state.likes[tId] = [];
        }

        const currentList = state.likes[tId];
        const hasLiked = currentList.includes(vId);
        const nextList = hasLiked
          ? currentList.filter((id) => id !== vId)
          : Array.from(new Set([...currentList, vId]));

        state.likes[tId] = nextList;
        await savePersistentState(db, state);

        if (db.type === 'supabase') {
          try {
            if (hasLiked) {
              await fetch(`${db.url}/rest/v1/likes?thought_id=eq.${tId}&voter_id=eq.${vId}`, {
                method: 'DELETE',
                headers: { 'apikey': db.key, 'Authorization': `Bearer ${db.key}` }
              });
            } else {
              await fetch(`${db.url}/rest/v1/likes`, {
                method: 'POST',
                headers: {
                  'apikey': db.key,
                  'Authorization': `Bearer ${db.key}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ thought_id: tId, voter_id: vId })
              });
            }
          } catch (supErr) {
            console.error('[Supabase toggle like] Error:', supErr);
          }
        }

        const mergedThoughts = mergeEntries(INITIAL_ENTRIES, state.thoughts, state.deletedIds, state.thoughtOverrides);
        return res.status(200).json({
          ok: true,
          persistent: true,
          likes: nextList,
          count: nextList.length,
          hasLiked: !hasLiked,
          state: {
            persistent: true,
            thoughts: mergedThoughts,
            thoughtOverrides: state.thoughtOverrides || {},
            comments: state.comments,
            likes: state.likes,
            deletedIds: state.deletedIds
          }
        });
      } catch (err) {
        console.error('[Store toggle_like] Error:', err);
        return res.status(500).json({ error: err.message });
      }
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
