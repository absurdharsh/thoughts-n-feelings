// ==========================================================================
// Thoughts 'n' Feelings — Date & Season Utilities
// Converts raw timestamps into literary sketchbook dates (e.g. "Autumn 2026")
// ==========================================================================

export function parseTimestamp(val) {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!isNaN(parsed)) return parsed;
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 1000000000) return num;
  }
  return null;
}

export function getSeason(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj || Date.now());
  const month = d.getMonth(); // 0 = Jan, 11 = Dec
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

export function getSeasonAndYear(timestamp = Date.now()) {
  const ts = parseTimestamp(timestamp) || Date.now();
  const d = new Date(ts);
  const season = getSeason(d);
  const year = d.getFullYear();
  return `${season} ${year}`;
}

export function getMonthAndYear(timestamp = Date.now()) {
  const ts = parseTimestamp(timestamp) || Date.now();
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatEntryDate(entry) {
  if (!entry) return 'Autumn 2026';

  const rawDate = typeof entry.date === 'string' ? entry.date.trim() : '';

  // Preserve intentional handcrafted poetic timestamps from initial thoughts
  const poeticDates = ['late night', 'midnight', '1934', 'dusk'];
  if (rawDate && poeticDates.includes(rawDate.toLowerCase())) {
    return rawDate;
  }

  const timestamp = parseTimestamp(entry.createdAt) ||
    (entry.id && String(entry.id).startsWith('entry-')
      ? parseInt(String(entry.id).replace('entry-', ''), 10)
      : null);

  if (timestamp) {
    const diffMs = Date.now() - timestamp;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Show 'Just now' only while fresh (first 30 minutes)
    if (diffMinutes >= 0 && diffMinutes < 30) {
      return 'Just now';
    }

    // After 30 minutes, display the season and year
    return getSeasonAndYear(timestamp);
  }

  // If raw date is already a season, keep it
  if (rawDate && rawDate.toLowerCase() !== 'just now') {
    return rawDate;
  }

  return getSeasonAndYear(Date.now());
}

export function getEntryTooltipDate(entry) {
  if (!entry) return '';
  const timestamp = parseTimestamp(entry.createdAt);
  if (!timestamp) return entry.date || '';

  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

