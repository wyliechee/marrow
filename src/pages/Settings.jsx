import { useState } from 'react';
import { storage } from '../lib/storage';
import { syncToCloud, restoreFromCloud } from '../lib/sync';
import { getApiKey, setApiKey, hasApiKey, getProvider, setProvider, getProviderList } from '../lib/ai';

export default function Settings() {
  const deviceId = storage.getDeviceId();
  const providers = getProviderList();
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [restoreId, setRestoreId] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState(null);
  const [currentProvider, setCurrentProvider] = useState(() => getProvider());
  const [apiKey, setApiKeyValue] = useState(() => getApiKey());
  const [showKey, setShowKey] = useState(false);

  const providerInfo = providers.find((p) => p.id === currentProvider) || providers[0];

  function handleProviderChange(id) {
    setProvider(id);
    setCurrentProvider(id);
    setApiKeyValue(localStorage.getItem(`marrow_key_${id}`) || '');
    setShowKey(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    const ok = await syncToCloud();
    setSyncMsg(ok ? 'Backed up successfully' : 'Backup failed \u2014 check your connection');
    setSyncing(false);
  }

  async function handleRestore(e) {
    e.preventDefault();
    if (!restoreId.trim()) return;
    setRestoring(true);
    setRestoreMsg(null);
    try {
      await restoreFromCloud(restoreId.trim());
      setRestoreMsg('Data restored! Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setRestoreMsg(err.message);
    }
    setRestoring(false);
  }

  function handleSaveKey() {
    setApiKey(apiKey.trim());
  }

  return (
    <div className="flex-1 px-6 pt-10 pb-6 max-w-lg mx-auto w-full">
      <h1 className="text-[22px] font-semibold" style={{ color: '#37352f' }}>Settings</h1>

      {/* AI Provider */}
      <section className="mt-7">
        <p className="text-[11px] uppercase tracking-widest font-medium mb-3" style={{ color: '#9b9a97' }}>
          AI Provider
        </p>
        <div className="rounded-lg p-5 space-y-4" style={{ background: '#fbfbfa', border: '1px solid #e9e9e7' }}>
          <div>
            <p className="text-[13px] font-medium" style={{ color: '#37352f' }}>Provider</p>
            <div className="flex gap-0.5 mt-2 rounded-md p-0.5" style={{ background: '#f1f1ef' }}>
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
          </div>

          <div>
            <p className="text-[13px]" style={{ color: '#37352f' }}>{providerInfo.name} API key</p>
            <p className="text-[12px] mt-0.5" style={{ color: '#9b9a97' }}>Used for recall questions and flashcard generation.</p>
            <div className="flex gap-2 mt-2">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={providerInfo.placeholder}
                value={apiKey}
                onChange={(e) => setApiKeyValue(e.target.value)}
                className="flex-1 px-3 py-[7px] rounded-md text-[13px] font-mono focus:outline-none"
                style={{ border: '1px solid #e9e9e7', color: '#37352f' }}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="px-3 py-[7px] text-[11px] font-medium rounded-md shrink-0"
                style={{ border: '1px solid #e9e9e7', color: '#787774' }}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <button
              onClick={handleSaveKey}
              className="mt-3 w-full py-[7px] text-[13px] font-medium rounded-md"
              style={{ border: '1px solid #e9e9e7', color: '#37352f' }}
            >
              {hasApiKey() ? 'Update key' : 'Save key'}
            </button>
          </div>
        </div>
      </section>

      {/* Backup & Restore */}
      <section className="mt-7">
        <p className="text-[11px] uppercase tracking-widest font-medium mb-3" style={{ color: '#9b9a97' }}>
          Backup & Restore
        </p>
        <div className="rounded-lg p-5 space-y-4" style={{ background: '#fbfbfa', border: '1px solid #e9e9e7' }}>
          <div>
            <p className="text-[13px]" style={{ color: '#37352f' }}>Your backup ID</p>
            <p className="text-[12px] mt-0.5" style={{ color: '#9b9a97' }}>Save this to restore data on a new device.</p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 text-[12px] rounded-md px-3 py-[7px] font-mono truncate" style={{ background: '#f1f1ef', color: '#37352f' }}>
                {deviceId}
              </code>
              <button
                onClick={handleCopy}
                className="px-3 py-[7px] text-[11px] font-medium rounded-md shrink-0"
                style={{ border: '1px solid #e9e9e7', color: '#787774' }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full py-[7px] text-[13px] font-medium rounded-md disabled:opacity-50"
            style={{ background: '#37352f', color: '#fff' }}
          >
            {syncing ? 'Backing up...' : 'Back up now'}
          </button>
          {syncMsg && (
            <p className="text-[12px]" style={{ color: syncMsg.includes('success') ? '#2d8a56' : '#c4554d' }}>
              {syncMsg}
            </p>
          )}

          <div className="pt-4" style={{ borderTop: '1px solid #e9e9e7' }}>
            <p className="text-[13px]" style={{ color: '#37352f' }}>Restore from another device</p>
            <form onSubmit={handleRestore} className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Paste backup ID"
                value={restoreId}
                onChange={(e) => setRestoreId(e.target.value)}
                className="flex-1 px-3 py-[7px] rounded-md text-[13px] font-mono focus:outline-none"
                style={{ border: '1px solid #e9e9e7', color: '#37352f' }}
              />
              <button
                type="submit"
                disabled={restoring}
                className="px-4 py-[7px] text-[13px] font-medium rounded-md shrink-0 disabled:opacity-50"
                style={{ border: '1px solid #e9e9e7', color: '#5160C8' }}
              >
                Restore
              </button>
            </form>
            {restoreMsg && (
              <p className="text-[12px] mt-2" style={{ color: restoreMsg.includes('Restored') ? '#2d8a56' : '#c4554d' }}>
                {restoreMsg}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
