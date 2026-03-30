const STORAGE_PREFIX = 'marrow_';

function getDeviceId() {
  const key = `${STORAGE_PREFIX}device_id`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getAll(collection) {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${collection}`);
  return raw ? JSON.parse(raw) : [];
}

function saveAll(collection, items) {
  localStorage.setItem(`${STORAGE_PREFIX}${collection}`, JSON.stringify(items));
}

function getById(collection, id) {
  return getAll(collection).find((item) => item.id === id) ?? null;
}

function create(collection, data) {
  const items = getAll(collection);
  const item = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
  items.push(item);
  saveAll(collection, items);
  return item;
}

function update(collection, id, data) {
  const items = getAll(collection);
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...data };
  saveAll(collection, items);
  return items[idx];
}

function remove(collection, id) {
  const items = getAll(collection).filter((item) => item.id !== id);
  saveAll(collection, items);
}

function query(collection, predicate) {
  return getAll(collection).filter(predicate);
}

export const storage = {
  getDeviceId,
  getAll,
  getById,
  create,
  update,
  remove,
  query,
};
