import React, { useState } from 'react';
import {
  DoodleQuill,
  DoodleStar,
  DoodleSpiral,
  DoodleEye,
  DoodleSpark
} from './HandDrawnDoodles';

export default function HandDrawnThoughtModal({ isOpen, onClose, onSaveEntry }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('absurdharsh');
  const [type, setType] = useState('thought');
  const [doodle, setDoodle] = useState('star');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newEntry = {
      id: `entry-${Date.now()}`,
      type,
      title: title.trim(),
      author: author.trim() || 'absurdharsh',
      date: 'Just Now',
      createdAt: Date.now(),
      doodle,
      content: content.trim(),
    };

    onSaveEntry(newEntry);
    onClose();
    setTitle('');
    setContent('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      {/* Torn Paper Modal Sheet */}
      <div 
        className="w-full max-w-lg bg-paper dark:bg-darkPaper text-ink dark:text-darkInk p-6 sm:p-8 relative shadow-2xl wobbly-paper-border"
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
            className="naked-link font-handwritten text-xl opacity-60 hover:opacity-100"
            title="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Ink Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-handwritten text-lg select-text">
          {/* Title Input */}
          <div>
            <label className="block text-sm opacity-70 mb-1">title / headline:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. On the fragility of quiet moments..."
              className="w-full bg-transparent border-b-2 border-ink/40 dark:border-darkInk/40 py-1.5 outline-none font-handwritten text-xl focus:border-ink dark:focus:border-darkInk text-ink dark:text-darkInk"
            />
          </div>

          {/* Author and Type Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm opacity-70 mb-1">inscribed by:</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-transparent border-b border-ink/40 dark:border-darkInk/40 py-1 outline-none font-handwritten text-base text-ink dark:text-darkInk"
              />
            </div>
            <div>
              <label className="block text-sm opacity-70 mb-1">category:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-paper dark:bg-darkPaper border-b border-ink/40 dark:border-darkInk/40 py-1 outline-none font-handwritten text-base text-ink dark:text-darkInk cursor-pointer"
              >
                <option value="thought">thought</option>
                <option value="feeling">feeling</option>
                <option value="quote">quote</option>
              </select>
            </div>
          </div>

          {/* Doodle icon picker */}
          <div>
            <label className="block text-sm opacity-70 mb-2">margin doodle:</label>
            <div className="flex items-center gap-4">
              {[
                { id: 'star', Icon: DoodleStar },
                { id: 'spiral', Icon: DoodleSpiral },
                { id: 'eye', Icon: DoodleEye },
                { id: 'spark', Icon: DoodleSpark }
              ].map(({ id, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDoodle(id)}
                  className={`p-1.5 border ${doodle === id ? 'border-ink dark:border-darkInk bg-ink/10 dark:bg-darkInk/10' : 'border-transparent opacity-50 hover:opacity-100'} transition-all`}
                >
                  <Icon className="w-5 h-5 text-ink dark:text-darkInk" />
                </button>
              ))}
            </div>
          </div>

          {/* Content Textarea */}
          <div>
            <label className="block text-sm opacity-70 mb-1">thought scribble:</label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="write freely, no pretense..."
              className="w-full bg-transparent border border-ink/30 dark:border-darkInk/30 p-2.5 outline-none font-body text-lg leading-relaxed focus:border-ink dark:focus:border-darkInk text-ink dark:text-darkInk resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-5">
            <button
              type="button"
              onClick={onClose}
              className="naked-link font-handwritten text-base opacity-60 hover:opacity-100"
            >
              discard
            </button>
            <button
              type="submit"
              className="naked-link scribble-hover font-editorial italic text-2xl text-ink dark:text-darkInk font-bold"
            >
              ink this thought →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

