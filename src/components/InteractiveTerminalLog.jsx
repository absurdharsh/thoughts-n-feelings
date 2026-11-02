import React, { useState } from 'react';
import { X, PenTool, Check, Download, Sparkles, Terminal, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

const PRESET_ASCII = [
  `
  .---.
 /     \\   [ MIND ENGINE ]
| () () |  "Unfiltered synaptic
 \\  ^  /    discharge."
  |||||
  `,
  `
   +---+
   | * |   [ STARLIGHT ]
   +---+   "A signal in the void."
  `,
  `
  ~ ~ ~ ~
   \\   \\   [ DRIFT ]
  ~ ~ ~ ~
  `
];

export default function InteractiveTerminalLog({ isOpen, onClose, onSaveEntry, entries = [] }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('absurdharsh');
  const [type, setType] = useState('thought');
  const [chapter, setChapter] = useState('CHAPTER V: CODE & MANIFESTO');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Existential');
  const [tags, setTags] = useState('BrainDump, Raw');
  const [selectedAscii, setSelectedAscii] = useState(PRESET_ASCII[0]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    sound.playClick(1.6);

    const now = new Date();
    const newEntry = {
      id: `entry-${Date.now().toString().slice(-4)}`,
      chapter: chapter || 'UNCLASSIFIED REFLECTIONS',
      type: type,
      title: title.trim(),
      author: author.trim() || 'Anonymous Inscriber',
      date: now.toISOString().split('T')[0],
      timestamp: now.toTimeString().split(' ')[0] + ' UTC',
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      snippet: content.trim().slice(0, 85) + '...',
      content: content.trim(),
      asciiArt: selectedAscii,
      mood: mood.trim(),
      likes: 1,
      starred: true,
    };

    onSaveEntry(newEntry);

    try {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#c5a059', '#e5d7ba', '#00ff66'],
      });
    } catch {}

    onClose();
  };

  const exportLedgerAsJson = () => {
    sound.playClick(1.2);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `thoughts-n-feelings-ledger-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportLedgerAsMarkdown = () => {
    sound.playClick(1.2);
    let md = `# THOUGHTS-N-FEELINGS: DIGITAL CODEX\nExported: ${new Date().toISOString()}\n\n`;
    entries.forEach((e) => {
      md += `## [${e.type.toUpperCase()}] ${e.title}\n`;
      md += `*Author: ${e.author} | Date: ${e.date} | Chapter: ${e.chapter}*\n\n`;
      md += `${e.content}\n\n`;
      if (e.asciiArt) {
        md += `\`\`\`\n${e.asciiArt.trim()}\n\`\`\`\n\n`;
      }
      md += `---\n\n`;
    });

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `thoughts-n-feelings-journal-${Date.now()}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-[#0b0d13] border-2 border-[#c5a059]/60 shadow-[0_0_60px_rgba(197,160,89,0.15)] text-zinc-200 font-mono text-xs overflow-hidden my-8">
        
        {/* Terminal Header Bar */}
        <div className="px-4 py-3 bg-[#131620] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#c5a059] font-bold">
            <Terminal className="w-4 h-4" />
            <span>TERMINAL://INSCRIBE_FOLIO.SH</span>
          </div>
          <button
            onClick={() => {
              sound.playClick(0.9);
              onClose();
            }}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-zinc-500 text-[11px] select-none border-b border-zinc-800/60 pb-2">
            +--[ ENTER STREAM OF CONSCIOUSNESS ]----------------------------+
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-zinc-400">ENTRY TITLE</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. On The Silence of Sunday Evenings"
                className="w-full px-3 py-2 rounded bg-black/60 border border-zinc-800 focus:border-[#c5a059] focus:outline-none text-zinc-100 placeholder-zinc-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400">TYPE</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/60 border border-zinc-800 focus:border-[#c5a059] focus:outline-none text-zinc-100"
              >
                <option value="thought">THOUGHT</option>
                <option value="feeling">FEELING</option>
                <option value="quote">QUOTE</option>
              </select>
            </div>
          </div>

          {/* Author & Mood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-zinc-400">AUTHOR / PEN NAME</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/60 border border-zinc-800 focus:border-[#c5a059] focus:outline-none text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400">MOOD / TEMPERAMENT</label>
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g. Melancholic, Cathartic, Alert"
                className="w-full px-3 py-2 rounded bg-black/60 border border-zinc-800 focus:border-[#c5a059] focus:outline-none text-zinc-100"
              />
            </div>
          </div>

          {/* Chapter Selector */}
          <div className="space-y-1">
            <label className="text-zinc-400">CHAPTER INCLUSION</label>
            <input
              type="text"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="e.g. CHAPTER I: DETERMINISM"
              className="w-full px-3 py-2 rounded bg-black/60 border border-zinc-800 focus:border-[#c5a059] focus:outline-none text-zinc-100"
            />
          </div>

          {/* Main Content Body */}
          <div className="space-y-1">
            <label className="text-zinc-400">INSCRIPTION BODY (MARKDOWN / RAW THOUGHT)</label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dump whatever you're thinking or feeling without self-censorship..."
              className="w-full px-3 py-2 rounded bg-black/60 border border-zinc-800 focus:border-[#c5a059] focus:outline-none text-zinc-100 placeholder-zinc-700 font-serif text-sm leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-zinc-400">TAGS (COMMA SEPARATED)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Philosophy, LateNight, Solitude"
              className="w-full px-3 py-2 rounded bg-black/60 border border-zinc-800 focus:border-[#c5a059] focus:outline-none text-zinc-100"
            />
          </div>

          {/* ASCII Emblem Select */}
          <div className="space-y-1">
            <label className="text-zinc-400">ATTACH RETRO ASCII EMBLEM</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_ASCII.map((art, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    sound.playClick(1.2);
                    setSelectedAscii(art);
                  }}
                  className={`p-2 rounded text-left font-mono text-[9px] leading-tight border transition-colors ${
                    selectedAscii === art
                      ? 'border-[#c5a059] bg-[#c5a059]/10 text-[#c5a059]'
                      : 'border-zinc-800 bg-black/40 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <pre className="whitespace-pre overflow-hidden">{art.trim()}</pre>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={exportLedgerAsJson}
                className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center space-x-1"
                title="Download JSON Ledger Backup"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
              <button
                type="button"
                onClick={exportLedgerAsMarkdown}
                className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center space-x-1"
                title="Download Markdown Codex"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>MARKDOWN</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded bg-[#c5a059] text-black font-bold uppercase hover:bg-[#d7c197] transition-colors flex items-center space-x-1.5"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>INSCRIBE FOLIO</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

