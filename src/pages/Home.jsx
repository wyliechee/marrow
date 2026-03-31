import { Link } from 'react-router-dom';
import { getBooks, getDueCards, getChaptersByBook } from '../lib/db';
import { getBookScore } from '../lib/scoring';
import { useEffect, useState } from 'react';

function ScoreBadge({ score }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 70 ? 'text-green-600 bg-green-50' :
    pct >= 40 ? 'text-amber-600 bg-amber-50' :
    'text-red-500 bg-red-50';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {pct}%
    </span>
  );
}

export default function Home() {
  const [books, setBooks] = useState([]);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    setBooks(getBooks().filter((b) => b.status === 'reading'));
    setDueCount(getDueCards().length);
  }, []);

  const totalChapters = books.reduce((sum, b) => sum + getChaptersByBook(b.id).length, 0);
  const loggedChapters = books.reduce(
    (sum, b) => sum + getChaptersByBook(b.id).filter((c) => c.status !== 'unread').length,
    0,
  );

  return (
    <div className="flex-1 px-5 pt-8 pb-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-gray-900">Marrow</h1>
      <p className="text-gray-500 text-sm mt-1">Your reading companion</p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-semibold text-gray-900">{books.length}</p>
          <p className="text-xs text-gray-500 mt-1">Reading</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-semibold text-gray-900">
            {totalChapters > 0 ? Math.round((loggedChapters / totalChapters) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Logged</p>
        </div>
        <Link to="/review" className="bg-accent/10 rounded-xl p-4 border border-accent/20 no-underline">
          <p className="text-2xl font-semibold text-accent">{dueCount}</p>
          <p className="text-xs text-accent/70 mt-1">Due cards</p>
        </Link>
      </div>

      {/* Currently reading */}
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-8 mb-3">
        Currently Reading
      </h2>

      {books.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-gray-400 text-sm">No books yet</p>
          <Link
            to="/library"
            className="inline-block mt-3 text-sm font-medium text-accent hover:text-accent-dark"
          >
            Add your first book
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {books.map((book) => {
            const chapters = getChaptersByBook(book.id);
            const logged = chapters.filter((c) => c.status !== 'unread').length;
            const score = getBookScore(book.id);
            return (
              <Link
                key={book.id}
                to={`/library/${book.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 no-underline"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{book.title}</p>
                    <p className="text-sm text-gray-500 truncate">{book.author}</p>
                  </div>
                  <ScoreBadge score={score} />
                </div>
                {chapters.length > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{logged}/{chapters.length} chapters</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${(logged / chapters.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
