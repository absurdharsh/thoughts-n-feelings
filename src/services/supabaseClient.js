// ==========================================================================
// Supabase Client & API Service for Thoughts 'n' Feelings
// Direct integration with the PostgreSQL schema & RLS policies
// ==========================================================================

import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite env, window, or localStorage
function getSupabaseConfig() {
  const url = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof window !== 'undefined' && (window.VITE_SUPABASE_URL || window.SUPABASE_URL || window.localStorage?.getItem('VITE_SUPABASE_URL'))) ||
    '';

  const anonKey = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof window !== 'undefined' && (window.VITE_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || window.localStorage?.getItem('VITE_SUPABASE_ANON_KEY'))) ||
    '';

  return { url: url.trim(), anonKey: anonKey.trim() };
}

const { url: initialUrl, anonKey: initialKey } = getSupabaseConfig();

export const isSupabaseConfigured = Boolean(
  initialUrl && 
  initialKey && 
  initialUrl.startsWith('https://') && 
  !initialUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured 
  ? createClient(initialUrl, initialKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

// Helper: Format ISO date string into readable journal date
function formatJournalDate(isoStr) {
  if (!isoStr) return 'Just Now';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Just Now';
  }
}

// 1. Fetch thoughts from Supabase
export async function fetchThoughtsFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('thoughts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Error fetching thoughts:', error.message);
      return null;
    }

    return (data || []).map((t, index) => ({
      id: t.id,
      number: String(index + 1).padStart(2, '0'),
      type: t.category || 'thought',
      category: t.category || 'thought',
      title: t.title,
      author: 'absurdharsh',
      date: formatJournalDate(t.created_at),
      createdAt: new Date(t.created_at).getTime(),
      doodle: t.category === 'feeling' ? 'eye' : t.category === 'quote' ? 'spark' : 'star',
      content: t.content,
      likes_count: t.likes_count || 0
    }));
  } catch (err) {
    console.warn('[Supabase] Network error fetching thoughts:', err);
    return null;
  }
}

// 2. Insert new thought to Supabase (RLS requires likes_count = 0)
export async function insertThoughtToSupabase(entry) {
  if (!supabase) return null;
  try {
    const payload = {
      title: entry.title.slice(0, 200),
      content: entry.content.slice(0, 5000),
      category: entry.type || entry.category || 'thought',
      likes_count: 0
    };

    // If entry has a valid UUID, use it; otherwise let Postgres gen_random_uuid()
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (entry.id && uuidRegex.test(entry.id)) {
      payload.id = entry.id;
    }

    const { data, error } = await supabase
      .from('thoughts')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error inserting thought:', error.message);
      return null;
    }

    return {
      ...entry,
      id: data.id,
      createdAt: new Date(data.created_at).getTime(),
      date: formatJournalDate(data.created_at)
    };
  } catch (err) {
    console.error('[Supabase] Network error inserting thought:', err);
    return null;
  }
}

// 3. Fetch all comments grouped by thought_id
export async function fetchCommentsFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Supabase] Error fetching comments:', error.message);
      return null;
    }

    const grouped = {};
    (data || []).forEach((c) => {
      if (!grouped[c.thought_id]) {
        grouped[c.thought_id] = [];
      }
      const time = new Date(c.created_at);
      const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      grouped[c.thought_id].push({
        id: c.id,
        text: c.content,
        timestamp: timeStr,
        createdAt: time.getTime()
      });
    });

    return grouped;
  } catch (err) {
    console.warn('[Supabase] Network error fetching comments:', err);
    return null;
  }
}

// 4. Insert an anonymous comment
export async function insertCommentToSupabase(thoughtId, text) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        thought_id: thoughtId,
        content: text.slice(0, 1000)
      }])
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error inserting comment:', error.message);
      return null;
    }

    const time = new Date(data.created_at);
    return {
      id: data.id,
      text: data.content,
      timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: time.getTime()
    };
  } catch (err) {
    console.error('[Supabase] Network error inserting comment:', err);
    return null;
  }
}

// 5. Fetch all likes grouped by thought_id: { [thought_id]: [voter_id1, ...] }
export async function fetchLikesFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('thought_id, voter_id');

    if (error) {
      console.warn('[Supabase] Error fetching likes:', error.message);
      return null;
    }

    const grouped = {};
    (data || []).forEach((row) => {
      if (!grouped[row.thought_id]) {
        grouped[row.thought_id] = [];
      }
      grouped[row.thought_id].push(row.voter_id);
    });

    return grouped;
  } catch (err) {
    console.warn('[Supabase] Network error fetching likes:', err);
    return null;
  }
}

// 6. Toggle Like using PostgreSQL RPC function: toggle_like(target_thought_id, user_voter_id)
export async function toggleLikeInSupabase(thoughtId, voterId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('toggle_like', {
      target_thought_id: thoughtId,
      user_voter_id: voterId
    });

    if (error) {
      console.error('[Supabase] Error executing toggle_like RPC:', error.message);
      return null;
    }

    return typeof data === 'number' ? data : null;
  } catch (err) {
    console.error('[Supabase] Network error executing toggle_like:', err);
    return null;
  }
}

// 7. Owner Delete Thought using PostgreSQL RPC function: owner_delete_thought(target_id, secret_passkey)
export async function ownerDeleteThoughtInSupabase(thoughtId, secretPasskey) {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc('owner_delete_thought', {
      target_id: thoughtId,
      secret_passkey: secretPasskey
    });

    if (error) {
      console.error('[Supabase] Error deleting thought via RPC:', error.message);
      return false;
    }

    return Boolean(data);
  } catch (err) {
    console.error('[Supabase] Network error deleting thought:', err);
    return false;
  }
}

// 8. Owner Delete Comment using PostgreSQL RPC function: owner_delete_comment(target_id, secret_passkey)
export async function ownerDeleteCommentInSupabase(commentId, secretPasskey) {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc('owner_delete_comment', {
      target_id: commentId,
      secret_passkey: secretPasskey
    });

    if (error) {
      console.error('[Supabase] Error deleting comment via RPC:', error.message);
      return false;
    }

    return Boolean(data);
  } catch (err) {
    console.error('[Supabase] Network error deleting comment:', err);
    return false;
  }
}

