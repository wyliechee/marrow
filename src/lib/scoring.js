import { getChaptersByBook, getSessionsByChapter, getRecallSessionsBySession } from './db';

const BASELINE_SCORE = 0.35;
const DECAY_RATE = 0.05;
const NEVER_RECALLED_DECAY_RATE = 0.08;

function decay(days, rate) {
  return Math.exp(-rate * days);
}

function daysSince(dateStr) {
  return Math.max(0, (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function getChapterScore(chapterId) {
  const sessions = getSessionsByChapter(chapterId);
  if (sessions.length === 0) return null; // unread

  let latestRecall = null;
  let bestQuizScore = 0;

  for (const session of sessions) {
    const recalls = getRecallSessionsBySession(session.id);
    for (const recall of recalls) {
      const avg = recall.scores.reduce((a, b) => a + b, 0) / recall.scores.length;
      if (!latestRecall || new Date(recall.createdAt) > new Date(latestRecall.createdAt)) {
        latestRecall = recall;
        bestQuizScore = avg;
      }
    }
  }

  if (!latestRecall) {
    // logged but never recalled
    const days = daysSince(sessions[0].createdAt);
    return BASELINE_SCORE * decay(days, NEVER_RECALLED_DECAY_RATE);
  }

  const days = daysSince(latestRecall.createdAt);
  return bestQuizScore * decay(days, DECAY_RATE);
}

export function getBookScore(bookId) {
  const chapters = getChaptersByBook(bookId);
  const scores = chapters
    .map((ch) => getChapterScore(ch.id))
    .filter((s) => s !== null); // exclude unread

  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
