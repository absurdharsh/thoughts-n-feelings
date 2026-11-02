import React, { useState, useEffect, useCallback, useRef } from 'react';
import SmoothScrollProvider from './components/SmoothScrollProvider';
import HandDrawnHero from './components/HandDrawnHero';
import DigitalBookLayout from './components/DigitalBookLayout';
import RetroStatusBar from './components/RetroStatusBar';
import HandDrawnThoughtModal from './components/HandDrawnThoughtModal';
import { INITIAL_ENTRIES } from './data/initialThoughts';
import { getPersistentVoterId } from './utils/voterId';
import {
  fetchCloudData,
  mutateCloudData
} from './services/cloudDb';
import {
  isSupabaseConfigured,
  supabase,
  fetchThoughtsFromSupabase,
  insertThoughtToSupabase,
  fetchCommentsFromSupabase,
  fetchCommentsForThoughtFromSupabase,
  insertCommentToSupabase,
  fetchLikesFromSupabase,
  toggleLikeInSupabase
} from './services/supabaseClient';

// Exact owner passkey verification helper (SHA-256 hex digest)
const OWNER_PASSKEY_HASH = 'acf7001eb827b019664b5f194d8969ed537f78d95117b0928d7eed0a6fec242d';

async function verifyOwnerPasskey(input) {
  if (!input) return false;
  const data = new TextEncoder().encode(input.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex === OWNER_PASSKEY_HASH;
}

// Check if owner mode is unlocked in sessionStorage
function checkOwnerUnlocked() {
  try {
    return (
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('tf_owner_unlocked') === 'true') ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('tf_owner_unlocked') === 'true')
    );
  } catch {
    return false;
  }
}

// Sort helper: Most recent entries first (descending by createdAt / timestamp / ID)
function sortEntriesDescending(list) {
  return [...list].sort((a, b) => {
    const timeA = a.createdAt || (a.id && a.id.startsWith('entry-') ? parseInt(a.id.replace('entry-', ''), 10) || 0 : 0);
    const timeB = b.createdAt || (b.id && b.id.startsWith('entry-') ? parseInt(b.id.replace('entry-', ''), 10) || 0 : 0);
    return timeB - timeA;
  });
}

// Seed & Merge helper: Combines INITIAL_ENTRIES with cloud thoughts while respecting owner deletions
function mergeEntries(cloudThoughts = [], deletedIds = []) {
  let localDeletedIds = [];
  try {
    const saved = localStorage.getItem('thoughts_sketchbook_deleted_ids');
    if (saved) localDeletedIds = JSON.parse(saved);
  } catch {}

  const allDeleted = new Set([
    ...(deletedIds || []),
    ...(localDeletedIds || [])
  ]);

  const map = new Map();

  // 1. Add cloud thoughts first (excluding any in allDeleted)
  (cloudThoughts || []).forEach((item) => {
    if (item && item.id && !allDeleted.has(item.id)) {
      map.set(item.id, item);
    }
  });

  // 2. Add INITIAL_ENTRIES that have not been deleted and not overridden
  INITIAL_ENTRIES.forEach((init) => {
    if (!allDeleted.has(init.id) && !map.has(init.id)) {
      map.set(init.id, init);
    }
  });

  return sortEntriesDescending(Array.from(map.values()));
}

