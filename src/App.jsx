import React, { useState, useEffect, useCallback, useRef } from 'react';
import SmoothScrollProvider from './components/SmoothScrollProvider';
import HandDrawnHero from './components/HandDrawnHero';
import DigitalBookLayout from './components/DigitalBookLayout';
import RetroStatusBar from './components/RetroStatusBar';
import HandDrawnThoughtModal from './components/HandDrawnThoughtModal';
import { INITIAL_ENTRIES } from './data/initialThoughts';
import { getPersistentVoterId } from './utils/voterId';
import {
  SHARED_DB_URL,
  fetchCloudData,
  mutateCloudData
} from './services/cloudDb';

// Default owner passkey hash: SHA-256 of 'absurdharsh'
const DEFAULT_OWNER_HASH = 'f1c094b28bf9330bee6b8191938df3d4234145b833526942740f7408821f880c';

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to verify owner authentication against sessionStorage and fallback
function checkOwnerAuth() {
  try {
    const session = 
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sketchbook_owner_session')) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('sketchbook_owner_session'));
    const target = 
      (typeof localStorage !== 'undefined' && localStorage.getItem('sketchbook_owner_hash')) || 
      DEFAULT_OWNER_HASH;
    return Boolean(session && session === target);
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
  const deletedSet = new Set(deletedIds || []);
  const map = new Map();

  // 1. Add cloud thoughts first
  (cloudThoughts || []).forEach((item) => {
    if (item && item.id && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  });

  // 2. Add INITIAL_ENTRIES that have not been deleted and not overridden
  INITIAL_ENTRIES.forEach((init) => {
    if (!deletedSet.has(init.id) && !map.has(init.id)) {
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

  // Entries: initialized from localStorage cache, then synced from cloud DB
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('thoughts_sketchbook_entries_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sortEntriesDescending(parsed);
        }
      }
    } catch {}
    return sortEntriesDescending(INITIAL_ENTRIES);
  });

  // Persistent anonymous voter ID (stored in localStorage under 'tf_voter_id')
  const [voterId, setVoterId] = useState('');

  useEffect(() => {
    getPersistentVoterId().then((id) => setVoterId(id));
  }, []);

  // Real-Only Likes store: keyed by entry.id -> array of unique voter IDs [voterId1, voterId2, ...]
  // Every thought starts with 0 real likes unless explicitly liked by a user
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
  const [isOwner, setIsOwner] = useState(checkOwnerAuth);

  const isSyncingRef = useRef(false);

  // Synchronize state from the live cloud database
  const syncFromCloud = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const cloud = await fetchCloudData();
      if (cloud) {
        // 1. Merge cloud thoughts with initial entries & owner deletions
        const merged = mergeEntries(cloud.thoughts, cloud.deletedIds);
        setEntries(merged);
        try {
          localStorage.setItem('thoughts_sketchbook_entries_v4', JSON.stringify(merged));
        } catch {}

        // 2. Sync comments
        if (cloud.comments) {
          setComments(cloud.comments);
          try {
            localStorage.setItem('thoughts_sketchbook_comments_v1', JSON.stringify(cloud.comments));
          } catch {}
        }

        // 3. Sync likes (array of voter IDs per thought)
        if (cloud.likes) {
          setLikesData(cloud.likes);
          try {
            localStorage.setItem('thoughts_sketchbook_likes_v1', JSON.stringify(cloud.likes));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[CloudSync] Error syncing from cloud:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // Fetch shared state on page load and poll on window focus / periodic timer
  useEffect(() => {
    // Initial fetch on mount
    syncFromCloud();

    // Poll on window focus
    const handleFocus = () => {
      syncFromCloud();
    };

    window.addEventListener('focus', handleFocus);

    // Periodic background sync every 25 seconds
    const interval = setInterval(() => {
      syncFromCloud();
    }, 25000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [syncFromCloud]);

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

  // Real 1-Like-Per-User Enforcement with live cloud persistence:
  // db.likes[thoughtId] = [voterId1, voterId2, ...]
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

    // 2. Persist to shared cloud database
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
  };

  // Hidden Owner Unlock Trigger (Ctrl+Shift+D / Cmd+Shift+D OR ?owner=true)
  useEffect(() => {
    const handleUnlockPrompt = async () => {
      const target = localStorage.getItem('sketchbook_owner_hash') || DEFAULT_OWNER_HASH;
      const currentSession = 
        sessionStorage.getItem('sketchbook_owner_session') || 
        localStorage.getItem('sketchbook_owner_session');

      if (currentSession === target) {
        const lock = window.confirm('Owner mode is currently active. Would you like to lock it?');
        if (lock) {
          sessionStorage.removeItem('sketchbook_owner_session');
          localStorage.removeItem('sketchbook_owner_session');
          setIsOwner(false);
          window.alert('Owner mode locked.');
        }
        return;
      }

      const input = window.prompt('Enter owner passkey:');
      if (!input) return;

      try {
        const hash = await sha256(input.trim());
        if (hash === target) {
          sessionStorage.setItem('sketchbook_owner_session', hash);
          localStorage.setItem('sketchbook_owner_session', hash);
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
  // Persisted immediately via PUT SHARED_DB_URL
  const handleDeleteEntry = async (entryId) => {
    if (!checkOwnerAuth()) {
      window.alert('Unauthorized: Owner session required.');
      return;
    }

    // 1. Optimistic local update
    setEntries((prev) => prev.filter((item) => item.id !== entryId));

    // 2. Persist deletion in shared cloud database
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
  };

  // Add anonymous comment to an entry:
  // Persisted immediately via PUT SHARED_DB_URL
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
    setComments((prev) => ({
      ...prev,
      [entryId]: [...(prev[entryId] || []), newComment]
    }));

    // 2. Persist to shared cloud database
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
  };

  // Hidden Owner-Only deletion for an individual anonymous comment:
  // Persisted immediately via PUT SHARED_DB_URL
  const handleDeleteComment = async (entryId, commentId) => {
    if (!checkOwnerAuth()) {
      window.alert('Unauthorized: Owner session required.');
      return;
    }

    // 1. Optimistic local update
    setComments((prev) => ({
      ...prev,
      [entryId]: (prev[entryId] || []).filter((c) => c.id !== commentId)
    }));

    // 2. Persist to shared cloud database
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
  };

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Submit new thought or feeling:
  // Prepend to top immediately and persist via PUT SHARED_DB_URL
  const handleSaveEntry = async (newEntry) => {
    // 1. Optimistic local update
    setEntries((prev) => [newEntry, ...prev]);

    // 2. Persist to shared cloud database
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
