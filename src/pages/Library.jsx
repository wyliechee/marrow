import { Link } from 'react-router-dom';
import { getBooks, createBook } from '../lib/db';
import { getBookScore } from '../lib/scoring';
import { useState } from 'react';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'reading', label: 'Reading' },
  { key: 'done', label: 'Done' },
];

export default function Library() {
  const [books, setBooks] = useState(() => getBooks());
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    createBook({ title: title.trim(), author: author.trim(), description: description.trim() });
    setBooks(getBooks());
    setTitle('');
    setAuthor('');
    setDescription('');
    setShowForm(false);
  }

  const filtered = books
    .filter((b) => filter === 'all' || b.status === filter)
    .filter((b) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    });

  return (
    <div className="flex-1 px-5 pt-8 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Library</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-accent text-white text-xl leading-none"
        >
          {showForm ? '\u00d7' : '+'}
        </button>
      </div>

      {/* Search */}
      <div className="mt-4 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder="Search books..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-accent"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mt-3 bg-gray-100 rounded-xl p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            {f.label}
          </button>
        ))}
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
          <textarea
            placeholder="Brief description (optional \u2014 helps AI generate better questions for niche books)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent resize-none"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-accent text-white text-sm font-medium rounded-xl"
          >
            Add Book
          </button>
        </form>
      )}

      {/* Book list */}
      <div className="mt-4 space-y-2">
        {filtered.map((book) => {
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
                <p className="font-medium text-gray-900 truncate">
                  {search.trim() ? highlightMatch(book.title, search) : book.title}
                </p>
                <p className="text-sm text-gray-500 truncate">{book.author}</p>
              </div>
              <span className={`text-sm font-semibold ml-3 ${color}`}>{pct}%</span>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && !showForm && (
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">
            {books.length === 0 ? 'Your library is empty' : 'No books match your search'}
          </p>
          {books.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm font-medium text-accent"
            >
              Add your first book
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function highlightMatch(text, query) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-accent font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
