// ==========================================================================
// Cloud Database Service Adapter (delegates to src/db.js)
// ==========================================================================

import {
  SHARED_DB_URL,
  fetchCloudState,
  saveCloudState,
  syncWithCloud,
  normalizeState
} from '../db';

export { SHARED_DB_URL };

export function normalizeCloudData(json) {
  return normalizeState(json);
}

export async function fetchCloudData() {
  return fetchCloudState();
}

export async function saveCloudData(state) {
  return saveCloudState(state);
}

export async function mutateCloudData(mutatorFn) {
  return syncWithCloud(mutatorFn);
}
