import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileCode, 
  Archive, 
  Copy, 
  Check, 
  FolderArchive
} from 'lucide-react';
import { GeneratedWebsite } from '../../types';
import { exportToZip, downloadStandaloneHtml, copyToClipboard } from '../../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  website: GeneratedWebsite | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  website,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  if (!isOpen || !website) return null;

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    try {
      await exportToZip(website);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(website.fullCode);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                Export Website Package
              </h3>
              <p className="text-xs text-slate-400">
                Download your production-ready code bundle
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

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Bundle Overview */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">{website.title || 'WebGenius Site'}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Ready to ship
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {website.summary || 'Production-ready responsive website with Tailwind CSS & vanilla JS.'}
            </p>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span>📄 index.html</span>
              <span>📁 /src (body, css, js)</span>
              <span>📖 README.md</span>
            </div>
          </div>

          {/* Action 1: Download ZIP */}
          <button
            onClick={handleDownloadZip}
            disabled={isExportingZip}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-white/10 text-white">
                <Archive className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">Download Complete ZIP Archive</div>
                <div className="text-xs text-emerald-100/80 font-normal">
                  Includes index.html, modular src assets, and README
                </div>
              </div>
            </div>
            <Download className="w-5 h-5 opacity-80 group-hover:translate-y-0.5 transition-transform" />
          </button>

          {/* Action 2: Single HTML */}
          <button
            onClick={() => downloadStandaloneHtml(website)}
            className="w-full p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white font-semibold transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-800 text-emerald-400">
                <FileCode className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">Download Standalone HTML</div>
                <div className="text-xs text-slate-400 font-normal">
                  Single all-in-one index.html file with embedded scripts
                </div>
              </div>
            </div>
            <Download className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </button>

          {/* Action 3: Copy Code */}
          <button
            onClick={handleCopy}
            className="w-full p-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs transition-all flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Source code copied to clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Entire HTML Source Code</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
