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
    unread: '#d3d3d0',
    logged: '#c2850a',
    recalled: '#2d8a56',
  };
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[status] || colors.unread }} />;
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
    <div className="flex-1 px-6 pt-6 pb-6 max-w-lg mx-auto w-full">
      {/* Back nav */}
      <Link to="/library" className="text-[13px] no-underline flex items-center gap-1 mb-5" style={{ color: '#9b9a97' }}>
        <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Library
      </Link>

      {/* Book header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-semibold" style={{ color: '#37352f' }}>{book.title}</h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#787774' }}>{book.author}</p>
        </div>
        <span className="text-[16px] font-semibold ml-3" style={{ color: '#5160C8' }}>{Math.round(score * 100)}%</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-5">
        <button
          onClick={handleToggleStatus}
          className="flex-1 py-[7px] text-[13px] font-medium rounded-md transition-colors"
          style={{ border: '1px solid #e9e9e7', color: '#37352f', background: '#fff' }}
        >
          Mark as {book.status === 'reading' ? 'finished' : 'reading'}
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-[7px] text-[13px] font-medium rounded-md transition-colors"
          style={{ border: '1px solid #f0d4d4', color: '#c4554d', background: '#fff' }}
        >
          Delete
        </button>
      </div>

      {/* Chapters */}
      <div className="flex items-center justify-between mt-9">
        <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: '#9b9a97' }}>
          Chapters ({chapters.length})
        </p>
        <button
          onClick={() => setShowAddChapter(!showAddChapter)}
          className="text-[13px] font-medium"
          style={{ color: showAddChapter ? '#9b9a97' : '#5160C8' }}
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
            className="flex-1 px-3 py-[7px] rounded-md text-[13px] focus:outline-none"
            style={{ border: '1px solid #e9e9e7', color: '#37352f' }}
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-[7px] text-[13px] font-medium rounded-md"
            style={{ background: '#37352f', color: '#fff' }}
          >
            Add
          </button>
        </form>
      )}

      <div className="mt-3">
        {chapters.map((ch) => {
          const chScore = getChapterScore(ch.id);
          const sessions = getSessionsByChapter(ch.id);
          return (
            <Link
              key={ch.id}
              to={`/library/${bookId}/chapter/${ch.id}`}
              className="flex items-center gap-3 rounded-md px-3 py-3 no-underline hover:bg-gray-50 transition-colors"
            >
              <ChapterStatusDot status={ch.status} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate" style={{ color: '#37352f' }}>
                  {ch.chapterNumber}. {ch.title}
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: '#9b9a97' }}>
                  {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                  {chScore !== null ? ` \u00b7 ${Math.round(chScore * 100)}%` : ''}
                </p>
              </div>
              <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#d3d3d0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          );
        })}
        {chapters.length === 0 && (
          <p className="text-center text-[13px] py-8" style={{ color: '#9b9a97' }}>No chapters yet — add one above</p>
        )}
      </div>
    </div>
  );
}
