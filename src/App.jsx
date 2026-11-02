import React, { useState, useEffect, useCallback, useRef } from 'react';
import SmoothScrollProvider from './components/SmoothScrollProvider';
import HandDrawnHero from './components/HandDrawnHero';
import DigitalBookLayout from './components/DigitalBookLayout';
import RetroStatusBar from './components/RetroStatusBar';
import HandDrawnThoughtModal from './components/HandDrawnThoughtModal';
import { INITIAL_ENTRIES } from './data/initialThoughts';
import { getPersistentVoterId } from './utils/voterId';
import {
  getLocalState,
  syncWithCloud,
  fetchCloudState,
  mergeEntries
} from './db';
import {
  isSupabaseConfigured,
  supabase,
  fetchThoughtsFromSupabase,
  insertThoughtToSupabase,
  fetchCommentsFromSupabase,
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

// Check if owner mode is unlocked in sessionStorage or localStorage
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

export default function App() {
  // Binary Theme: Light mode (Paper #FFFFFF, Ink #000000) by default
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('sketchbook_theme') === 'dark';
    } catch {
      return false;
    }
  });

  // Persistent anonymous voter ID (stored in localStorage under 'tf_voter_id')
  const [voterId, setVoterId] = useState(() => {
    try {
      return localStorage.getItem('tf_voter_id') || '';
    } catch {
      return '';
    }
  });

  // Unified persistent database state: thoughts, comments, likes, deletedIds
  const [dbState, setDbState] = useState(() => getLocalState());

  // Combined entries (INITIAL_ENTRIES + dynamic cloud thoughts, filtered by deletedIds)
  const [entries, setEntries] = useState(() =>
    mergeEntries(INITIAL_ENTRIES, dbState.thoughts, dbState.deletedIds)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Secret Owner Session (verified via SHA-256 and stored in sessionStorage)
  const [isOwner, setIsOwner] = useState(checkOwnerUnlocked);

  const isSyncingRef = useRef(false);

  // Fetch initial voter identity
  useEffect(() => {
    getPersistentVoterId().then((id) => {
      if (id) setVoterId(id);
    });
  }, []);

  // Synchronize state from remote cloud endpoint
  const syncFromRemote = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const freshCloud = await fetchCloudState();
      if (freshCloud) {
        setDbState(freshCloud);
        setEntries(mergeEntries(INITIAL_ENTRIES, freshCloud.thoughts, freshCloud.deletedIds));
      }

      // If Supabase is configured, sync in parallel
      if (isSupabaseConfigured) {
        const [sbThoughts, sbComments, sbLikes] = await Promise.all([
          fetchThoughtsFromSupabase(),
          fetchCommentsFromSupabase(),
          fetchLikesFromSupabase()
        ]);

        if (sbThoughts || sbComments || sbLikes) {
          setDbState((prev) => {
            const nextThoughts = sbThoughts
              ? [...prev.thoughts, ...sbThoughts.filter(st => !prev.thoughts.some(pt => String(pt.id) === String(st.id)))]
              : prev.thoughts;
            const nextComments = sbComments ? { ...prev.comments, ...sbComments } : prev.comments;
            const nextLikes = sbLikes ? { ...prev.likes, ...sbLikes } : prev.likes;
            const next = { ...prev, thoughts: nextThoughts, comments: nextComments, likes: nextLikes };
            setEntries(mergeEntries(INITIAL_ENTRIES, next.thoughts, next.deletedIds));
            return next;
          });
        }
      }
    } catch (err) {
      console.warn('[Sync] Error syncing remote state:', err);
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
      }
    } catch {}
  }, [isDark]);

  // Real 1-Like-Per-User Enforcement with atomic sync
  const handleToggleLike = async (entryId) => {
    const targetId = String(entryId);
    let curVoterId = voterId;
    if (!curVoterId) {
      curVoterId = await getPersistentVoterId();
      if (curVoterId) setVoterId(curVoterId);
    }
    if (!curVoterId) return;

    // 1. Optimistic local update
    setDbState((prev) => {
      const currentList = Array.isArray(prev.likes[targetId]) ? prev.likes[targetId] : [];
      const hasLiked = currentList.includes(curVoterId);
      const nextList = hasLiked
        ? currentList.filter((id) => id !== curVoterId)
        : Array.from(new Set([...currentList, curVoterId]));

      return {
        ...prev,
        likes: {
          ...prev.likes,
          [targetId]: nextList
        }
      };
    });

    // 2. Persist to shared cloud database
    const updated = await syncWithCloud((current) => {
      const likesMap = current.likes || {};
      const currentList = Array.isArray(likesMap[targetId]) ? likesMap[targetId] : [];
      const hasLiked = currentList.includes(curVoterId);
      const nextList = hasLiked
        ? currentList.filter((id) => id !== curVoterId)
        : Array.from(new Set([...currentList, curVoterId]));

      return {
        ...current,
        likes: {
          ...likesMap,
          [targetId]: nextList
        }
      };
    });

    if (updated) {
      setDbState(updated);
    }

    if (isSupabaseConfigured) {
      toggleLikeInSupabase(targetId, curVoterId).catch(() => {});
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
    const targetId = String(entryId);

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
    setEntries((prev) => prev.filter((item) => String(item.id) !== targetId));

    setDbState((prev) => {
      const thoughts = prev.thoughts.filter((item) => String(item.id) !== targetId);
      const deletedIds = Array.from(new Set([...prev.deletedIds, targetId]));
      const nextComments = { ...prev.comments };
      delete nextComments[targetId];
      const nextLikes = { ...prev.likes };
      delete nextLikes[targetId];

      return {
        ...prev,
        thoughts,
        deletedIds,
        comments: nextComments,
        likes: nextLikes
      };
    });

    // 2. Persist deletion in shared cloud database
    const updated = await syncWithCloud((current) => {
      const thoughts = (current.thoughts || []).filter((item) => String(item.id) !== targetId);
      const deletedIds = Array.from(new Set([...(current.deletedIds || []), targetId]));
      const nextComments = { ...(current.comments || {}) };
      delete nextComments[targetId];
      const nextLikes = { ...(current.likes || {}) };
      delete nextLikes[targetId];

      return {
        ...current,
        thoughts,
        deletedIds,
        comments: nextComments,
        likes: nextLikes
      };
    });

    if (updated) {
      setDbState(updated);
      setEntries(mergeEntries(INITIAL_ENTRIES, updated.thoughts, updated.deletedIds));
    }

    // 3. If Supabase is configured, delete from database as well
    if (isSupabaseConfigured && supabase) {
      Promise.all([
        supabase.from('thoughts').delete().eq('id', targetId),
        supabase.from('comments').delete().eq('thought_id', targetId),
        supabase.from('likes').delete().eq('thought_id', targetId)
      ]).catch((err) => {
        console.warn('[Supabase] Error deleting thought from table:', err);
      });
    }
  };

  // Fetch fresh comments from remote whenever a user opens a comment dropdown
  const handleOpenComments = useCallback(async () => {
    try {
      const freshCloud = await fetchCloudState();
      if (freshCloud) {
        setDbState(freshCloud);
        setEntries(mergeEntries(INITIAL_ENTRIES, freshCloud.thoughts, freshCloud.deletedIds));
      }
    } catch (err) {
      console.warn('[Comments] Error refreshing comments on open:', err);
    }
  }, []);

  // Add anonymous comment to an entry:
  // Persisted immediately to cloud database & local storage
  const handleAddComment = async (entryId, text) => {
    if (!text || !text.trim()) return;
    const targetId = String(entryId);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newComment = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      timestamp: timeStr,
      createdAt: Date.now()
    };

    // 1. Optimistic local update
    setDbState((prev) => {
      const commentsMap = prev.comments || {};
      const updatedList = [...(commentsMap[targetId] || []), newComment];
      return {
        ...prev,
        comments: {
          ...commentsMap,
          [targetId]: updatedList
        }
      };
    });

    // 2. Persist atomically to shared cloud store
    const updated = await syncWithCloud((current) => {
      const commentsMap = current.comments || {};
      const existingList = commentsMap[targetId] || [];
      return {
        ...current,
        comments: {
          ...commentsMap,
          [targetId]: [...existingList, newComment]
        }
      };
    });

    if (updated) {
      setDbState(updated);
    }

    if (isSupabaseConfigured) {
      insertCommentToSupabase(targetId, text.trim()).catch(() => {});
    }
  };

  // Hidden Owner-Only deletion for an individual anonymous comment:
  // Immediately removes from DOM and persists globally across cloud DB & localStorage
  const handleDeleteComment = async (entryId, commentId) => {
    const targetEntryId = String(entryId);
    const targetCommentId = String(commentId);

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
    setDbState((prev) => {
      const commentsMap = prev.comments || {};
      const updatedList = (commentsMap[targetEntryId] || []).filter((c) => String(c.id) !== targetCommentId);
      return {
        ...prev,
        comments: {
          ...commentsMap,
          [targetEntryId]: updatedList
        }
      };
    });

    // 2. Persist deletion in shared cloud database
    const updated = await syncWithCloud((current) => {
      const commentsMap = current.comments || {};
      const updatedList = (commentsMap[targetEntryId] || []).filter((c) => String(c.id) !== targetCommentId);
      return {
        ...current,
        comments: {
          ...commentsMap,
          [targetEntryId]: updatedList
        }
      };
    });

    if (updated) {
      setDbState(updated);
    }

    // 3. If Supabase is configured, delete from comments table as well
    if (isSupabaseConfigured && supabase) {
      supabase.from('comments').delete().eq('id', targetCommentId).catch((err) => {
        console.warn('[Supabase] Comment deletion error:', err);
      });
    }
  };

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Submit new thought or feeling:
  // Prepend to top immediately and persist via cloud store
  const handleSaveEntry = async (newEntry) => {
    const thoughtId = String(newEntry.id || `thought_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    const formatted = {
      ...newEntry,
      id: thoughtId,
      number: newEntry.number || '00',
      type: newEntry.type || newEntry.category || 'thought',
      category: newEntry.category || newEntry.type || 'thought',
      title: String(newEntry.title || ''),
      author: String(newEntry.author || 'absurdharsh'),
      date: newEntry.date || 'Just Now',
      createdAt: typeof newEntry.createdAt === 'number' ? newEntry.createdAt : Date.now(),
      doodle: newEntry.doodle || (newEntry.category === 'feeling' ? 'eye' : newEntry.category === 'quote' ? 'spark' : 'star'),
      content: String(newEntry.content || '')
    };

    // 1. Optimistic local update (prepended to top)
    setEntries((prev) => [formatted, ...prev.filter((t) => String(t.id) !== thoughtId)]);
    setDbState((prev) => ({
      ...prev,
      thoughts: [formatted, ...prev.thoughts.filter((t) => String(t.id) !== thoughtId)]
    }));

    // 2. Persist to shared cloud database
    const updated = await syncWithCloud((current) => {
      const thoughts = current.thoughts || [];
      const filtered = thoughts.filter((t) => String(t.id) !== thoughtId);
      return {
        ...current,
        thoughts: [formatted, ...filtered]
      };
    });

    if (updated) {
      setDbState(updated);
      setEntries(mergeEntries(INITIAL_ENTRIES, updated.thoughts, updated.deletedIds));
    }

    if (isSupabaseConfigured) {
      insertThoughtToSupabase(formatted).catch(() => {});
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
            comments={dbState.comments}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            likesData={dbState.likes}
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
