import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  FileText, 
  ShieldCheck, 
  Database, 
  Server
} from 'lucide-react';
import { ConfigStatus } from '../../types';
import { saveApiKey, saveMongoUri } from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  configStatus: ConfigStatus | null;
  onConfigUpdated: () => void;
  initialTab?: 'gemini' | 'mongo';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  configStatus,
  onConfigUpdated,
  initialTab = 'gemini',
}) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'mongo'>(initialTab);
  
  // Gemini State
  const [selectedModel, setSelectedModel] = useState<string>(configStatus?.model || 'gemini-3.8-flash');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [geminiSuccess, setGeminiSuccess] = useState<string | null>(null);

  // MongoDB State
  const [mongoUri, setMongoUri] = useState('');
  const [mongoDbName, setMongoDbName] = useState(configStatus?.dbName || 'webgenius_ai');
  const [isSavingMongo, setIsSavingMongo] = useState(false);
  const [mongoError, setMongoError] = useState<string | null>(null);
  const [mongoSuccess, setMongoSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    setGeminiError(null);
    setGeminiSuccess(null);
    setMongoError(null);
    setMongoSuccess(null);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleSaveGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setIsSavingKey(true);
    setGeminiError(null);
    setGeminiSuccess(null);

    const result = await saveApiKey(apiKeyInput.trim(), selectedModel);
    setIsSavingKey(false);

    if (result.success) {
      setGeminiSuccess(result.message || 'Gemini API key successfully verified and stored!');
      setApiKeyInput('');
      onConfigUpdated();
      setTimeout(() => setGeminiSuccess(null), 4000);
    } else {
      setGeminiError(result.error || 'Failed to verify API key.');
    }
  };

  const handleSaveMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUri.trim()) return;

    setIsSavingMongo(true);
    setMongoError(null);
    setMongoSuccess(null);

    const result = await saveMongoUri(mongoUri.trim(), mongoDbName.trim());
    setIsSavingMongo(false);

    if (result.success) {
      setMongoSuccess(result.message || 'Connected to MongoDB Atlas successfully!');
      setMongoUri('');
      onConfigUpdated();
      setTimeout(() => setMongoSuccess(null), 4000);
    } else {
      setMongoError(result.error || 'Could not connect to MongoDB Atlas.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                System & Cloud Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure server AI credentials and MongoDB Atlas storage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'gemini'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Google Gemini AI</span>
            {configStatus?.isConfigured && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('mongo')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'mongo'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>MongoDB Atlas</span>
            {configStatus?.isMongoConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* TAB 1: GEMINI AI */}
          {activeTab === 'gemini' && (
            <div className="space-y-4">
              {/* Status Box */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">Gemini Server Status:</div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    {configStatus?.isConfigured ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Connected & Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400">API Key Missing</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 mb-0.5">Active Model:</div>
                  <div className="text-xs font-mono text-slate-300 font-medium">
                    {configStatus?.model || 'gemini-3.8-flash'}
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveGemini} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Gemini Model:
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                  >
                    <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended)</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Stored strictly on the server (`server/.env`).
                  </p>
                </div>

                {geminiError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{geminiError}</span>
                  </div>
                )}

                {geminiSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{geminiSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingKey || !apiKeyInput.trim()}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isSavingKey || !apiKeyInput.trim()
                      ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-400'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  {isSavingKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying key with Gemini API...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>Verify & Save Key</span>
                    </>
                  )}
                </button>
              </form>

              {/* Guide */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Free API Key Setup:</span>
                </h4>
                <p className="text-[11px] text-slate-300">
                  Obtain your key free from Google AI Studio.
                </p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-[11px] pt-1"
                >
                  <span>Open Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: MONGODB ATLAS */}
          {activeTab === 'mongo' && (
            <div className="space-y-4">
              {/* Status Box */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">MongoDB Atlas Status:</div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    {configStatus?.isMongoConnected ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Cluster Connected</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400">Offline / Unconfigured</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 mb-0.5">Database:</div>
                  <div className="text-xs font-mono text-slate-300 font-medium">
                    {configStatus?.dbName || 'webgenius_ai'}
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveMongo} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    MongoDB Connection URI:
                  </label>
                  <input
                    type="password"
                    value={mongoUri}
                    onChange={(e) => setMongoUri(e.target.value)}
                    placeholder="mongodb+srv://user:pass@cluster0.mongodb.net/?retryWrites=true&w=majority"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Saved directly to server `.env` (`MONGODB_URI`).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Database Name:
                  </label>
                  <input
                    type="text"
                    value={mongoDbName}
                    onChange={(e) => setMongoDbName(e.target.value)}
                    placeholder="webgenius_ai"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                  />
                </div>

                {mongoError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{mongoError}</span>
                  </div>
                )}

                {mongoSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{mongoSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingMongo || !mongoUri.trim()}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isSavingMongo || !mongoUri.trim()
                      ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-400'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  {isSavingMongo ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting to MongoDB Atlas...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>Test & Connect MongoDB Atlas</span>
                    </>
                  )}
                </button>
              </form>

              {/* Guide */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>MongoDB Atlas Setup Guide:</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>Create a free cluster on MongoDB Cloud Atlas.</li>
                  <li>In <strong>Network Access</strong>, whitelist IP `0.0.0.0/0`.</li>
                  <li>In <strong>Database Access</strong>, create an admin user.</li>
                  <li>Click <strong>Connect ➔ Drivers</strong> and copy the connection string.</li>
                </ol>
                <a
                  href="https://cloud.mongodb.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-[11px] pt-1"
                >
                  <span>Open MongoDB Cloud Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
