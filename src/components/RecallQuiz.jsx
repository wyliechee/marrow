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
  const [feedbacks, setFeedbacks] = useState([]);
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
      setFeedbacks([]);
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
      const newFeedbacks = [...feedbacks, result.feedback];
      setScores(newScores);
      setFeedbacks(newFeedbacks);

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
      <div className="mt-4 bg-white rounded-xl border border-gray-100 p-6 text-center">
        <p className="text-sm text-gray-600 mb-4">
          Test your recall of this chapter with 3 AI-generated questions.
        </p>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <button onClick={startQuiz} className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-lg">
          Start Quiz
        </button>
      </div>
    );
  }

  if (stage === 'loading' || stage === 'scoring') {
    return (
      <div className="mt-4 bg-white rounded-xl border border-gray-100 p-8 text-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">
          {stage === 'loading' ? 'Generating questions...' : 'Evaluating answer...'}
        </p>
      </div>
    );
  }

  if (stage === 'quiz') {
    return (
      <div className="mt-4 bg-white rounded-xl border border-gray-100 p-5">
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
          className="w-full mt-3 py-2 bg-accent text-white text-sm font-medium rounded-lg disabled:opacity-40"
        >
          Submit Answer
        </button>
      </div>
    );
  }

  if (stage === 'results') {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    return (
      <div className="mt-4 bg-white rounded-xl border border-gray-100 p-5">
        <div className="text-center mb-5">
          <p className="text-3xl font-semibold text-accent">{Math.round(avgScore * 100)}%</p>
          <p className="text-sm text-gray-500 mt-1">Recall Score</p>
        </div>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="border-t border-gray-100 pt-3">
              <p className="text-sm font-medium text-gray-900">{q}</p>
              <p className="text-sm text-gray-600 mt-1">{answers[i]}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  scores[i] >= 0.7 ? 'bg-green-50 text-green-600' :
                  scores[i] >= 0.4 ? 'bg-amber-50 text-amber-600' :
                  'bg-red-50 text-red-500'
                }`}>
                  {Math.round(scores[i] * 100)}%
                </span>
                <span className="text-xs text-gray-400">{feedbacks[i]}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onComplete}
          className="w-full mt-5 py-2 bg-accent text-white text-sm font-medium rounded-lg"
        >
          Done
        </button>
      </div>
    );
  }

  return null;
}
