import { useState, useEffect } from 'react';
import { getDueCards, updateCard, getBook } from '../lib/db';

function nextReview(quality, card) {
  let { interval, easeFactor } = card;
  if (quality < 3) {
    interval = 1;
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
      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: '#dbeddb' }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#2d8a56">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-[17px] font-semibold" style={{ color: '#37352f' }}>All caught up!</h2>
        <p className="text-[13px] mt-1" style={{ color: '#9b9a97' }}>No more cards to review right now.</p>
        <button
          onClick={handleRestart}
          className="mt-6 px-5 py-[7px] text-[13px] font-medium rounded-md"
          style={{ border: '1px solid #e9e9e7', color: '#37352f' }}
        >
          Check Again
        </button>
      </div>
    );
  }

  if (dueCards.length === 0) {
    return (
      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: '#f1f1ef' }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#9b9a97">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </div>
        <h2 className="text-[17px] font-semibold" style={{ color: '#37352f' }}>No cards due</h2>
        <p className="text-[13px] mt-1" style={{ color: '#9b9a97' }}>Start logging and quizzing chapters to generate cards.</p>
      </div>
    );
  }

  const card = dueCards[currentIdx];
  const book = getBook(card.bookId);

  return (
    <div className="flex-1 px-6 pt-10 pb-6 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-semibold" style={{ color: '#37352f' }}>Review</h1>
        <span className="text-[13px]" style={{ color: '#9b9a97' }}>{currentIdx + 1} / {dueCards.length}</span>
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="rounded-lg p-7 min-h-[200px] flex flex-col justify-center cursor-pointer select-none transition-colors"
        style={{ background: '#fbfbfa', border: '1px solid #e9e9e7' }}
      >
        {!flipped ? (
          <>
            <p className="text-[16px] font-medium text-center" style={{ color: '#37352f' }}>{card.concept}</p>
            <p className="text-[12px] text-center mt-5" style={{ color: '#c3c2bf' }}>Tap to reveal</p>
          </>
        ) : (
          <>
            <p className="text-[14px] text-center leading-relaxed" style={{ color: '#37352f' }}>{card.explanation}</p>
            {book && (
              <p className="text-[12px] text-center mt-5" style={{ color: '#c3c2bf' }}>{book.title}</p>
            )}
          </>
        )}
      </div>

      {/* Rating buttons */}
      {flipped && (
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <button
            onClick={() => handleRate(1)}
            className="py-3 rounded-md text-[13px] font-medium transition-colors"
            style={{ background: '#fdecc8', color: '#9a6700' }}
          >
            Still learning
          </button>
          <button
            onClick={() => handleRate(5)}
            className="py-3 rounded-md text-[13px] font-medium transition-colors"
            style={{ background: '#dbeddb', color: '#2d8a56' }}
          >
            Knew it
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-6 h-[3px] rounded-full overflow-hidden" style={{ background: '#e9e9e7' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${((currentIdx + 1) / dueCards.length) * 100}%`, background: '#5160C8' }}
        />
      </div>
    </div>
  );
}
