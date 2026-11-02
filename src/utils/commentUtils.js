// ==========================================================================
// Comment normalization & lookup utility for Thoughts 'n' Feelings
// Supports static string IDs ('entry-01', '01', '1') and dynamic UUIDs
// ==========================================================================

export function getCommentsForEntry(commentsMap, entry) {
  if (!commentsMap || !entry) return [];
  const id = String(entry.id || '');
  const num = String(entry.number || '');
  const numTrim = num.replace(/^0+/, '');
  const entryNum = id.startsWith('entry-') ? id.replace('entry-', '') : '';
  const entryNumTrim = entryNum.replace(/^0+/, '');

  const keys = Array.from(new Set([id, num, numTrim, entryNum, entryNumTrim].filter(Boolean)));
  const seenIds = new Set();
  const results = [];

  for (const key of keys) {
    const list = commentsMap[key];
    if (Array.isArray(list)) {
      for (const item of list) {
        if (item && item.id && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          results.push(item);
        }
      }
    }
  }

  // Sort chronological
  return results.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

