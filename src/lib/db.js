import { storage } from './storage';

// --- Books ---

export function getBooks() {
  return storage.getAll('books');
}

export function getBook(id) {
  return storage.getById('books', id);
}

export function createBook({ title, author, description = '' }) {
  return storage.create('books', { title, author, description, status: 'reading' });
}

export function updateBook(id, data) {
  return storage.update('books', id, data);
}

export function deleteBook(id) {
  // cascade delete chapters, sessions, recall sessions, and cards
  const chapters = getChaptersByBook(id);
  for (const ch of chapters) {
    deleteChapterCascade(ch.id);
  }
  storage.remove('books', id);
}

// --- Chapters ---

export function getChaptersByBook(bookId) {
  return storage.query('chapters', (ch) => ch.bookId === bookId)
    .sort((a, b) => a.chapterNumber - b.chapterNumber);
}

export function getChapter(id) {
  return storage.getById('chapters', id);
}

export function createChapter({ bookId, title, chapterNumber }) {
  return storage.create('chapters', { bookId, title, chapterNumber, status: 'unread' });
}

export function updateChapter(id, data) {
  return storage.update('chapters', id, data);
}

function deleteChapterCascade(chapterId) {
  const sessions = storage.query('sessions', (s) => s.chapterId === chapterId);
  for (const s of sessions) {
    storage.query('recallSessions', (r) => r.sessionId === s.id)
      .forEach((r) => storage.remove('recallSessions', r.id));
    storage.remove('sessions', s.id);
  }
  storage.query('cards', (c) => c.chapterId === chapterId)
    .forEach((c) => storage.remove('cards', c.id));
  storage.remove('chapters', chapterId);
}

// --- Sessions ---

export function getSessionsByChapter(chapterId) {
  return storage.query('sessions', (s) => s.chapterId === chapterId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getSessionsByBook(bookId) {
  return storage.query('sessions', (s) => s.bookId === bookId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function createSession({ bookId, chapterId, pageStart, pageEnd, notes }) {
  const session = storage.create('sessions', { bookId, chapterId, pageStart, pageEnd, notes });
  updateChapter(chapterId, { status: 'logged' });
  return session;
}

// --- Recall Sessions ---

export function getRecallSessionsBySession(sessionId) {
  return storage.query('recallSessions', (r) => r.sessionId === sessionId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function createRecallSession({ sessionId, questions, answers, scores }) {
  const session = storage.getById('sessions', sessionId);
  if (session) {
    updateChapter(session.chapterId, { status: 'recalled' });
  }
  return storage.create('recallSessions', { sessionId, questions, answers, scores });
}

// --- Cards (Spaced Repetition) ---

export function getCardsByBook(bookId) {
  return storage.query('cards', (c) => c.bookId === bookId);
}

export function getCardsByChapter(chapterId) {
  return storage.query('cards', (c) => c.chapterId === chapterId);
}

export function getDueCards() {
  const now = new Date().toISOString();
  return storage.query('cards', (c) => c.nextReview <= now);
}

export function createCard({ bookId, chapterId, concept, explanation }) {
  return storage.create('cards', {
    bookId,
    chapterId,
    concept,
    explanation,
    nextReview: new Date().toISOString(),
    interval: 1,
    easeFactor: 2.5,
  });
}

export function updateCard(id, data) {
  return storage.update('cards', id, data);
}
