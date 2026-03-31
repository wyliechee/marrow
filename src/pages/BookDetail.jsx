import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  getBook, updateBook, deleteBook,
  getChaptersByBook, createChapter,
  getSessionsByChapter,
} from '../lib/db';
import { getBookScore, getChapterScore } from '../lib/scoring';

function ChapterStatusDot({ status }) {
  const colors = {
    unread: 'bg-gray-200',
    logged: 'bg-amber-400',
    recalled: 'bg-green-500',
  };
  return <span className={`w-2.5 h-2.5 rounded-full ${colors[status] || colors.unread}`} />;
}

export default function BookDetail() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');

  useEffect(() => {
    const b = getBook(bookId);
    if (!b) return navigate('/library');
    setBook(b);
    setChapters(getChaptersByBook(bookId));
  }, [bookId, navigate]);

  if (!book) return null;

  const score = getBookScore(bookId);

  function handleAddChapter(e) {
    e.preventDefault();
    if (!chapterTitle.trim()) return;
    createChapter({
      bookId,
      title: chapterTitle.trim(),
      chapterNumber: chapters.length + 1,
    });
    setChapters(getChaptersByBook(bookId));
    setChapterTitle('');
    setShowAddChapter(false);
  }

  function handleToggleStatus() {
    const newStatus = book.status === 'reading' ? 'done' : 'reading';
    updateBook(bookId, { status: newStatus });
    setBook({ ...book, status: newStatus });
  }

  function handleDelete() {
    if (window.confirm(`Delete "${book.title}" and all its data?`)) {
      deleteBook(bookId);
      navigate('/library');
    }
  }

  return (
    <div className="flex-1 px-5 pt-6 pb-6">
      {/* Back nav */}
      <Link to="/library" className="text-sm text-gray-400 no-underline flex items-center gap-1 mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Library
      </Link>

      {/* Book header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900">{book.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>
        </div>
        <span className="text-lg font-semibold text-accent ml-3">{Math.round(score * 100)}%</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleToggleStatus}
          className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700"
        >
          Mark as {book.status === 'reading' ? 'finished' : 'reading'}
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-500"
        >
          Delete
        </button>
      </div>

      {/* Chapters */}
      <div className="flex items-center justify-between mt-8">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Chapters ({chapters.length})
        </h2>
        <button
          onClick={() => setShowAddChapter(!showAddChapter)}
          className="text-sm font-medium text-accent"
        >
          {showAddChapter ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showAddChapter && (
        <form onSubmit={handleAddChapter} className="flex gap-2 mt-3">
          <input
            type="text"
            placeholder="Chapter title"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg"
          >
            Add
          </button>
        </form>
      )}

      <div className="mt-3 space-y-2">
        {chapters.map((ch) => {
          const chScore = getChapterScore(ch.id);
          const sessions = getSessionsByChapter(ch.id);
          return (
            <Link
              key={ch.id}
              to={`/library/${bookId}/chapter/${ch.id}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 no-underline"
            >
              <ChapterStatusDot status={ch.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {ch.chapterNumber}. {ch.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                  {chScore !== null ? ` · ${Math.round(chScore * 100)}%` : ''}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          );
        })}
        {chapters.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-6">No chapters yet — add one above</p>
        )}
      </div>
    </div>
  );
}
