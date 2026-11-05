import React, { useState, useRef, useEffect, useId } from 'react';
import { DoodleArrowDown } from './HandDrawnDoodles';

/**
 * Custom Sketchbook Select / Dropdown Control
 * Replaces native HTML <select> elements with an accessible, keyboard-navigable,
 * organic hand-drawn ink-on-paper dropdown.
 */
export default function SketchbookSelect({
  value,
  onChange,
  options = [],
  label = '',
  ariaLabel = 'Select option',
  className = '',
  buttonClassName = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listboxRef = useRef(null);
  const selectId = useId();

  // Normalize options to [{ value, label }]
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'object' && opt !== null ? opt : { value: opt, label: String(opt) }
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value) || normalizedOptions[0];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Keep highlighted option aligned with current selection when opened
  useEffect(() => {
    if (isOpen) {
      const idx = normalizedOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optValue) => {
    if (onChange) onChange(optValue);
    setIsOpen(false);
  };

  // Keyboard navigation for accessibility
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < normalizedOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : normalizedOptions.length - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
          handleSelect(normalizedOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
      case 'Tab':
        setIsOpen(false);
        break;
      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlightedIndex(normalizedOptions.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left font-handwritten select-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center gap-1.5">
        {label && <span className="opacity-50 text-base sm:text-lg select-none">{label}</span>}
        
        {/* Dropdown Button Trigger */}
        <button
          type="button"
          id={`sketchbook-select-btn-${selectId}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          aria-controls={`sketchbook-select-list-${selectId}`}
          onClick={handleToggle}
          className={`naked-link group inline-flex items-center gap-1.5 py-0.5 px-1 text-ink dark:text-darkInk border-b-2 border-ink/40 dark:border-darkInk/40 hover:border-ink dark:hover:border-darkInk focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current text-base sm:text-lg cursor-pointer transition-colors duration-200 ${buttonClassName}`}
        >
          <span className="font-handwritten underline decoration-transparent decoration-1 underline-offset-4">
            {selectedOption ? selectedOption.label : ''}
          </span>
          <span
            className={`inline-block w-3.5 h-3.5 text-ink dark:text-darkInk transition-transform duration-200 transform ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
          >
            <DoodleArrowDown className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>

      {/* Floating Ink Listbox Panel */}
      {isOpen && (
        <div
          ref={listboxRef}
          id={`sketchbook-select-list-${selectId}`}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={
            highlightedIndex >= 0 ? `sketchbook-opt-${selectId}-${highlightedIndex}` : undefined
          }
          style={{
            borderRadius: '2px 3px 2px 4px',
            animation: 'dropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="absolute z-50 mt-1 min-w-[130px] w-full max-w-[220px] bg-paper dark:bg-darkPaper text-ink dark:text-darkInk border border-ink/40 dark:border-darkInk/40 shadow-[3px_3px_0px_rgba(0,0,0,0.85)] dark:shadow-[3px_3px_0px_rgba(255,255,255,0.85)] py-1 overflow-hidden"
        >
          {normalizedOptions.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = idx === highlightedIndex;

            return (
              <div
                key={opt.value}
                id={`sketchbook-opt-${selectId}-${idx}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex items-center justify-between px-3 py-1.5 text-sm sm:text-base cursor-pointer transition-colors duration-150 ${
                  isHighlighted ? 'bg-ink/10 dark:bg-darkInk/15' : 'bg-transparent'
                } ${isSelected ? 'font-bold' : 'font-normal opacity-80 hover:opacity-100'}`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="text-xs opacity-75 font-editorial italic ml-2">✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

