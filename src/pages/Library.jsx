import { Link } from 'react-router-dom';
import { getBooks, createBook, createChapter } from '../lib/db';
import { getBookScore } from '../lib/scoring';
import { detectChapters, hasApiKey } from '../lib/ai';
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
  const [adding, setAdding] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim() || adding) return;
    setAdding(true);
    const book = createBook({ title: title.trim(), author: author.trim(), description: description.trim() });

    // Auto-detect chapters via AI
    if (hasApiKey() && author.trim()) {
      try {
        const chapters = await detectChapters(title.trim(), author.trim());
        if (Array.isArray(chapters)) {
          chapters.forEach((ch, i) => {
            const name = typeof ch === 'string' ? ch : ch.title || ch.name || `Chapter ${i + 1}`;
            createChapter({ bookId: book.id, title: name, chapterNumber: i + 1 });
          });
        }
      } catch {
        // Chapter detection is best-effort — book is still added
      }
    }

    setBooks(getBooks());
    setTitle('');
    setAuthor('');
    setDescription('');
    setShowForm(false);
    setAdding(false);
  }

  const filtered = books
    .filter((b) => filter === 'all' || b.status === filter)
    .filter((b) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    });

  return (
    <div className="flex-1 px-6 pt-10 pb-6 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold" style={{ color: '#37352f' }}>Library</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-[18px] leading-none transition-colors"
          style={{ background: showForm ? '#e9e9e7' : '#37352f', color: showForm ? '#37352f' : '#fff' }}
        >
          {showForm ? '\u00d7' : '+'}
        </button>
      </div>

      {/* Search */}
      <div className="mt-4 relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#9b9a97">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder="Search books..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-[7px] rounded-md text-[13px] focus:outline-none"
          style={{ background: '#fbfbfa', border: '1px solid #e9e9e7', color: '#37352f' }}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0.5 mt-3 rounded-md p-0.5" style={{ background: '#f1f1ef' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex-1 py-[5px] text-[12px] font-medium rounded-[5px] transition-all"
            style={{
              background: filter === f.key ? '#fff' : 'transparent',
              color: filter === f.key ? '#37352f' : '#9b9a97',
              boxShadow: filter === f.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Add book form */}
      {showForm && (
        <form onSubmit={handleAdd} className="mt-4 rounded-lg p-4 space-y-2.5" style={{ background: '#fbfbfa', border: '1px solid #e9e9e7' }}>
          <input
            type="text"
            placeholder="Book title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-[7px] rounded-md text-[13px] focus:outline-none"
            style={{ border: '1px solid #e9e9e7', color: '#37352f' }}
            autoFocus
          />
          <input
            type="text"
            placeholder="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-[7px] rounded-md text-[13px] focus:outline-none"
            style={{ border: '1px solid #e9e9e7', color: '#37352f' }}
          />
          <textarea
            placeholder="Brief description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-[7px] rounded-md text-[13px] focus:outline-none resize-none"
            style={{ border: '1px solid #e9e9e7', color: '#37352f' }}
          />
          <button
            type="submit"
            disabled={adding}
            className="w-full py-[7px] text-[13px] font-medium rounded-md transition-colors disabled:opacity-50"
            style={{ background: '#37352f', color: '#fff' }}
          >
            {adding ? 'Adding book & detecting chapters...' : 'Add Book'}
          </button>
        </form>
      )}

      {/* Book list */}
      <div className="mt-3">
        {filtered.map((book) => {
          const score = getBookScore(book.id);
          const pct = Math.round(score * 100);
          const scoreColor = pct >= 70 ? '#2d8a56' : pct >= 40 ? '#c2850a' : '#9b9a97';
          return (
            <Link
              key={book.id}
              to={`/library/${book.id}`}
              className="flex items-center justify-between rounded-md px-3 py-3 no-underline hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium truncate" style={{ color: '#37352f' }}>
                  {search.trim() ? highlightMatch(book.title, search) : book.title}
                </p>
                <p className="text-[12px] truncate" style={{ color: '#9b9a97' }}>{book.author}</p>
              </div>
              <span className="text-[13px] font-medium ml-3" style={{ color: scoreColor }}>{pct}%</span>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && !showForm && (
        <div className="mt-16 text-center">
          <p className="text-[13px]" style={{ color: '#9b9a97' }}>
            {books.length === 0 ? 'Your library is empty' : 'No books match your search'}
          </p>
          {books.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-[13px] font-medium"
              style={{ color: '#5160C8' }}
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
      <span style={{ color: '#5160C8' }} className="font-medium">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
