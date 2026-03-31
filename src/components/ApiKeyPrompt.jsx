import { useState } from 'react';
import { setApiKey, setProvider, getProvider, getProviderList } from '../lib/ai';

export default function ApiKeyPrompt({ onSaved }) {
  const providers = getProviderList();
  const [currentProvider, setCurrentProvider] = useState(() => getProvider());
  const [key, setKey] = useState('');

  const providerInfo = providers.find((p) => p.id === currentProvider) || providers[0];

  function handleProviderChange(id) {
    setProvider(id);
    setCurrentProvider(id);
    setKey('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!key.trim()) return;
    setProvider(currentProvider);
    setApiKey(key.trim());
    onSaved();
  }

  return (
    <div className="mt-4 rounded-lg p-5" style={{ background: '#fbfbfa', border: '1px solid #e9e9e7' }}>
      <p className="text-[14px] font-medium" style={{ color: '#37352f' }}>API Key Needed</p>
      <p className="text-[13px] mt-1" style={{ color: '#787774' }}>
        Marrow uses AI to generate quiz questions and flashcards. Pick your provider and enter your API key.
      </p>

      {/* Provider picker */}
      <div className="flex gap-0.5 mt-4 rounded-md p-0.5" style={{ background: '#f1f1ef' }}>
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => handleProviderChange(p.id)}
            className="flex-1 py-[5px] text-[11px] font-medium rounded-[5px] transition-all"
            style={{
              background: currentProvider === p.id ? '#fff' : 'transparent',
              color: currentProvider === p.id ? '#37352f' : '#9b9a97',
              boxShadow: currentProvider === p.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {p.name.split(' ')[0]}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
        <input
          type="password"
          placeholder={providerInfo.placeholder}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full px-3 py-[7px] rounded-md text-[13px] font-mono focus:outline-none"
          style={{ border: '1px solid #e9e9e7', color: '#37352f' }}
        />
        <button
          type="submit"
          className="w-full py-[7px] text-[13px] font-medium rounded-md"
          style={{ background: '#37352f', color: '#fff' }}
        >
          Save Key
        </button>
      </form>
    </div>
  );
}
