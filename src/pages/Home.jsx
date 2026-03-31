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
    <div className="flex-1 px-5 pt-8 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Marrow</h1>
          <p className="text-gray-500 text-sm mt-1">Your reading companion</p>
        </div>
        <Link to="/settings" className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </Link>
      </div>

      {/* Continue reading card */}
      {continueBook ? (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Continue reading</p>
          <p className="text-lg font-semibold text-gray-900 mt-2">{continueBook.title}</p>
          <p className="text-sm text-gray-500">{continueBook.author}</p>
          {currentChapter && (
            <p className="text-sm text-gray-400 mt-1">
              Ch. {currentChapter.chapterNumber}: {currentChapter.title}
            </p>
          )}
          <button
            onClick={() => navigate(
              currentChapter
                ? `/library/${continueBook.id}/chapter/${currentChapter.id}`
                : `/library/${continueBook.id}`
            )}
            className="mt-4 w-full py-2.5 bg-accent text-white text-sm font-medium rounded-xl"
          >
            Log reading
          </button>
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-gray-400 text-sm">No books yet</p>
          <Link
            to="/library"
            className="inline-block mt-3 text-sm font-medium text-accent"
          >
            Add your first book
          </Link>
        </div>
      )}

      {/* Daily review prompt */}
      {dueCount > 0 && (
        <Link
          to="/review"
          className="mt-4 flex items-center justify-between bg-accent/5 rounded-2xl border border-accent/15 p-5 no-underline"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">Daily review</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {dueCount} card{dueCount !== 1 ? 's' : ''} ready for review
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-accent">{dueCount}</span>
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>
      )}

      {/* Book list */}
      {books.length > 1 && (
        <>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-8 mb-3">
            All books
          </h2>
          <div className="space-y-2">
            {books.map((book) => {
              const chapters = getChaptersByBook(book.id);
              const logged = chapters.filter((c) => c.status !== 'unread').length;
              const score = getBookScore(book.id);
              const pct = Math.round(score * 100);
              const color = pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-gray-400';
              return (
                <Link
                  key={book.id}
                  to={`/library/${book.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4 no-underline"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{book.title}</p>
                    <p className="text-sm text-gray-500 truncate">{book.author}</p>
                    {chapters.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${(logged / chapters.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{logged}/{chapters.length}</span>
                      </div>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ml-4 ${color}`}>{pct}%</span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
