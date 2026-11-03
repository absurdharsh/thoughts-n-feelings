import React, { useState, useEffect, useCallback, useRef } from 'react';
import SmoothScrollProvider from './components/SmoothScrollProvider';
import ScribblePreloader from './components/ScribblePreloader';
import HandDrawnHero from './components/HandDrawnHero';
import DigitalBookLayout from './components/DigitalBookLayout';
import RetroStatusBar from './components/RetroStatusBar';
import HandDrawnThoughtModal from './components/HandDrawnThoughtModal';
import { INITIAL_ENTRIES } from './data/initialThoughts';
import { getPersistentVoterId } from './utils/voterId';
import {
  getLocalState,
  saveLocalState,
  fetchStore,
  addThoughtApi,
  addCommentApi,
  toggleLikeApi,
  verifyOwnerApi,
  ownerDeleteApi,
  mergeEntries
} from './db';

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

// Retrieve stored owner passkey for server-side verification
function getStoredOwnerPasskey() {
  try {
    return (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('tf_owner_passkey')) || '';
  } catch {
    return '';
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
  const [showPreloader, setShowPreloader] = useState(true);

  // Secret Owner Session (verified on the server via /api/store)
  const [isOwner, setIsOwner] = useState(checkOwnerUnlocked);

  const isSyncingRef = useRef(false);

  // Fetch initial voter identity
  useEffect(() => {
    getPersistentVoterId().then((id) => {
      if (id) setVoterId(id);
    });
  }, []);

  // Synchronize state from /api/store
  const syncFromRemote = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const fresh = await fetchStore();
      if (fresh && fresh.persistent !== false) {
        setDbState(fresh);
        setEntries(mergeEntries(INITIAL_ENTRIES, fresh.thoughts, fresh.deletedIds));
      }
    } catch (err) {
      console.warn('[Sync] Error syncing /api/store:', err);
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

  // Real 1-Like-Per-User Enforcement with server persistence
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

      const next = {
        ...prev,
        likes: {
          ...prev.likes,
          [targetId]: nextList
        }
      };
      saveLocalState(next);
      return next;
    });

    // 2. Persist to /api/store
    const updated = await toggleLikeApi(targetId, curVoterId);
    if (updated && updated.persistent !== false) {
      setDbState(updated);
    }
  };

  // Hidden Owner Unlock Trigger (Ctrl+Shift+D / Cmd+Shift+D OR ?owner=true)
  useEffect(() => {
    const handleUnlockPrompt = async () => {
      if (checkOwnerUnlocked()) {
        const lock = window.confirm('Owner mode is currently active. Would you like to lock it?');
        if (lock) {
          sessionStorage.removeItem('tf_owner_passkey');
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
        const valid = await verifyOwnerApi(input);
        if (valid) {
          sessionStorage.setItem('tf_owner_passkey', input.trim());
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
  // Immediately removes from DOM and persists globally to /api/store
  const handleDeleteEntry = async (entryId) => {
    const targetId = String(entryId);
    let passkey = getStoredOwnerPasskey();

    if (!checkOwnerUnlocked() || !passkey) {
      const input = window.prompt('Enter owner passkey:');
      if (!input) return;
      const valid = await verifyOwnerApi(input);
      if (!valid) {
        window.alert('Invalid passkey.');
        return;
      }
      passkey = input.trim();
      sessionStorage.setItem('tf_owner_passkey', passkey);
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

      const next = {
        ...prev,
        thoughts,
        deletedIds,
        comments: nextComments,
        likes: nextLikes
      };
      saveLocalState(next);
      return next;
    });

    // 2. Persist deletion in /api/store
    const updated = await ownerDeleteApi({ thoughtId: targetId, passkey });
    if (updated && updated.persistent !== false) {
      setDbState(updated);
      setEntries(mergeEntries(INITIAL_ENTRIES, updated.thoughts, updated.deletedIds));
    }
  };

  // Fetch fresh comments from remote whenever a user opens a comment dropdown
  const handleOpenComments = useCallback(async () => {
    try {
      const fresh = await fetchStore();
      if (fresh && fresh.persistent !== false) {
        setDbState(fresh);
        setEntries(mergeEntries(INITIAL_ENTRIES, fresh.thoughts, fresh.deletedIds));
      }
    } catch (err) {
      console.warn('[Comments] Error refreshing comments on open:', err);
    }
  }, []);

  // Add anonymous comment to an entry:
  // Persisted immediately to /api/store & local cache
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
      const next = {
        ...prev,
        comments: {
          ...commentsMap,
          [targetId]: updatedList
        }
      };
      saveLocalState(next);
      return next;
    });

    // 2. Persist to /api/store
    const updated = await addCommentApi(targetId, text.trim());
    if (updated && updated.persistent !== false) {
      setDbState(updated);
    }
  };

  // Hidden Owner-Only deletion for an individual anonymous comment:
  // Immediately removes from DOM and persists globally to /api/store
  const handleDeleteComment = async (entryId, commentId) => {
    const targetEntryId = String(entryId);
    const targetCommentId = String(commentId);
    let passkey = getStoredOwnerPasskey();

    if (!checkOwnerUnlocked() || !passkey) {
      const input = window.prompt('Enter owner passkey:');
      if (!input) return;
      const valid = await verifyOwnerApi(input);
      if (!valid) {
        window.alert('Invalid passkey.');
        return;
      }
      passkey = input.trim();
      sessionStorage.setItem('tf_owner_passkey', passkey);
      sessionStorage.setItem('tf_owner_unlocked', 'true');
      localStorage.setItem('tf_owner_unlocked', 'true');
      setIsOwner(true);
    }

    // 1. Immediately remove from DOM / local state
    setDbState((prev) => {
      const commentsMap = prev.comments || {};
      const updatedList = (commentsMap[targetEntryId] || []).filter((c) => String(c.id) !== targetCommentId);
      const next = {
        ...prev,
        comments: {
          ...commentsMap,
          [targetEntryId]: updatedList
        }
      };
      saveLocalState(next);
      return next;
    });

    // 2. Persist deletion in /api/store
    const updated = await ownerDeleteApi({
      thoughtId: targetEntryId,
      commentId: targetCommentId,
      passkey
    });
    if (updated && updated.persistent !== false) {
      setDbState(updated);
    }
  };

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Submit new thought or feeling:
  // Prepend to top immediately and persist via /api/store
  const handleSaveEntry = async (newEntry) => {
    const thoughtId = String(newEntry.id || `thought_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    const nextNumber = String(entries.length + 1).padStart(2, '0');
    const formatted = {
      ...newEntry,
      id: thoughtId,
      number: newEntry.number || nextNumber,
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
    setDbState((prev) => {
      const next = {
        ...prev,
        thoughts: [formatted, ...prev.thoughts.filter((t) => String(t.id) !== thoughtId)]
      };
      saveLocalState(next);
      return next;
    });

    // 2. Persist to /api/store
    const updated = await addThoughtApi(formatted);
    if (updated && updated.persistent !== false) {
      setDbState(updated);
      setEntries(mergeEntries(INITIAL_ENTRIES, updated.thoughts, updated.deletedIds));
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
      {/* Scribble Drawing Preloader (Draws "Two in Embrace" and Curtain-Wipes) */}
      {showPreloader && (
        <ScribblePreloader
          isDark={isDark}
          onComplete={() => setShowPreloader(false)}
        />
      )}

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
