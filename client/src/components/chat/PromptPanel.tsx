import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Wand2, 
  History, 
  Palette, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  RefreshCw,
  GitBranch,
  Clock
} from 'lucide-react';
import { GeneratedWebsite, ConfigStatus, ChatMessage, ProjectVersion } from '../../types';

interface PromptPanelProps {
  website: GeneratedWebsite | null;
  isLoading: boolean;
  onGenerate: (prompt: string, styleTheme: string) => void;
  onRefine: (modification: string) => void;
  configStatus: ConfigStatus | null;
  onOpenSettings: () => void;
  chatHistory: ChatMessage[];
  onSelectSnapshot: (code: string) => void;
  dbVersions?: ProjectVersion[];
  onRestoreDbVersion?: (versionId: string) => void;
  activeProjectName?: string;
}

export const PromptPanel: React.FC<PromptPanelProps> = ({
  website,
  isLoading,
  onGenerate,
  onRefine,
  configStatus,
  onOpenSettings,
  chatHistory,
  onSelectSnapshot,
  dbVersions = [],
  onRestoreDbVersion,
  activeProjectName,
}) => {
  const [promptText, setPromptText] = useState('');
  const [styleTheme, setStyleTheme] = useState('Modern Dark & Clean');
  const [activeTab, setActiveTab] = useState<'prompt' | 'history'>('prompt');

  const styleOptions = [
    'Modern Dark & Clean',
    'Minimalist Apple-style',
    'Futuristic Cyberpunk Neon',
    'Elegant Warm Editorial',
    'Vibrant Playful Startup',
  ];

  const quickRefinements = [
    'Add an interactive FAQ accordion section',
    'Add a monthly/annual pricing toggle with discount badge',
    'Add a floating contact modal with email input',
    'Convert theme into luxury dark mode with gold gradients',
    'Add customer review testimonial slider with star ratings',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isLoading) return;

    if (!website) {
      onGenerate(promptText.trim(), styleTheme);
    } else {
      onRefine(promptText.trim());
    }
    setPromptText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const totalHistoryCount = chatHistory.length + dbVersions.length;

  return (
    <aside className="w-full lg:w-[400px] xl:w-[440px] flex-shrink-0 flex flex-col h-full bg-[#0d121f] border-r border-slate-800 text-slate-200">
      {/* Top Panel Tabs */}
      <div className="h-12 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'prompt'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{website ? 'Refine & Iterate' : 'Generate Website'}</span>
          </button>

          {totalHistoryCount > 0 && (
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Versions ({totalHistoryCount})</span>
            </button>
          )}
        </div>

        {website && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono truncate max-w-[120px]">
            {activeProjectName || 'Live Site'}
          </span>
        )}
      </div>

      {/* API Key Missing Alert if not configured */}
      {!configStatus?.isConfigured && (
        <div className="p-3 mx-4 mt-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-300 mb-0.5">Gemini API Key Required</p>
            <p className="text-amber-200/80 text-[11px] mb-2 leading-relaxed">
              To generate websites using Google Gemini, configure your free API key on the server.
            </p>
            <button
              onClick={onOpenSettings}
              className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-md hover:bg-amber-400 transition-colors text-[11px]"
            >
              Configure API Key
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'prompt' ? (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          {website ? (
            /* Current Website Summary Card */
            <div className="mb-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-white tracking-wide truncate max-w-[220px]">
                  {website.title || 'Generated Website'}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                {website.summary || 'Custom generated responsive website with interactive components.'}
              </p>

              {/* Feature Tags */}
              {website.features && website.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {website.features.slice(0, 4).map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 font-mono"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Visual Theme selector for new projects */
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span>Visual Style / Aesthetic Theme:</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {styleOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStyleTheme(opt)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                      styleTheme === opt
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prompt / Modification Input Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-end">
            <div className="relative flex-1 flex flex-col min-h-[140px]">
              <label htmlFor="prompt-input" className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>{website ? 'Describe Modifications:' : 'Describe Your Website:'}</span>
                <span className="text-[11px] text-slate-500 font-mono">Enter to generate</span>
              </label>
              
              <textarea
                id="prompt-input"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  website
                    ? 'E.g., "Add a dark mode toggle button in header", "Add an FAQ accordion section with 4 questions", "Make the hero headline larger and add a video placeholder..."'
                    : 'E.g., "A modern high-converting SaaS landing page for an AI code reviewer with pricing cards, live code diff demo, and testimonial slider..."'
                }
                disabled={isLoading}
                rows={5}
                className="w-full flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none shadow-inner"
              />
            </div>

            {/* Quick Refinements Chips when site is active */}
            {website && (
              <div className="mt-3">
                <p className="text-[11px] text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Quick Modifications:</span>
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {quickRefinements.map((refine, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPromptText(refine)}
                      className="text-[11px] px-2 py-1 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 text-left transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{refine}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-mono">
                Model: {configStatus?.model || 'gemini-3.8-flash'}
              </span>

              <button
                type="submit"
                disabled={!promptText.trim() || isLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                  !promptText.trim() || isLoading
                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>{website ? 'Apply Changes' : 'Build Website'}</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* History & Snapshot rollback tab */
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Project Version Snapshots</span>
            <span className="text-[11px] text-slate-500 font-mono">Recover earlier states</span>
          </div>

          {/* Database stored versions */}
          {dbVersions.length > 0 && (
            <div className="space-y-2 mb-4">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
                Saved Cloud Versions
              </span>
              {dbVersions.map((v) => (
                <div
                  key={v._id}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      v{v.versionNumber}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-200 mb-2 font-medium">{v.modificationPrompt}</p>
                  {onRestoreDbVersion && (
                    <button
                      type="button"
                      onClick={() => onRestoreDbVersion(v._id)}
                      className="w-full py-1 text-center text-[11px] rounded bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-colors font-mono font-medium"
                    >
                      Restore to Version #{v.versionNumber}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* In-Session chat revisions */}
          {chatHistory.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Session Revisions
              </span>
              {chatHistory.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-mono text-slate-300 font-medium">Revision #{index + 1}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-200 mb-2 font-medium">{item.content}</p>
                  {item.snapshotCode && (
                    <button
                      type="button"
                      onClick={() => onSelectSnapshot(item.snapshotCode!)}
                      className="w-full py-1 text-center text-[11px] rounded bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-colors font-mono"
                    >
                      Restore this revision
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