export default function App() {
  // Binary Theme: Light mode (Paper #FFFFFF, Ink #000000) by default
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('sketchbook_theme') === 'dark';
    } catch {
      return false;
    }
  });

  // Entries: initialized from localStorage cache and initial entries, excluding deletedIds
  const [entries, setEntries] = useState(() => {
    let localDeletedIds = [];
    try {
      const savedDel = localStorage.getItem('thoughts_sketchbook_deleted_ids');
      if (savedDel) localDeletedIds = JSON.parse(savedDel);
    } catch {}

    try {
      const saved = localStorage.getItem('thoughts_sketchbook_entries_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mergeEntries(parsed, localDeletedIds);
        }
      }
    } catch {}
    return mergeEntries([], localDeletedIds);
  });

  // Persistent anonymous voter ID (stored in localStorage under 'tf_voter_id')
  const [voterId, setVoterId] = useState('');

  useEffect(() => {
    getPersistentVoterId().then((id) => setVoterId(id));
  }, []);

  // Real-Only Likes store: keyed by entry.id -> array of unique voter IDs [voterId1, voterId2, ...]
  const [likesData, setLikesData] = useState(() => {
    try {
      const saved = localStorage.getItem('thoughts_sketchbook_likes_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Anonymous Comments store: keyed by entry.id -> [{ id, text, createdAt, timestamp }]
  const [comments, setComments] = useState(() => {
    try {
      const saved = localStorage.getItem('thoughts_sketchbook_comments_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Secret Owner Session (verified via SHA-256 and stored in sessionStorage)
  const [isOwner, setIsOwner] = useState(checkOwnerUnlocked);

  const isSyncingRef = useRef(false);

  // Synchronize state from Supabase (or Fallback Cloud DB)
  const syncFromRemote = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      if (isSupabaseConfigured) {
        const [sbThoughts, sbComments, sbLikes] = await Promise.all([
          fetchThoughtsFromSupabase(),
          fetchCommentsFromSupabase(),
          fetchLikesFromSupabase()
        ]);

        if (sbThoughts) {
          const merged = mergeEntries(sbThoughts, []);
          setEntries(merged);
          try {
            localStorage.setItem('thoughts_sketchbook_entries_v4', JSON.stringify(merged));
          } catch {}
        }

        if (sbComments) {
          setComments(sbComments);
          try {
            localStorage.setItem('thoughts_sketchbook_comments_v1', JSON.stringify(sbComments));
          } catch {}
        }

        if (sbLikes) {
          setLikesData(sbLikes);
          try {
            localStorage.setItem('thoughts_sketchbook_likes_v1', JSON.stringify(sbLikes));
          } catch {}
        }
      } else {
        const cloud = await fetchCloudData();
        if (cloud) {
          const merged = mergeEntries(cloud.thoughts, cloud.deletedIds);
          setEntries(merged);
          try {
            localStorage.setItem('thoughts_sketchbook_entries_v4', JSON.stringify(merged));
          } catch {}

          if (cloud.comments) {
            setComments(cloud.comments);
            try {
              localStorage.setItem('thoughts_sketchbook_comments_v1', JSON.stringify(cloud.comments));
            } catch {}
          }

          if (cloud.likes) {
            setLikesData(cloud.likes);
            try {
              localStorage.setItem('thoughts_sketchbook_likes_v1', JSON.stringify(cloud.likes));
            } catch {}
          }
        }
      }
    } catch (err) {
      console.warn('[Sync] Error synchronizing remote data:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // Fetch shared state on page load and poll on window focus / periodic timer
  useEffect(() => {
    syncFromRemote();

    const handleFocus = () => {
      syncFromRemote();
    };

    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      syncFromRemote();
    }, 25000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [syncFromRemote]);

  // Sync theme with HTML root class
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('sketchbook_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('sketchbook_theme', 'light');
      }
    } catch {}
  }, [isDark]);

  // Sync entries to local storage
  useEffect(() => {
    try {
      localStorage.setItem('thoughts_sketchbook_entries_v4', JSON.stringify(entries));
    } catch {}
  }, [entries]);

  // Sync real-only likes to local storage
  useEffect(() => {
    try {
      localStorage.setItem('thoughts_sketchbook_likes_v1', JSON.stringify(likesData));
    } catch {}
  }, [likesData]);

  // Sync anonymous comments to local storage
  useEffect(() => {
    try {
      localStorage.setItem('thoughts_sketchbook_comments_v1', JSON.stringify(comments));
    } catch {}
  }, [comments]);

  // Real 1-Like-Per-User Enforcement with server-side RPC support
  const handleToggleLike = async (entryId) => {
    if (!voterId) return;

    // 1. Optimistic local update
    setLikesData((prev) => {
      const currentList = Array.isArray(prev[entryId]) 
        ? prev[entryId] 
        : (prev[entryId]?.likedBy || []);
      const hasLiked = currentList.includes(voterId);
      const nextList = hasLiked
        ? currentList.filter((id) => id !== voterId)
        : Array.from(new Set([...currentList, voterId]));

      return {
        ...prev,
        [entryId]: nextList
      };
    });

    // 2. Persist to Supabase RPC (or fallback cloud DB)
    if (isSupabaseConfigured) {
      await toggleLikeInSupabase(entryId, voterId);
    } else {
      await mutateCloudData((current) => {
        const likesMap = current.likes || {};
        const currentList = Array.isArray(likesMap[entryId])
          ? likesMap[entryId]
          : (likesMap[entryId]?.likedBy || []);
        const hasLiked = currentList.includes(voterId);
        const nextList = hasLiked
          ? currentList.filter((id) => id !== voterId)
          : Array.from(new Set([...currentList, voterId]));

        return {
          ...current,
          likes: {
            ...likesMap,
            [entryId]: nextList
          }
        };
      });
    }
  };

  // Hidden Owner Unlock Trigger (Ctrl+Shift+D / Cmd+Shift+D OR ?owner=true)
  useEffect(() => {
    const handleUnlockPrompt = async () => {
      if (checkOwnerUnlocked()) {
        const lock = window.confirm('Owner mode is currently active. Would you like to lock it?');
        if (lock) {
          sessionStorage.removeItem('tf_owner_unlocked');
          localStorage.removeItem('tf_owner_unlocked');
          setIsOwner(false);
          window.alert('Owner mode locked.');
        }
        return;
      }

      const input = window.prompt('Enter owner passkey:');
      if (!input) return;

      try {
        const valid = await verifyOwnerPasskey(input);
        if (valid) {
          sessionStorage.setItem('tf_owner_unlocked', 'true');
          localStorage.setItem('tf_owner_unlocked', 'true');
          setIsOwner(true);
          window.alert('Owner mode verified & unlocked.');
        } else {
          window.alert('Invalid passkey.');
        }
      } catch (err) {
        console.error('Owner authentication error:', err);
      }
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        handleUnlockPrompt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // URL trigger: ?owner=true
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('owner') === 'true') {
        handleUnlockPrompt();
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch {}

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Hidden Owner-Only deletion for thoughts/feelings/quotes:
  // Immediately removes from DOM and persists globally across cloud DB & localStorage
  const handleDeleteEntry = async (entryId) => {
    if (!checkOwnerUnlocked()) {
      const input = window.prompt('Enter owner passkey:');
      if (!input) return;
      const valid = await verifyOwnerPasskey(input);
      if (!valid) {
        window.alert('Invalid passkey.');
        return;
      }
      sessionStorage.setItem('tf_owner_unlocked', 'true');
      localStorage.setItem('tf_owner_unlocked', 'true');
      setIsOwner(true);
    }

    // 1. Immediately remove from DOM / local state
    setEntries((prev) => prev.filter((item) => item.id !== entryId));

    // 2. Persist deleted ID and updated entries to localStorage so it stays permanently deleted on reload
    try {
      const existingDel = JSON.parse(localStorage.getItem('thoughts_sketchbook_deleted_ids') || '[]');
      const nextDel = Array.from(new Set([...existingDel, entryId]));
      localStorage.setItem('thoughts_sketchbook_deleted_ids', JSON.stringify(nextDel));

      const existingEntries = JSON.parse(localStorage.getItem('thoughts_sketchbook_entries_v4') || '[]');
      const nextEntries = existingEntries.filter((item) => item.id !== entryId);
      localStorage.setItem('thoughts_sketchbook_entries_v4', JSON.stringify(nextEntries));
    } catch {}

    // Clean up associated comments and likes
    setComments((prev) => {
      const next = { ...prev };
      delete next[entryId];
      try { localStorage.setItem('thoughts_sketchbook_comments_v1', JSON.stringify(next)); } catch {}
      return next;
    });

    setLikesData((prev) => {
      const next = { ...prev };
      delete next[entryId];
      try { localStorage.setItem('thoughts_sketchbook_likes_v1', JSON.stringify(next)); } catch {}
      return next;
    });

    // 3. Persist deletion in shared cloud database (SHARED_DB_URL)
    await mutateCloudData((current) => {
      const thoughts = (current.thoughts || []).filter((item) => item.id !== entryId);
      const deletedIds = Array.from(new Set([...(current.deletedIds || []), entryId]));
      const nextComments = { ...(current.comments || {}) };
      delete nextComments[entryId];
      const nextLikes = { ...(current.likes || {}) };
      delete nextLikes[entryId];

      return {
        ...current,
        thoughts,
        deletedIds,
        comments: nextComments,
        likes: nextLikes
      };
    });

    // 4. If Supabase is configured, delete from database as well
    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('thoughts').delete().eq('id', entryId),
          supabase.from('comments').delete().eq('thought_id', entryId),
          supabase.from('likes').delete().eq('thought_id', entryId)
        ]);
      } catch (err) {
        console.warn('[Supabase] Error deleting thought from table:', err);
      }
    }
  };

  // Fetch fresh comments from remote whenever a user opens a comment dropdown
  const handleOpenComments = useCallback(async (entryId) => {
    try {
      if (isSupabaseConfigured) {
        const [allComments, thoughtComments] = await Promise.all([
          fetchCommentsFromSupabase(),
          fetchCommentsForThoughtFromSupabase(entryId)
        ]);

        if (allComments) {
          setComments(allComments);
          try {
            localStorage.setItem('thoughts_sketchbook_comments_v1', JSON.stringify(allComments));
          } catch {}
        } else if (thoughtComments) {
          setComments((prev) => {
            const next = {
              ...prev,
              [entryId]: thoughtComments
            };
            try {
              localStorage.setItem('thoughts_sketchbook_comments_v1', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      } else {
        const cloud = await fetchCloudData();
        if (cloud && cloud.comments) {
          setComments(cloud.comments);
          try {
            localStorage.setItem('thoughts_sketchbook_comments_v1', JSON.stringify(cloud.comments));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[Sync] Error refreshing comments on open:', err);
    }
  }, []);

  // Add anonymous comment to an entry:
  // Persisted immediately to Supabase (or fallback cloud DB)
  const handleAddComment = async (entryId, text) => {
    if (!text.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      timestamp: timeStr,
      createdAt: Date.now()
    };

    // 1. Optimistic local update
    setComments((prev) => {
      const updated = {
        ...prev,
        [entryId]: [...(prev[entryId] || []), newComment]
      };
      try {
        localStorage.setItem('thoughts_sketchbook_comments_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Persist to Supabase (or fallback cloud DB)
    if (isSupabaseConfigured) {
      const inserted = await insertCommentToSupabase(entryId, text.trim());
      if (inserted) {
        // Fetch fresh comments from Supabase to sync across all visitors
        const freshComments = await fetchCommentsFromSupabase();
        if (freshComments) {
          setComments(freshComments);
          try {
            localStorage.setItem('thoughts_sketchbook_comments_v1', JSON.stringify(freshComments));
          } catch {}
        }
      }
    } else {
      await mutateCloudData((current) => {
        const commentsMap = current.comments || {};
        const existingList = commentsMap[entryId] || [];
        return {
          ...current,
          comments: {
            ...commentsMap,
            [entryId]: [...existingList, newComment]
          }
        };
      });
    }
  };

  // Hidden Owner-Only deletion for an individual anonymous comment:
  // Immediately removes from DOM and persists globally across cloud DB & localStorage
  const handleDeleteComment = async (entryId, commentId) => {
    if (!checkOwnerUnlocked()) {
      const input = window.prompt('Enter owner passkey:');
      if (!input) return;
      const valid = await verifyOwnerPasskey(input);
      if (!valid) {
        window.alert('Invalid passkey.');
        return;
      }
      sessionStorage.setItem('tf_owner_unlocked', 'true');
      localStorage.setItem('tf_owner_unlocked', 'true');
      setIsOwner(true);
    }

    // 1. Immediately remove from DOM / local state
    setComments((prev) => {
      const next = {
        ...prev,
        [entryId]: (prev[entryId] || []).filter((c) => c.id !== commentId)
      };
      try {
        localStorage.setItem('thoughts_sketchbook_comments_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Persist deletion in shared cloud database (SHARED_DB_URL)
    await mutateCloudData((current) => {
      const commentsMap = current.comments || {};
      const updatedList = (commentsMap[entryId] || []).filter((c) => c.id !== commentId);
      return {
        ...current,
        comments: {
          ...commentsMap,
          [entryId]: updatedList
        }
      };
    });

    // 3. If Supabase is configured, delete from comments table as well
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('comments').delete().eq('id', commentId);
      } catch (err) {
        console.warn('[Supabase] Comment deletion error:', err);
      }
    }
  };

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Submit new thought or feeling:
  // Prepend to top immediately and persist via Supabase insert (or fallback cloud DB)
  const handleSaveEntry = async (newEntry) => {
    // 1. Optimistic local update
    setEntries((prev) => [newEntry, ...prev]);

    // 2. Persist to Supabase (or fallback cloud DB)
    if (isSupabaseConfigured) {
      const inserted = await insertThoughtToSupabase(newEntry);
      if (inserted) {
        setEntries((prev) =>
          prev.map((item) => (item.id === newEntry.id ? inserted : item))
        );
      }
    } else {
      await mutateCloudData((current) => {
        const thoughts = current.thoughts || [];
        const existingIndex = thoughts.findIndex((t) => t.id === newEntry.id);
        const nextThoughts = existingIndex >= 0
          ? thoughts.map((t, idx) => (idx === existingIndex ? newEntry : t))
          : [newEntry, ...thoughts];

        return {
          ...current,
          thoughts: nextThoughts
        };
      });
    }
  };

  const handleScrollToLedger = () => {
    const el = document.getElementById('digital-ledger');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <SmoothScrollProvider>
      <div className="relative min-h-screen bg-paper dark:bg-darkPaper text-ink dark:text-darkInk transition-colors duration-200 selection:bg-ink selection:text-paper dark:selection:bg-darkInk dark:selection:text-darkPaper flex flex-col justify-between">
        
        {/* Main Sketchbook Body */}
        <main className="w-full flex-grow">
          {/* Graciano & Dribbble Inspired Hand-Drawn Hero */}
          <HandDrawnHero
            isDark={isDark}
            onToggleTheme={handleToggleTheme}
            onOpenNewEntryModal={() => setIsModalOpen(true)}
            onScrollToLedger={handleScrollToLedger}
          />

          {/* Continuous Editorial Journal Stream */}
          <DigitalBookLayout
            entries={entries}
            onOpenNewEntryModal={() => setIsModalOpen(true)}
            isOwner={isOwner}
            onDeleteEntry={handleDeleteEntry}
            comments={comments}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            likesData={likesData}
            voterId={voterId}
            onToggleLike={handleToggleLike}
            onOpenComments={handleOpenComments}
          />

          {/* Hand-Drawn Scroll Back To Top */}
          <RetroStatusBar />
        </main>

        {/* Minimal Editorial Footer */}
        <footer className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 border-t border-ink/20 dark:border-darkInk/20 font-handwritten text-base sm:text-lg text-center text-ink/70 dark:text-darkInk/70">
          <p className="flex flex-wrap items-center justify-center gap-2">
            <span>thoughts 'n' feelings</span>
            <span className="opacity-40">&bull;</span>
            <span>an ink and paper sketchbook by</span>
            <a
              href="https://www.instagram.com/absurdnigga"
              target="_blank"
              rel="noreferrer"
              className="scribble-hover font-editorial italic underline decoration-1 underline-offset-4 text-ink dark:text-darkInk font-bold"
            >
              absurdharsh
            </a>
          </p>
          <p className="mt-2 text-sm opacity-50">
            pure binary ink on paper &bull; zero noise &bull; crafted with organic linework
          </p>
        </footer>

        {/* Hand-Drawn Thought Inscription Modal */}
        <HandDrawnThoughtModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaveEntry={handleSaveEntry}
        />
      </div>
    </SmoothScrollProvider>
  );
}
