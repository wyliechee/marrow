import { useState } from 'react';
import { setApiKey } from '../lib/ai';

export default function ApiKeyPrompt({ onSaved }) {
  const [key, setKey] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!key.trim()) return;
    setApiKey(key.trim());
    onSaved();
  }

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-medium text-gray-900 mb-2">API Key Needed</h3>
      <p className="text-sm text-gray-500 mb-4">
        Marrow uses Claude AI to generate quiz questions and flashcards.
        Enter your Anthropic API key to get started.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          placeholder="sk-ant-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="w-full py-2 bg-accent text-white text-sm font-medium rounded-lg"
        >
          Save Key
        </button>
      </form>
    </div>
  );
}
