import { useState } from 'react';
import { storage } from '../lib/storage';
import { syncToCloud, restoreFromCloud } from '../lib/sync';
import { getApiKey, setApiKey, hasApiKey } from '../lib/ai';

export default function Settings() {
  const deviceId = storage.getDeviceId();
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [restoreId, setRestoreId] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState(null);
  const [apiKey, setApiKeyValue] = useState(() => getApiKey());
  const [showKey, setShowKey] = useState(false);

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
    <div className="flex-1 px-5 pt-8 pb-6">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      {/* Device ID / Backup */}
      <section className="mt-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Backup & Restore
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div>
            <p className="text-sm text-gray-700">Your backup ID</p>
            <p className="text-xs text-gray-400 mt-0.5">Save this ID to restore your data on a new device.</p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 text-xs bg-gray-50 rounded-lg px-3 py-2 text-gray-700 font-mono truncate">
                {deviceId}
              </code>
              <button
                onClick={handleCopy}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 shrink-0"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full py-2.5 text-sm font-medium rounded-xl bg-accent text-white disabled:opacity-50"
          >
            {syncing ? 'Backing up...' : 'Back up now'}
          </button>
          {syncMsg && (
            <p className={`text-xs ${syncMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
              {syncMsg}
            </p>
          )}

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-700">Restore from another device</p>
            <form onSubmit={handleRestore} className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Paste backup ID"
                value={restoreId}
                onChange={(e) => setRestoreId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent font-mono"
              />
              <button
                type="submit"
                disabled={restoring}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-accent text-accent shrink-0 disabled:opacity-50"
              >
                Restore
              </button>
            </form>
            {restoreMsg && (
              <p className={`text-xs mt-2 ${restoreMsg.includes('Restored') ? 'text-green-600' : 'text-red-500'}`}>
                {restoreMsg}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* API Key */}
      <section className="mt-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          AI Settings
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm text-gray-700">Anthropic API key</p>
          <p className="text-xs text-gray-400 mt-0.5">Used for recall questions and flashcard generation.</p>
          <div className="flex gap-2 mt-2">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => setApiKeyValue(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 shrink-0"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <button
            onClick={handleSaveKey}
            className="mt-3 w-full py-2.5 text-sm font-medium rounded-xl border border-accent text-accent"
          >
            {hasApiKey() ? 'Update key' : 'Save key'}
          </button>
        </div>
      </section>
    </div>
  );
}
