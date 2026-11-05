import React, { useState, useEffect } from 'react';
import {
  DoodleQuill,
  DoodleStar,
  DoodleSpiral,
  DoodleEye,
  DoodleSpark
} from './HandDrawnDoodles';
import { getSeasonAndYear } from '../utils/dateUtils';
import SketchbookSelect from './SketchbookSelect';
import CustomDoodlePad from './CustomDoodlePad';

const RATE_LIMIT_COOLDOWN_MS = 10000; // 10 seconds anti-spam debounce

export default function HandDrawnThoughtModal({ isOpen, onClose, onSaveEntry }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('absurdharsh');
  const [type, setType] = useState('thought');
  const [doodleMode, setDoodleMode] = useState('preset'); // 'preset' | 'custom'
  const [presetDoodle, setPresetDoodle] = useState('star');
  const [customDoodle, setCustomDoodle] = useState('');
  const [content, setContent] = useState('');

  // Anti-Spam: Honeypot field (bots will fill this, humans won't see it)
  const [honeypot, setHoneypot] = useState('');

  // Touched states for gentle validation warnings
  const [touched, setTouched] = useState({ title: false, author: false, content: false });
  const [rateLimitError, setRateLimitError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRateLimitError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Validation Rules:
  // Title: 3–60 characters
  const isTitleValid = title.trim().length >= 3 && title.trim().length <= 60;
  // Thought body: 10–1,000 characters
  const isContentValid = content.trim().length >= 10 && content.trim().length <= 1000;
  // Author: 1–30 characters
  const isAuthorValid = author.trim().length >= 1 && author.trim().length <= 30;

  const isFormValid = isTitleValid && isContentValid && isAuthorValid;

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Silent Honeypot Detection
    if (honeypot.trim()) {
      console.warn('[Anti-Spam] Bot detected via honeypot.');
      onClose();
      return;
    }

    // 2. Client-side Debounce & Rate Limiting
    const lastSub = parseInt(localStorage.getItem('tf_last_submission') || '0', 10);
    const now = Date.now();
    if (now - lastSub < RATE_LIMIT_COOLDOWN_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_COOLDOWN_MS - (now - lastSub)) / 1000);
      setRateLimitError(`ink is still drying... please wait ${waitSec}s.`);
      return;
    }

    if (!isFormValid) {
      setTouched({ title: true, author: true, content: true });
      return;
    }

    const finalDoodle = doodleMode === 'custom' && customDoodle ? customDoodle : presetDoodle;

    const newEntry = {
      id: `entry-${Date.now()}`,
      type,
      title: title.trim(),
      author: author.trim() || 'absurdharsh',
      date: getSeasonAndYear(Date.now()),
      createdAt: Date.now(),
      doodle: finalDoodle,
      content: content.trim(),
    };

    // Save timestamp for rate-limiting
    localStorage.setItem('tf_last_submission', String(Date.now()));

    onSaveEntry(newEntry);
    onClose();
    setTitle('');
    setContent('');
    setCustomDoodle('');
    setDoodleMode('preset');
    setTouched({ title: false, author: false, content: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none overflow-y-auto">
      {/* Torn Paper Modal Sheet */}
      <div 
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-paper dark:bg-darkPaper text-ink dark:text-darkInk p-6 sm:p-8 relative shadow-2xl wobbly-paper-border my-auto"
        style={{ borderRadius: '2px 4px 2px 5px' }}
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-4 border-b border-ink/20 dark:border-darkInk/20">
          <div className="flex items-center gap-2">
            <DoodleQuill className="w-5 h-5 text-ink dark:text-darkInk" />
            <h3 className="font-editorial italic text-2xl sm:text-3xl">inscribe a thought</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="naked-link font-handwritten text-xl opacity-60 hover:opacity-100 cursor-pointer"
            title="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Ink Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-handwritten text-lg select-text">
          {/* Hidden Honeypot Field for anti-spam bots */}
          <div aria-hidden="true" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
            <label htmlFor="website_url">Website URL (leave blank)</label>
            <input
              type="text"
              id="website_url"
              name="website_url"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Title Input with Real-Time Ink Meter */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="text-sm opacity-70">title / headline (3–60 chars):</label>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`font-mono ${title.length > 60 ? 'text-red-500 font-bold' : 'opacity-60'}`}>
                  {title.length}/60
                </span>
                {/* Visual ink level meter */}
                <span className="w-10 h-1 bg-ink/15 dark:bg-darkInk/20 rounded-full overflow-hidden inline-block">
                  <span
                    className={`h-full block transition-all duration-200 ${
                      title.length > 60 ? 'bg-red-500' : isTitleValid ? 'bg-ink dark:bg-darkInk' : 'bg-ink/40 dark:bg-darkInk/40'
                    }`}
                    style={{ width: `${Math.min(100, (title.length / 60) * 100)}%` }}
                  />
                </span>
              </div>
            </div>

            <input
              type="text"
              required
              value={title}
              onBlur={() => setTouched((p) => ({ ...p, title: true }))}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. On the fragility of quiet moments..."
              className={`w-full bg-transparent border-b-2 py-1.5 outline-none font-handwritten text-xl text-ink dark:text-darkInk transition-colors ${
                touched.title && !isTitleValid
                  ? 'border-red-500'
                  : 'border-ink/40 dark:border-darkInk/40 focus:border-ink dark:focus:border-darkInk'
              }`}
            />

            {touched.title && !isTitleValid && (
              <p className="text-xs text-red-500 italic mt-1">
                {title.trim().length < 3 ? 'title needs at least 3 characters of thought.' : 'title cannot exceed 60 characters.'}
              </p>
            )}
          </div>

          {/* Author and Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Inscribed By Field */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <label className="text-sm opacity-70">inscribed by (1–30 chars):</label>
                <span className={`font-mono text-xs ${author.length > 30 ? 'text-red-500' : 'opacity-60'}`}>
                  {author.length}/30
                </span>
              </div>
              <input
                type="text"
                value={author}
                onBlur={() => setTouched((p) => ({ ...p, author: true }))}
                onChange={(e) => setAuthor(e.target.value)}
                className={`w-full bg-transparent border-b py-1 outline-none font-handwritten text-base text-ink dark:text-darkInk transition-colors ${
                  touched.author && !isAuthorValid
                    ? 'border-red-500'
                    : 'border-ink/40 dark:border-darkInk/40 focus:border-ink dark:focus:border-darkInk'
                }`}
              />
              {touched.author && !isAuthorValid && (
                <p className="text-xs text-red-500 italic mt-0.5">author name must be between 1 and 30 characters.</p>
              )}
            </div>

            {/* Category Dropdown (Custom Sketchbook Select) */}
            <div>
              <label className="block text-sm opacity-70 mb-1">category:</label>
              <SketchbookSelect
                value={type}
                onChange={(val) => setType(val)}
                ariaLabel="Select thought category"
                className="w-full"
                buttonClassName="w-full justify-between"
                options={[
                  { value: 'thought', label: 'thought' },
                  { value: 'feeling', label: 'feeling' },
                  { value: 'quote', label: 'quote' }
                ]}
              />
            </div>
          </div>

          {/* Doodle Picker (Presets vs Draw Your Own) */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm opacity-70">margin doodle:</label>
              
              {/* Tab Selector */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDoodleMode('preset')}
                  className={`cursor-pointer px-1.5 py-0.5 rounded transition-all ${
                    doodleMode === 'preset'
                      ? 'border-b-2 border-ink dark:border-darkInk font-bold opacity-100'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  presets
                </button>
                <span className="opacity-30">|</span>
                <button
                  type="button"
                  onClick={() => setDoodleMode('custom')}
                  className={`cursor-pointer px-1.5 py-0.5 rounded transition-all ${
                    doodleMode === 'custom'
                      ? 'border-b-2 border-ink dark:border-darkInk font-bold opacity-100'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  draw your own ✍
                </button>
              </div>
            </div>

            {doodleMode === 'preset' ? (
              <div className="flex items-center gap-3">
                {[
                  { id: 'star', Icon: DoodleStar, label: 'star' },
                  { id: 'spiral', Icon: DoodleSpiral, label: 'spiral' },
                  { id: 'eye', Icon: DoodleEye, label: 'eye' },
                  { id: 'spark', Icon: DoodleSpark, label: 'spark' }
                ].map(({ id, Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPresetDoodle(id)}
                    className={`p-2 border transition-all cursor-pointer flex items-center justify-center ${
                      presetDoodle === id
                        ? 'border-ink dark:border-darkInk bg-ink/10 dark:bg-darkInk/10 scale-105'
                        : 'border-transparent opacity-50 hover:opacity-100 hover:border-ink/20'
                    }`}
                    title={label}
                  >
                    <Icon className="w-5 h-5 text-ink dark:text-darkInk" />
                  </button>
                ))}
              </div>
            ) : (
              <CustomDoodlePad
                onDoodleChange={(dataUrl) => setCustomDoodle(dataUrl)}
                initialDataUrl={customDoodle}
              />
            )}
          </div>

          {/* Thought Scribble Content Textarea with Real-Time Ink Meter */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="text-sm opacity-70">thought scribble (10–1,000 chars):</label>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`font-mono ${content.length > 1000 ? 'text-red-500 font-bold' : 'opacity-60'}`}>
                  {content.length}/1,000
                </span>
                {/* Visual ink level meter */}
                <span className="w-14 h-1 bg-ink/15 dark:bg-darkInk/20 rounded-full overflow-hidden inline-block">
                  <span
                    className={`h-full block transition-all duration-200 ${
                      content.length > 1000 ? 'bg-red-500' : isContentValid ? 'bg-ink dark:bg-darkInk' : 'bg-ink/40 dark:bg-darkInk/40'
                    }`}
                    style={{ width: `${Math.min(100, (content.length / 1000) * 100)}%` }}
                  />
                </span>
              </div>
            </div>

            <textarea
              required
              rows={4}
              value={content}
              onBlur={() => setTouched((p) => ({ ...p, content: true }))}
              onChange={(e) => setContent(e.target.value)}
              placeholder="write freely, no pretense..."
              className={`w-full bg-transparent border p-2.5 outline-none font-body text-lg leading-relaxed text-ink dark:text-darkInk resize-none transition-colors ${
                touched.content && !isContentValid
                  ? 'border-red-500'
                  : 'border-ink/30 dark:border-darkInk/30 focus:border-ink dark:focus:border-darkInk'
              }`}
            />

            {touched.content && !isContentValid && (
              <p className="text-xs text-red-500 italic mt-1">
                {content.trim().length < 10
                  ? 'give your scribble at least 10 characters to express the thought.'
                  : 'scribble cannot exceed 1,000 characters.'}
              </p>
            )}
          </div>

          {rateLimitError && (
            <p className="text-xs text-amber-600 dark:text-amber-400 italic text-center">
              {rateLimitError}
            </p>
          )}

          {/* Form Actions */}
          <div className="pt-3 flex items-center justify-end gap-5">
            <button
              type="button"
              onClick={onClose}
              className="naked-link font-handwritten text-base opacity-60 hover:opacity-100 cursor-pointer"
            >
              discard
            </button>

            <button
              type="submit"
              disabled={!isFormValid}
              className={`naked-link font-editorial italic text-2xl text-ink dark:text-darkInk font-bold transition-all ${
                isFormValid
                  ? 'scribble-hover cursor-pointer opacity-100'
                  : 'opacity-35 cursor-not-allowed hover:opacity-35'
              }`}
              title={isFormValid ? 'Inscribe this thought' : 'Complete required fields to inscribe'}
            >
              ink this thought →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
