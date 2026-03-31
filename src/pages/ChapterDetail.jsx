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

const statusStyle = {
  recalled: { background: '#dbeddb', color: '#2d8a56' },
  logged: { background: '#fdecc8', color: '#9a6700' },
  unread: { background: '#f1f1ef', color: '#787774' },
};

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
  const sty = statusStyle[chapter.status] || statusStyle.unread;

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
    <div className="flex-1 px-6 pt-6 pb-6 max-w-lg mx-auto w-full">
      {/* Back nav */}
      <Link
        to={`/library/${bookId}`}
        className="text-[13px] no-underline flex items-center gap-1 mb-5"
        style={{ color: '#9b9a97' }}
      >
        <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        {book.title}
      </Link>

      {/* Chapter header */}
      <h1 className="text-[20px] font-semibold" style={{ color: '#37352f' }}>
        Ch. {chapter.chapterNumber}: {chapter.title}
      </h1>
      <div className="flex items-center gap-3 mt-2">
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-sm"
          style={sty}
        >
          {chapter.status}
        </span>
        {chScore !== null && (
          <span className="text-[12px]" style={{ color: '#787774' }}>Score: {Math.round(chScore * 100)}%</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-5">
        <button
          onClick={() => { setShowLogForm(!showLogForm); setShowQuiz(false); }}
          className="flex-1 py-[8px] text-[13px] font-medium rounded-md transition-colors"
          style={{ background: '#37352f', color: '#fff' }}
        >
          Log Reading
        </button>
        {sessions.length > 0 && (
          <button
            onClick={() => { setShowQuiz(!showQuiz); setShowLogForm(false); }}
            className="flex-1 py-[8px] text-[13px] font-medium rounded-md transition-colors"
            style={{ border: '1px solid #e9e9e7', color: '#5160C8', background: '#fff' }}
          >
            Recall Quiz
          </button>
        )}
      </div>

      {/* Log form */}
      {showLogForm && (
        <form onSubmit={handleLog} className="mt-4 rounded-lg p-4 space-y-2.5" style={{ background: '#fbfbfa', border: '1px solid #e9e9e7' }}>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Start page"
              value={pageStart}
              onChange={(e) => setPageStart(e.target.value)}
              className="flex-1 px-3 py-[7px] rounded-md text-[13px] focus:outline-none"
              style={{ border: '1px solid #e9e9e7', color: '#37352f' }}
            />
            <input
              type="number"
              placeholder="End page"
              value={pageEnd}
              onChange={(e) => setPageEnd(e.target.value)}
              className="flex-1 px-3 py-[7px] rounded-md text-[13px] focus:outline-none"
              style={{ border: '1px solid #e9e9e7', color: '#37352f' }}
            />
          </div>
          <textarea
            placeholder="What did you read about? Key ideas, themes, characters..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-[7px] rounded-md text-[13px] focus:outline-none resize-none"
            style={{ border: '1px solid #e9e9e7', color: '#37352f' }}
          />
          <button
            type="submit"
            className="w-full py-[7px] text-[13px] font-medium rounded-md"
            style={{ background: '#37352f', color: '#fff' }}
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
      <p className="text-[11px] uppercase tracking-widest font-medium mt-9 mb-3" style={{ color: '#9b9a97' }}>
        Reading Sessions ({sessions.length})
      </p>
      {sessions.length === 0 ? (
        <p className="text-center text-[13px] py-8" style={{ color: '#9b9a97' }}>Log your first reading session above</p>
      ) : (
        <div className="space-y-px">
          {sessions.map((s) => {
            const recalls = getRecallSessionsBySession(s.id);
            return (
              <div key={s.id} className="rounded-md px-3 py-3" style={{ background: '#fbfbfa' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: '#9b9a97' }}>
                    {new Date(s.createdAt).toLocaleDateString()}
                    {s.pageStart && s.pageEnd ? ` \u00b7 pp. ${s.pageStart}\u2013${s.pageEnd}` : ''}
                  </span>
                  <span className="text-[12px]" style={{ color: '#9b9a97' }}>
                    {recalls.length} recall{recalls.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {s.notes && (
                  <p className="text-[13px] mt-1.5 line-clamp-3" style={{ color: '#37352f' }}>{s.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cards */}
      {cards.length > 0 && (
        <>
          <p className="text-[11px] uppercase tracking-widest font-medium mt-9 mb-3" style={{ color: '#9b9a97' }}>
            Flashcards ({cards.length})
          </p>
          <div className="space-y-px">
            {cards.map((card) => (
              <div key={card.id} className="rounded-md px-3 py-3" style={{ background: '#fbfbfa' }}>
                <p className="text-[13px] font-medium" style={{ color: '#37352f' }}>{card.concept}</p>
                <p className="text-[13px] mt-0.5" style={{ color: '#787774' }}>{card.explanation}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
