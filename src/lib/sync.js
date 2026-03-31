import { storage } from './storage';

const COLLECTIONS = ['books', 'chapters', 'sessions', 'recallSessions', 'cards'];

function getAllData() {
  const data = {};
  for (const col of COLLECTIONS) {
    data[col] = storage.getAll(col);
  }
  return data;
}

function restoreAllData(data) {
  for (const col of COLLECTIONS) {
    if (data[col]) {
      localStorage.setItem(`marrow_${col}`, JSON.stringify(data[col]));
    }
  }
}

export async function syncToCloud() {
  const uuid = storage.getDeviceId();
  const data = getAllData();
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid, data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function restoreFromCloud(uuid) {
  const res = await fetch(`/api/sync?uuid=${encodeURIComponent(uuid)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Restore failed');
  }
  const { data } = await res.json();
  restoreAllData(data);
  return true;
}

// Auto-sync after meaningful actions (debounced)
let syncTimer = null;
export function scheduleSyncToCloud() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncToCloud(), 5000);
}
