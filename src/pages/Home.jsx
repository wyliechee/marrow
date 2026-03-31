import { Link, useNavigate } from 'react-router-dom';
import { getBooks, getDueCards, getChaptersByBook, getSessionsByBook } from '../lib/db';
import { getBookScore } from '../lib/scoring';
import { useEffect, useState } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    setBooks(getBooks().filter((b) => b.status === 'reading'));
    setDueCount(getDueCards().length);
  }, []);

  // Find the most recently active book for "continue reading"
  const continueBook = books.length > 0
    ? books.reduce((best, book) => {
        const sessions = getSessionsByBook(book.id);
        const latest = sessions.length > 0 ? new Date(sessions[0].createdAt) : new Date(book.createdAt);
        const bestSessions = getSessionsByBook(best.id);
        const bestLatest = bestSessions.length > 0 ? new Date(bestSessions[0].createdAt) : new Date(best.createdAt);
        return latest > bestLatest ? book : best;
      })
    : null;

  const continueChapters = continueBook ? getChaptersByBook(continueBook.id) : [];
  const currentChapter = continueChapters.find((ch) => ch.status === 'unread')
    || continueChapters[continueChapters.length - 1];

  return (
    <div className="flex-1 px-6 pt-10 pb-6 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ color: '#37352f' }}>Marrow</h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#9b9a97' }}>Your reading companion</p>
        </div>
        <Link to="/settings" className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors" style={{ color: '#9b9a97' }}>
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </Link>
      </div>

      {/* Continue reading card */}
      {continueBook ? (
        <div className="mt-7 rounded-lg p-5" style={{ background: '#fbfbfa', border: '1px solid #e9e9e7' }}>
          <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: '#9b9a97' }}>Continue reading</p>
          <p className="text-base font-medium mt-2.5" style={{ color: '#37352f' }}>{continueBook.title}</p>
          <p className="text-[13px] mt-0.5" style={{ color: '#787774' }}>{continueBook.author}</p>
          {currentChapter && (
            <p className="text-[13px] mt-1" style={{ color: '#9b9a97' }}>
              Ch. {currentChapter.chapterNumber}: {currentChapter.title}
            </p>
          )}
          <button
            onClick={() => navigate(
              currentChapter
                ? `/library/${continueBook.id}/chapter/${currentChapter.id}`
                : `/library/${continueBook.id}`
            )}
            className="mt-4 w-full py-2 text-[13px] font-medium rounded-md transition-colors"
            style={{ background: '#37352f', color: '#fff' }}
          >
            Log reading
          </button>
        </div>
      ) : (
        <div className="mt-7 rounded-lg p-10 text-center" style={{ background: '#fbfbfa', border: '1px solid #e9e9e7' }}>
          <p className="text-[13px]" style={{ color: '#9b9a97' }}>No books yet</p>
          <Link
            to="/library"
            className="inline-block mt-3 text-[13px] font-medium no-underline"
            style={{ color: '#5160C8' }}
          >
            Add your first book
          </Link>
        </div>
      )}

      {/* Daily review prompt */}
      {dueCount > 0 && (
        <Link
          to="/review"
          className="mt-3 flex items-center justify-between rounded-lg p-4 no-underline transition-colors hover:opacity-90"
          style={{ background: '#f0f1fa', border: '1px solid #e0e2f0' }}
        >
          <div>
            <p className="text-[13px] font-medium" style={{ color: '#37352f' }}>Daily review</p>
            <p className="text-[12px] mt-0.5" style={{ color: '#787774' }}>
              {dueCount} card{dueCount !== 1 ? 's' : ''} ready for review
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: '#5160C8' }}>{dueCount}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5160C8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>
      )}

      {/* Book list */}
      {books.length > 1 && (
        <>
          <p className="text-[11px] uppercase tracking-widest font-medium mt-9 mb-3" style={{ color: '#9b9a97' }}>
            All books
          </p>
          <div className="space-y-px">
            {books.map((book) => {
              const chapters = getChaptersByBook(book.id);
              const logged = chapters.filter((c) => c.status !== 'unread').length;
              const score = getBookScore(book.id);
              const pct = Math.round(score * 100);
              const scoreColor = pct >= 70 ? '#2d8a56' : pct >= 40 ? '#c2850a' : '#9b9a97';
              return (
                <Link
                  key={book.id}
                  to={`/library/${book.id}`}
                  className="flex items-center justify-between rounded-md px-3 py-3 no-underline hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium truncate" style={{ color: '#37352f' }}>{book.title}</p>
                    <p className="text-[12px] truncate" style={{ color: '#9b9a97' }}>{book.author}</p>
                    {chapters.length > 0 && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: '#e9e9e7' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(logged / chapters.length) * 100}%`, background: '#5160C8' }}
                          />
                        </div>
                        <span className="text-[11px]" style={{ color: '#9b9a97' }}>{logged}/{chapters.length}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[13px] font-medium ml-4" style={{ color: scoreColor }}>{pct}%</span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
