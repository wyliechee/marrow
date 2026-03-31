import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  getBook, getChapter,
  getSessionsByChapter, createSession,
  getRecallSessionsBySession,
  getCardsByChapter,
} from '../lib/db';
import { getChapterScore } from '../lib/scoring';
import RecallQuiz from '../components/RecallQuiz';

export default function ChapterDetail() {
  const { bookId, chapterId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [cards, setCards] = useState([]);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [notes, setNotes] = useState('');
  const [pageStart, setPageStart] = useState('');
  const [pageEnd, setPageEnd] = useState('');

  function reload() {
    setSessions(getSessionsByChapter(chapterId));
    setCards(getCardsByChapter(chapterId));
    setChapter(getChapter(chapterId));
  }

  useEffect(() => {
    const b = getBook(bookId);
    const c = getChapter(chapterId);
    if (!b || !c) return navigate(`/library/${bookId}`);
    setBook(b);
    setChapter(c);
    setSessions(getSessionsByChapter(chapterId));
    setCards(getCardsByChapter(chapterId));
  }, [bookId, chapterId, navigate]);

  if (!book || !chapter) return null;

  const chScore = getChapterScore(chapterId);

  function handleLog(e) {
    e.preventDefault();
    createSession({
      bookId,
      chapterId,
      pageStart: pageStart ? Number(pageStart) : null,
      pageEnd: pageEnd ? Number(pageEnd) : null,
      notes: notes.trim(),
    });
    setNotes('');
    setPageStart('');
    setPageEnd('');
    setShowLogForm(false);
    reload();
  }

  return (
    <div className="flex-1 px-5 pt-6 pb-6">
      {/* Back nav */}
      <Link
        to={`/library/${bookId}`}
        className="text-sm text-gray-400 no-underline flex items-center gap-1 mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        {book.title}
      </Link>

      {/* Chapter header */}
      <h1 className="text-xl font-semibold text-gray-900">
        Ch. {chapter.chapterNumber}: {chapter.title}
      </h1>
      <div className="flex items-center gap-3 mt-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          chapter.status === 'recalled' ? 'bg-green-50 text-green-600' :
          chapter.status === 'logged' ? 'bg-amber-50 text-amber-600' :
          'bg-gray-100 text-gray-500'
        }`}>
          {chapter.status}
        </span>
        {chScore !== null && (
          <span className="text-sm text-gray-500">Score: {Math.round(chScore * 100)}%</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-5">
        <button
          onClick={() => { setShowLogForm(!showLogForm); setShowQuiz(false); }}
          className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-accent text-white"
        >
          Log Reading
        </button>
        {sessions.length > 0 && (
          <button
            onClick={() => { setShowQuiz(!showQuiz); setShowLogForm(false); }}
            className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-accent text-accent"
          >
            Recall Quiz
          </button>
        )}
      </div>

      {/* Log form */}
      {showLogForm && (
        <form onSubmit={handleLog} className="mt-4 bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Start page"
              value={pageStart}
              onChange={(e) => setPageStart(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent"
            />
            <input
              type="number"
              placeholder="End page"
              value={pageEnd}
              onChange={(e) => setPageEnd(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <textarea
            placeholder="What did you read about? Key ideas, themes, characters..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent resize-none"
          />
          <button
            type="submit"
            className="w-full py-2 bg-accent text-white text-sm font-medium rounded-lg"
          >
            Save Session
          </button>
        </form>
      )}

      {/* Recall quiz */}
      {showQuiz && (
        <RecallQuiz
          bookId={bookId}
          chapterId={chapterId}
          sessions={sessions}
          onComplete={() => { setShowQuiz(false); reload(); }}
        />
      )}

      {/* Past sessions */}
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-8 mb-3">
        Reading Sessions ({sessions.length})
      </h2>
      {sessions.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">Log your first reading session above</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const recalls = getRecallSessionsBySession(s.id);
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(s.createdAt).toLocaleDateString()}
                    {s.pageStart && s.pageEnd ? ` · pp. ${s.pageStart}–${s.pageEnd}` : ''}
                  </span>
                  <span className="text-xs text-gray-400">
                    {recalls.length} recall{recalls.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {s.notes && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-3">{s.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cards */}
      {cards.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-8 mb-3">
            Flashcards ({cards.length})
          </h2>
          <div className="space-y-2">
            {cards.map((card) => (
              <div key={card.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-900">{card.concept}</p>
                <p className="text-sm text-gray-500 mt-1">{card.explanation}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
