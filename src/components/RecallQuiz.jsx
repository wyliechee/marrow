import { useState } from 'react';
import { getBook, getChapter, createRecallSession, createCard } from '../lib/db';
import { generateRecallQuestions, scoreAnswer, generateFlashcards, hasApiKey } from '../lib/ai';
import ApiKeyPrompt from './ApiKeyPrompt';

export default function RecallQuiz({ bookId, chapterId, sessions, onComplete }) {
  const [stage, setStage] = useState('start'); // start | loading | quiz | scoring | results
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [scores, setScores] = useState([]);
  const [results, setResults] = useState([]); // {covered, gaps} per question
  const [error, setError] = useState(null);

  if (!hasApiKey()) {
    return <ApiKeyPrompt onSaved={() => setStage('start')} />;
  }

  const book = getBook(bookId);
  const chapter = getChapter(chapterId);
  const allNotes = sessions.map((s) => s.notes).filter(Boolean).join('\n');

  async function startQuiz() {
    setStage('loading');
    setError(null);
    try {
      const qs = await generateRecallQuestions(book.title, chapter.title, allNotes);
      setQuestions(qs);
      setCurrentQ(0);
      setAnswers([]);
      setScores([]);
      setResults([]);
      setStage('quiz');
    } catch (err) {
      setError(err.message);
      setStage('start');
    }
  }

  async function submitAnswer() {
    if (!currentAnswer.trim()) return;
    const newAnswers = [...answers, currentAnswer.trim()];
    setAnswers(newAnswers);
    setCurrentAnswer('');
    setStage('scoring');

    try {
      const result = await scoreAnswer(
        questions[currentQ], currentAnswer.trim(),
        book.title, chapter.title, allNotes,
      );
      const newScores = [...scores, result.score];
      const newResults = [...results, { covered: result.covered || [], gaps: result.gaps || [] }];
      setScores(newScores);
      setResults(newResults);

      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setStage('quiz');
      } else {
        // Quiz complete — save results
        createRecallSession({
          sessionId: sessions[0].id,
          questions,
          answers: newAnswers,
          scores: newScores,
        });

        // Generate flashcards
        try {
          const cards = await generateFlashcards(book.title, chapter.title, allNotes);
          for (const card of cards) {
            createCard({ bookId, chapterId, concept: card.concept, explanation: card.explanation });
          }
        } catch {
          // Flashcard generation is best-effort
        }

        setStage('results');
      }
    } catch (err) {
      setError(err.message);
      setStage('quiz');
    }
  }

  if (stage === 'start') {
    return (
      <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-6 text-center">
        <p className="text-sm text-gray-600 mb-4">
          Test your recall of this chapter with 3 AI-generated questions.
        </p>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <button onClick={startQuiz} className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-xl">
          Start recall
        </button>
      </div>
    );
  }

  if (stage === 'loading' || stage === 'scoring') {
    return (
      <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">
          {stage === 'loading' ? 'Generating questions...' : 'Reviewing your answer...'}
        </p>
      </div>
    );
  }

  if (stage === 'quiz') {
    return (
      <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-400">Question {currentQ + 1} of {questions.length}</span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < currentQ ? 'bg-accent' : i === currentQ ? 'bg-accent/50' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-4">{questions[currentQ]}</p>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <textarea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder="Type your answer..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent resize-none"
          autoFocus
        />
        <button
          onClick={submitAnswer}
          disabled={!currentAnswer.trim()}
          className="w-full mt-3 py-2.5 bg-accent text-white text-sm font-medium rounded-xl disabled:opacity-40"
        >
          Submit
        </button>
      </div>
    );
  }

  if (stage === 'results') {
    return (
      <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-medium text-gray-900 mb-1">Recall complete</p>
        <p className="text-xs text-gray-500 mb-5">
          Here's what you remembered and what's worth revisiting.
        </p>

        <div className="space-y-5">
          {questions.map((q, i) => (
            <div key={i} className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-900">{q}</p>
              <p className="text-sm text-gray-500 mt-1 italic">{answers[i]}</p>

              {/* What you covered */}
              {results[i]?.covered?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-green-700 mb-1">What you covered</p>
                  <ul className="space-y-0.5">
                    {results[i].covered.map((item, j) => (
                      <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">+</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gaps to revisit */}
              {results[i]?.gaps?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-amber-700 mb-1">Worth revisiting</p>
                  <ul className="space-y-0.5">
                    {results[i].gaps.map((item, j) => (
                      <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">~</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onComplete}
          className="w-full mt-5 py-2.5 bg-accent text-white text-sm font-medium rounded-xl"
        >
          Done
        </button>
      </div>
    );
  }

  return null;
}
