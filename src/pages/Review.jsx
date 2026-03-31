import { useState, useEffect } from 'react';
import { getDueCards, updateCard, getBook } from '../lib/db';

function nextReview(quality, card) {
  // SM-2 algorithm: quality 0-5
  let { interval, easeFactor } = card;

  if (quality < 3) {
    interval = 1; // reset
  } else {
    if (interval === 1) interval = 1;
    else if (interval <= 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return { interval, easeFactor, nextReview: next.toISOString() };
}

export default function Review() {
  const [dueCards, setDueCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDueCards(getDueCards());
  }, []);

  function handleRate(quality) {
    const card = dueCards[currentIdx];
    const updates = nextReview(quality, card);
    updateCard(card.id, updates);

    if (currentIdx < dueCards.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setFlipped(false);
    } else {
      setDone(true);
    }
  }

  function handleRestart() {
    setDueCards(getDueCards());
    setCurrentIdx(0);
    setFlipped(false);
    setDone(false);
  }

  if (done) {
    return (
      <div className="flex-1 px-5 pt-8 pb-6 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">All caught up!</h2>
        <p className="text-sm text-gray-500 mt-1">No more cards to review right now.</p>
        <button
          onClick={handleRestart}
          className="mt-6 px-6 py-2 text-sm font-medium text-accent border border-accent rounded-lg"
        >
          Check Again
        </button>
      </div>
    );
  }

  if (dueCards.length === 0) {
    return (
      <div className="flex-1 px-5 pt-8 pb-6 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">No cards due</h2>
        <p className="text-sm text-gray-500 mt-1">Start logging and quizzing chapters to generate cards.</p>
      </div>
    );
  }

  const card = dueCards[currentIdx];
  const book = getBook(card.bookId);

  return (
    <div className="flex-1 px-5 pt-8 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Review</h1>
        <span className="text-sm text-gray-400">{currentIdx + 1} / {dueCards.length}</span>
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="bg-white rounded-2xl border border-gray-100 p-6 min-h-[200px] flex flex-col justify-center cursor-pointer select-none"
      >
        {!flipped ? (
          <>
            <p className="text-lg font-medium text-gray-900 text-center">{card.concept}</p>
            <p className="text-xs text-gray-400 text-center mt-4">Tap to reveal</p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-700 text-center">{card.explanation}</p>
            {book && (
              <p className="text-xs text-gray-400 text-center mt-4">{book.title}</p>
            )}
          </>
        )}
      </div>

      {/* Rating buttons — encouraging language per design */}
      {flipped && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => handleRate(1)}
            className="py-3.5 rounded-xl bg-amber-50 text-amber-700 text-sm font-medium"
          >
            Still learning
          </button>
          <button
            onClick={() => handleRate(5)}
            className="py-3.5 rounded-xl bg-green-50 text-green-700 text-sm font-medium"
          >
            Knew it
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-6 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${((currentIdx + 1) / dueCards.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
