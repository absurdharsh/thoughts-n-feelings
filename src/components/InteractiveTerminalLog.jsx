import React, { useState } from 'react';
import { sound } from '../utils/audio';

const STELE_ASCII_SEALS = [
  {
    name: 'MIND & ARCHITECT',
    art: `
  +==================================+
  |    .---.                         |
  |   /     \\    [ MENS AETERNA ]    |
  |  | () () |   "Unfiltered thought |
  |   \\  ^  /     etched in stone."  |
  |    |||||                         |
  +==================================+
    `
  },
  {
    name: 'SOLAR PYRAMID',
    art: `
  +==================================+
  |            /\\                    |
  |           /  \\    [ PYRAMIS ]    |
  |          /====\\   "Truth stands  |
  |         /      \\   unbroken."    |
  |        /========\\                |
  +==================================+
    `
  },
  {
    name: 'SEPULCHRAL EPITAPH',
    art: `
  +==================================+
  |              .---.               |
  |             /     \\              |
  |            |  RIP  |  [ EPITAPH ]|
  |         ---|-------|---          |
  +==================================+
    `
  }
];

export default function InteractiveTerminalLog({ isOpen, onClose, onSaveEntry, entries = [] }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('absurdharsh');
  const [type, setType] = useState('thought');
  const [chapter, setChapter] = useState('LIBER V: MANIFESTUM ET FUNDAMENTUM');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('Philosophy, Lapis Vivus');
  const [selectedSealIndex, setSelectedSealIndex] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    sound.playClick(1.4);

    const now = new Date();
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const romanDate = `ANNO MMXXVI &bull; ${romanMonths[now.getMonth()]}.${now.getDate()}`;

    const newEntry = {
      id: `stele-${Date.now().toString().slice(-4)}`,
      chapter: chapter || 'LIBER RECENS',
      chapterRoman: 'LIBER RECENS',
      type: type,
      title: title.trim(),
      epigraph: 'IN RECENTI LAPIDE CARVATUS',
      author: author.trim() || 'Anonymous Scribe',
      date: romanDate,
      timestamp: `HORA ${now.toTimeString().split(' ')[0]}`,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      snippet: content.trim().slice(0, 85) + '...',
      content: content.trim(),
      asciiArt: STELE_ASCII_SEALS[selectedSealIndex].art,
      mood: 'Monolithic',
      likes: 1,
      starred: true,
    };

    onSaveEntry(newEntry);
    onClose();
  };

  const exportLedgerAsJson = () => {
    sound.playClick(1.2);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `thoughts-n-feelings-monument-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportLedgerAsMarkdown = () => {
    sound.playClick(1.2);
    let md = `# THOUGHTS 'N' FEELINGS — MONUMENTUM DIGITALE\n*Exported from Ancient Basalt Ledger: ${new Date().toISOString()}*\n\n---\n\n`;
    entries.forEach((e) => {
      md += `## [${e.type.toUpperCase()}] ${e.title}\n`;
      md += `**Author:** ${e.author} | **Date:** ${e.date} | **Chapter:** ${e.chapter}\n\n`;
      md += `${e.content}\n\n`;
      if (e.asciiArt) {
        md += `\`\`\`\n${e.asciiArt.trim()}\n\`\`\`\n\n`;
      }
      md += `---\n\n`;
    });

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `thoughts-n-feelings-codex-${Date.now()}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl stone-slab stone-grain p-6 sm:p-8 border border-[#383631] shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#282723] pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm text-[#73716b]">‡</span>
            <h3 className="font-display text-sm sm:text-base font-bold tracking-[0.25em] text-[#e5e0d8] uppercase carved-text">
              CHISEL INSCRIPTION UPON STELE
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="stone-btn px-2.5 py-1 text-xs font-mono text-[#73716b] hover:text-[#ffffff]"
          >
            &times; CLOSE
          </button>
        </div>

        {/* Chisel Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest text-[#73716b] uppercase mb-1">
                INSCRIBED TITLE (TITULUS)
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. On The Silence of Midnight"
                className="w-full px-3 py-2 bg-[#0a0a09] border border-[#262522] stone-inset text-xs text-[#d8d2c4] focus:outline-none focus:border-[#44423d]"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-widest text-[#73716b] uppercase mb-1">
                SCRIBE NAME (AUCTOR)
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="absurdharsh or alias"
                className="w-full px-3 py-2 bg-[#0a0a09] border border-[#262522] stone-inset text-xs text-[#d8d2c4] focus:outline-none focus:border-[#44423d]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest text-[#73716b] uppercase mb-1">
                CLASSIFICATION
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a09] border border-[#262522] stone-inset text-xs text-[#d8d2c4] focus:outline-none focus:border-[#44423d] uppercase"
              >
                <option value="thought">COGITATIO (Thought / Reasoning)</option>
                <option value="feeling">SENTIENTIA (Feeling / Internal Weather)</option>
                <option value="quote">MONUMENTUM (Quote / Epitaph)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] tracking-widest text-[#73716b] uppercase mb-1">
                STRATA / CHAPTER
              </label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="e.g. LIBER V: MANIFESTUM"
                className="w-full px-3 py-2 bg-[#0a0a09] border border-[#262522] stone-inset text-xs text-[#d8d2c4] focus:outline-none focus:border-[#44423d] uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] tracking-widest text-[#73716b] uppercase mb-1">
              PRIMARY INSCRIPTION (WORDS ETCHED INTO ROCK)
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Inscribe your unfiltered philosophical reasoning, emotions, or reflections..."
              className="w-full px-3 py-2 bg-[#0a0a09] border border-[#262522] stone-inset text-xs font-serif text-[#d8d2c4] leading-relaxed focus:outline-none focus:border-[#44423d]"
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-widest text-[#73716b] uppercase mb-1">
              CHOOSE LAPIDARY SEAL (ASCII ARTIFACT)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STELE_ASCII_SEALS.map((seal, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedSealIndex(idx)}
                  className={`stone-btn p-2 text-[10px] uppercase tracking-wider ${selectedSealIndex === idx ? 'bg-[#222220] border-[#44423d] text-[#ffffff]' : 'text-[#73716b]'}`}
                >
                  {seal.name}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons: Submit & Export */}
          <div className="pt-4 border-t border-[#22211f] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={exportLedgerAsMarkdown}
                className="stone-btn px-3 py-2 text-[10px] uppercase text-[#88857c]"
                title="Export entire codex in Markdown format"
              >
                EXPORT .MD CODEX
              </button>
              <button
                type="button"
                onClick={exportLedgerAsJson}
                className="stone-btn px-3 py-2 text-[10px] uppercase text-[#88857c]"
                title="Export entire codex in JSON format"
              >
                EXPORT .JSON
              </button>
            </div>

            <button
              type="submit"
              className="stone-btn px-6 py-2.5 font-display text-xs uppercase tracking-[0.2em] text-[#ffffff] bg-[#222220] border-[#44423d]"
            >
              CHISEL INTO BASALT ✍
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
