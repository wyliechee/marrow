import { Link } from 'react-router-dom';
import { getBooks, createBook } from '../lib/db';
import { getBookScore } from '../lib/scoring';
import { useState } from 'react';

export default function Library() {
  const [books, setBooks] = useState(() => getBooks());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    createBook({ title: title.trim(), author: author.trim() });
    setBooks(getBooks());
    setTitle('');
    setAuthor('');
    setShowForm(false);
  }

  const reading = books.filter((b) => b.status === 'reading');
  const done = books.filter((b) => b.status === 'done');

  return (
    <div className="flex-1 px-5 pt-8 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Library</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-accent text-white text-xl leading-none"
        >
          {showForm ? '×' : '+'}
        </button>
      </div>

      {/* Add book form */}
      {showForm && (
        <form onSubmit={handleAdd} className="mt-4 bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <input
            type="text"
            placeholder="Book title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent"
            autoFocus
          />
          <input
            type="text"
            placeholder="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="w-full py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-dark transition-colors"
          >
            Add Book
          </button>
        </form>
      )}

      {/* Reading section */}
      <BookSection label="Reading" books={reading} />

      {/* Done section */}
      {done.length > 0 && <BookSection label="Finished" books={done} />}

      {books.length === 0 && !showForm && (
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">Your library is empty</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm font-medium text-accent"
          >
            Add your first book
          </button>
        </div>
      )}
    </div>
  );
}

function BookSection({ label, books }) {
  if (books.length === 0) return null;
  return (
    <>
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-6 mb-3">
        {label}
      </h2>
      <div className="space-y-2">
        {books.map((book) => {
          const score = getBookScore(book.id);
          const pct = Math.round(score * 100);
          return (
            <Link
              key={book.id}
              to={`/library/${book.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4 no-underline"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{book.title}</p>
                <p className="text-sm text-gray-500 truncate">{book.author}</p>
              </div>
              <span className="text-sm font-medium text-gray-400 ml-3">{pct}%</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
