import React, { useState, useEffect } from 'react';
import SmoothScrollProvider from './components/SmoothScrollProvider';
import HandDrawnHero from './components/HandDrawnHero';
import DigitalBookLayout from './components/DigitalBookLayout';
import RetroStatusBar from './components/RetroStatusBar';
import HandDrawnThoughtModal from './components/HandDrawnThoughtModal';
import { INITIAL_ENTRIES } from './data/initialThoughts';
import { getPersistentVoterId } from './utils/voterId';

// Default owner passkey hash: SHA-256 of 'absurdharsh'
const DEFAULT_OWNER_HASH = 'f1c094b28bf9330bee6b8191938df3d4234145b833526942740f7408821f880c';

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Sort helper: Most recent entries first (descending by createdAt / timestamp / ID)
function sortEntriesDescending(list) {
  return [...list].sort((a, b) => {
    const timeA = a.createdAt || (a.id && a.id.startsWith('entry-') ? parseInt(a.id.replace('entry-', ''), 10) || 0 : 0);
    const timeB = b.createdAt || (b.id && b.id.startsWith('entry-') ? parseInt(b.id.replace('entry-', ''), 10) || 0 : 0);
    return timeB - timeA;
  });
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

  // Entries: sorted so most recent entry appears at the very top
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

  // Persistent anonymous voter ID (UUID + browser fingerprint across localStorage + Cookies + IndexedDB)
  const [voterId, setVoterId] = useState('');

  useEffect(() => {
    getPersistentVoterId().then((id) => setVoterId(id));
  }, []);

  // Real-Only Likes store: keyed by entry.id -> { count: number, likedBy: string[] }
  // Every thought starts with 0 real likes unless explicitly liked by a user
  const [likesData, setLikesData] = useState(() => {
    try {
      const saved = localStorage.getItem('thoughts_sketchbook_likes_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Anonymous Comments store: keyed by entry.id
  const [comments, setComments] = useState(() => {
    try {
      const saved = localStorage.getItem('thoughts_sketchbook_comments_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Secret Owner Session (verified via SHA-256)
  const [isOwner, setIsOwner] = useState(() => {
    try {
      const session = localStorage.getItem('sketchbook_owner_session');
      const target = localStorage.getItem('sketchbook_owner_hash') || DEFAULT_OWNER_HASH;
      return Boolean(session && session === target);
    } catch {
      return false;
    }
  });

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

  // Strict one-like-per-user enforcement: adds or toggles off voterId, never duplicates
  const handleToggleLike = (entryId) => {
    if (!voterId) return;

    setLikesData((prev) => {
      const entryLikes = prev[entryId] || { count: 0, likedBy: [] };
      const alreadyLiked = entryLikes.likedBy.includes(voterId);

      let nextLikedBy;
      let nextCount;

      if (alreadyLiked) {
        // Toggle off: remove voterId and decrement count
        nextLikedBy = entryLikes.likedBy.filter((id) => id !== voterId);
        nextCount = Math.max(0, entryLikes.count - 1);
      } else {
        // Toggle on: add voterId (UNIQUE enforcement) and increment count
        nextLikedBy = [...entryLikes.likedBy, voterId];
        nextCount = entryLikes.count + 1;
      }

      return {
        ...prev,
        [entryId]: {
          count: nextCount,
          likedBy: nextLikedBy
        }
      };
    });
  };

  // Hidden Owner Unlock Trigger (Ctrl+Shift+D / Cmd+Shift+D OR ?owner=true)
  useEffect(() => {
    const handleUnlockPrompt = async () => {
      const target = localStorage.getItem('sketchbook_owner_hash') || DEFAULT_OWNER_HASH;
      const currentSession = localStorage.getItem('sketchbook_owner_session');

      if (currentSession === target) {
        const lock = window.confirm('Owner mode is currently active. Would you like to lock it?');
        if (lock) {
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

  // Owner deletion for thoughts/feelings/quotes
  const handleDeleteEntry = (entryId) => {
    try {
      const session = localStorage.getItem('sketchbook_owner_session');
      const target = localStorage.getItem('sketchbook_owner_hash') || DEFAULT_OWNER_HASH;
      if (session !== target) {
        window.alert('Unauthorized: Owner session required.');
        return;
      }
    } catch {
      return;
    }

    setEntries((prev) => prev.filter((item) => item.id !== entryId));
  };

  // Add anonymous comment to an entry
  const handleAddComment = (entryId, text) => {
    if (!text.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      timestamp: timeStr,
      createdAt: Date.now()
    };

    setComments((prev) => ({
      ...prev,
      [entryId]: [...(prev[entryId] || []), newComment]
    }));
  };

  // Owner deletion for an individual anonymous comment
  const handleDeleteComment = (entryId, commentId) => {
    try {
      const session = localStorage.getItem('sketchbook_owner_session');
      const target = localStorage.getItem('sketchbook_owner_hash') || DEFAULT_OWNER_HASH;
      if (session !== target) {
        window.alert('Unauthorized: Owner session required.');
        return;
      }
    } catch {
      return;
    }

    setComments((prev) => ({
      ...prev,
      [entryId]: (prev[entryId] || []).filter((c) => c.id !== commentId)
    }));
  };

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Whenever a new entry is created, prepend it to the top immediately
  const handleSaveEntry = (newEntry) => {
    setEntries((prev) => [newEntry, ...prev]);
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
