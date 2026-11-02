import React, { useState } from 'react';
import { sound } from '../utils/audio';

const STELE_ASCII_SEALS = [
  {
    name: 'MENS AETERNA',
    art: `
  ╔════════════════════════════════════════════════╗
  ║  SCHEMA: MENS AETERNA                          ║
  ║  "Unfiltered thought etched in stone."         ║
  ║                  ┌───┐                         ║
  ║                 │ O │                          ║
  ║                  └───┘                         ║
  ╚════════════════════════════════════════════════╝
    `
  },
  {
    name: 'PYRAMIS SOLIS',
    art: `
  ╔════════════════════════════════════════════════╗
  ║  SCHEMA: PYRAMIS ASCENSIONIS                   ║
  ║  "Truth stands unbroken across centuries."     ║
  ║                   /\                           ║
  ║                  /  \                          ║
  ║                 /====\                         ║
  ╚════════════════════════════════════════════════╝
    `
  },
  {
    name: 'SEPULCRUM',
    art: `
  ╔════════════════════════════════════════════════╗
  ║  SCHEMA: SEPULCRUM ET CINIS                    ║
  ║  "Memoria Aeterna in Saxo"                     ║
  ║                    .---.                       ║
  ║                   /     \                      ║
  ║                  |  RIP  |                     ║
  ╚════════════════════════════════════════════════╝
    `
  }
];

export default function InteractiveTerminalLog({ isOpen, onClose, onSaveEntry, entries = [] }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('absurdharsh');
  const [type, setType] = useState('thought');
  const [chapter, setChapter] = useState('LIBER V: MANIFESTUM FUNDAMENTALE');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('Philosophy, Lapis Vivus');
  const [selectedSealIndex, setSelectedSealIndex] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    sound.playClick(1.4);

    const newEntry = {
      id: `stele-${Date.now().toString().slice(-4)}`,
      chapter: chapter || 'LIBER RECENS',
      chapterRoman: 'LIBER RECENS',
      type: type,
      title: title.trim(),
      epigraph: 'IN RECENTI LAPIDE CARVATUS',
      author: author.trim() || 'Anonymous Scribe',
      date: 'ANNO MMXXVI',
      timestamp: 'HORA RECENS',
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      snippet: content.trim().slice(0, 85) + '...',
      content: content.trim(),
      asciiArt: STELE_ASCII_SEALS[selectedSealIndex].art,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-none select-none">
      <div className="relative w-full max-w-xl bg-[#222325] border-2 border-[#36373b] p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.98)] overflow-y-auto max-h-[90vh]">
        {/* Modal Archaeological Header */}
        <div className="flex items-center justify-between border-b border-[#36373b] pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm text-[#9c9679]">‡</span>
            <h3 className="antique-subhead text-sm sm:text-base font-bold tracking-[0.2em] text-[#e4e2dd] uppercase">
              CHISEL INSCRIPTION UPON STELE
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="stone-inlay-btn px-2.5 py-1 text-xs"
          >
            [ CLOSE &times; ]
          </button>
        </div>

        {/* Chisel Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest text-[#8c867a] uppercase mb-1">
                TITULUS (TITLE)
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title of reflection"
                className="w-full px-3 py-2 bg-[#17181a] border border-[#36373b] stone-inset text-xs text-[#d8d2c4] focus:outline-none focus:border-[#6a6344]"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-widest text-[#8c867a] uppercase mb-1">
                AUCTOR (SCRIBE)
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="absurdharsh or alias"
                className="w-full px-3 py-2 bg-[#17181a] border border-[#36373b] stone-inset text-xs text-[#d8d2c4] focus:outline-none focus:border-[#6a6344]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest text-[#8c867a] uppercase mb-1">
                CLASSIFICATION
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-[#17181a] border border-[#36373b] stone-inset text-xs text-[#d8d2c4] focus:outline-none focus:border-[#6a6344] uppercase"
              >
                <option value="thought">COGITATIO (Thought / Reasoning)</option>
                <option value="feeling">SENTIENTIA (Feeling / Internal Weather)</option>
                <option value="quote">MONUMENTUM (Quote / Epitaph)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] tracking-widest text-[#8c867a] uppercase mb-1">
                STRATUM / CHAPTER
              </label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="e.g. LIBER V"
                className="w-full px-3 py-2 bg-[#17181a] border border-[#36373b] stone-inset text-xs text-[#d8d2c4] focus:outline-none focus:border-[#6a6344] uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] tracking-widest text-[#8c867a] uppercase mb-1">
              PRIMARY INSCRIPTION (WORDS ETCHED INTO ROCK)
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Inscribe your unfiltered thoughts, feelings, or reflections..."
              className="w-full px-3 py-2 bg-[#17181a] border border-[#36373b] stone-inset text-xs font-serif text-[#d8d2c4] leading-relaxed focus:outline-none focus:border-[#6a6344]"
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-widest text-[#8c867a] uppercase mb-1">
              CHOOSE SCHEMATIC SEAL (ASCII ARTIFACT)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STELE_ASCII_SEALS.map((seal, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedSealIndex(idx)}
                  className={`stone-inlay-btn p-2 text-[10px] uppercase tracking-wider ${selectedSealIndex === idx ? 'bg-[#2b2c31] border-[#4f515a] text-[#ffffff]' : 'text-[#8c867a]'}`}
                >
                  {seal.name}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons: Submit & Export */}
          <div className="pt-4 border-t border-[#36373b] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={exportLedgerAsMarkdown}
                className="stone-inlay-btn px-3 py-2 text-[10px] uppercase text-[#8c867a]"
                title="Export entire codex in Markdown format"
              >
                EXPORT .MD CODEX
              </button>
              <button
                type="button"
                onClick={exportLedgerAsJson}
                className="stone-inlay-btn px-3 py-2 text-[10px] uppercase text-[#8c867a]"
                title="Export entire codex in JSON format"
              >
                EXPORT .JSON
              </button>
            </div>

            <button
              type="submit"
              className="stone-inlay-btn px-6 py-2.5 text-xs uppercase tracking-[0.16em] text-[#ffffff] bg-[#2b2c31] border-[#4f515a]"
            >
              CHISEL INTO BASALT ‡
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
