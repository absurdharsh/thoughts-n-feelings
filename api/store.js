// ==========================================================================
// Vercel Serverless Function: /api/store
// Secure KV / Upstash Redis Store with Owner Passkey Verification
// ==========================================================================

import crypto from 'node:crypto';

const REDIS_KEY = 'tf_global_store_v1';
const OWNER_PASSKEY_HASH = 'acf7001eb827b019664b5f194d8969ed537f78d95117b0928d7eed0a6fec242d';

function defaultState() {
  return {
    thoughts: [],
    comments: {},
    likes: {},
    deletedIds: []
  };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return defaultState();

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
          date: t.date || 'Just Now',
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

  return { thoughts, comments, likes, deletedIds };
}

// In-memory fallback if Redis credentials are not configured yet
global._tf_memory_store = global._tf_memory_store || defaultState();

async function redisCommand(commandArray) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  const endpoint = url.endsWith('/') ? url.slice(0, -1) : url;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commandArray)
  });

  if (!res.ok) {
    throw new Error(`Redis HTTP error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.result;
}

async function getStore() {
  try {
    const res = await redisCommand(['GET', REDIS_KEY]);
    if (res != null) {
      const parsed = typeof res === 'string' ? JSON.parse(res) : res;
      return normalizeState(parsed);
    }
    // If Redis is configured but key not yet initialized, set empty state
    if (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) {
      const initial = defaultState();
      await redisCommand(['SET', REDIS_KEY, JSON.stringify(initial)]);
      return initial;
    }
  } catch (err) {
    console.warn('[Redis] GET error, using fallback:', err.message);
  }
  return normalizeState(global._tf_memory_store);
}

async function setStore(state) {
  const normalized = normalizeState(state);
  global._tf_memory_store = normalized;
  try {
    if (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) {
      await redisCommand(['SET', REDIS_KEY, JSON.stringify(normalized)]);
    }
  } catch (err) {
    console.warn('[Redis] SET error, using fallback:', err.message);
  }
  return normalized;
}

function verifyOwnerPasskey(passkey) {
  if (!passkey || typeof passkey !== 'string') return false;
  const hash = crypto.createHash('sha256').update(passkey.trim()).digest('hex');
  return hash === OWNER_PASSKEY_HASH;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Handle GET /api/store
  if (req.method === 'GET') {
    try {
      const state = await getStore();
      return res.status(200).json(state);
    } catch (err) {
      console.error('[Store GET] Error:', err);
      return res.status(500).json({ error: 'Failed to retrieve store' });
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

    const { action, thought, thoughtId, commentId, text, voterId, passkey } = body;

    // 1. Verify owner passkey
    if (action === 'verify_owner') {
      if (verifyOwnerPasskey(passkey)) {
        return res.status(200).json({ ok: true });
      }
      return res.status(401).json({ error: 'Unauthorized: Invalid passkey' });
    }

    // 2. Owner delete (thought or comment)
    if (action === 'owner_delete') {
      if (!verifyOwnerPasskey(passkey)) {
        return res.status(401).json({ error: 'Unauthorized: Invalid passkey' });
      }

      const state = await getStore();

      // Deleting an entire thought
      if (thoughtId && !commentId) {
        const tId = String(thoughtId);
        state.deletedIds = Array.from(new Set([...state.deletedIds, tId]));
        state.thoughts = state.thoughts.filter((t) => String(t.id) !== tId);
        delete state.comments[tId];
        delete state.likes[tId];
      }

      // Deleting a specific comment
      if (thoughtId && commentId) {
        const tId = String(thoughtId);
        const cId = String(commentId);
        if (state.comments[tId]) {
          state.comments[tId] = state.comments[tId].filter((c) => String(c.id) !== cId);
        }
      }

      const updated = await setStore(state);
      return res.status(200).json({ ok: true, state: updated });
    }

    // 3. Add new thought
    if (action === 'add_thought') {
      const state = await getStore();
      const newId = String(thought?.id || Date.now());
      const newThought = {
        id: newId,
        number: thought?.number || '00',
        title: String(thought?.title || '').slice(0, 200),
        content: String(thought?.content || '').slice(0, 5000),
        category: String(thought?.category || thought?.type || 'thought'),
        type: String(thought?.type || thought?.category || 'thought'),
        author: String(thought?.author || 'absurdharsh'),
        date: thought?.date || 'Just Now',
        doodle: thought?.doodle || (thought?.category === 'feeling' ? 'eye' : thought?.category === 'quote' ? 'spark' : 'star'),
        createdAt: typeof thought?.createdAt === 'number' ? thought.createdAt : Date.now()
      };

      state.thoughts = [newThought, ...state.thoughts.filter((t) => String(t.id) !== newId)];
      const updated = await setStore(state);
      return res.status(200).json({ ok: true, thought: newThought, state: updated });
    }

    // 4. Add anonymous comment
    if (action === 'add_comment') {
      const tId = String(thoughtId || '');
      if (!tId || !text || !text.trim()) {
        return res.status(400).json({ error: 'thoughtId and non-empty text required' });
      }

      const state = await getStore();
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
      const updated = await setStore(state);
      return res.status(200).json({ ok: true, comment: newComment, state: updated });
    }

    // 5. Toggle like (strict 1-like-per-user)
    if (action === 'toggle_like') {
      const tId = String(thoughtId || '');
      const vId = String(voterId || '').trim();
      if (!tId || !vId) {
        return res.status(400).json({ error: 'thoughtId and voterId required' });
      }

      const state = await getStore();
      if (!state.likes[tId]) {
        state.likes[tId] = [];
      }

      const currentList = state.likes[tId];
      const hasLiked = currentList.includes(vId);
      const nextList = hasLiked
        ? currentList.filter((id) => id !== vId)
        : Array.from(new Set([...currentList, vId]));

      state.likes[tId] = nextList;
      const updated = await setStore(state);
      return res.status(200).json({
        ok: true,
        likes: nextList,
        count: nextList.length,
        hasLiked: !hasLiked,
        state: updated
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

