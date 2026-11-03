// ==========================================================================
// Cloud Database Service Adapter (delegates to src/db.js)
// ==========================================================================

import {
  API_STORE_URL,
  fetchStore,
  saveLocalState,
  normalizeState
} from '../db';

export const SHARED_DB_URL = API_STORE_URL;

export function normalizeCloudData(json) {
  return normalizeState(json);
}

export async function fetchCloudData() {
  return fetchStore();
}

export async function saveCloudData(state) {
  saveLocalState(state);
  return true;
}
