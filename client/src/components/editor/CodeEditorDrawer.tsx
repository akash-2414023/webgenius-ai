import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  X, 
  Copy, 
  Check, 
  Play, 
  FileCode, 
  Code, 
  FileSpreadsheet, 
  Zap,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { GeneratedWebsite, EditorTab } from '../../types';
import { copyToClipboard } from '../../services/exportService';

interface CodeEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  website: GeneratedWebsite | null;
  onApplyCodeEdits: (updatedFullCode: string) => void;
}

export const CodeEditorDrawer: React.FC<CodeEditorDrawerProps> = ({
  isOpen,
  onClose,
  website,
  onApplyCodeEdits,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('full');
  const [editedCode, setEditedCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullWidth, setIsFullWidth] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Sync edited code with current website code
  useEffect(() => {
    if (!website) return;
    if (activeTab === 'full') {
      setEditedCode(website.fullCode || '');
    } else if (activeTab === 'html') {
      setEditedCode(website.html || '');
    } else if (activeTab === 'css') {
      setEditedCode(website.css || '');
    } else if (activeTab === 'js') {
      setEditedCode(website.js || '');
    }
    setIsDirty(false);
  }, [website, activeTab]);

  if (!isOpen || !website) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(editedCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (activeTab === 'full') {
      onApplyCodeEdits(editedCode);
    } else {
      // Reconstruct into fullCode if on subtab
      const newHtml = activeTab === 'html' ? editedCode : website.html;
      const newCss = activeTab === 'css' ? editedCode : website.css;
      const newJs = activeTab === 'js' ? editedCode : website.js;

      const reconstructed = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${website.title || 'Generated Website'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${newCss}
  </style>
</head>
<body class="bg-slate-50 text-slate-900 font-sans antialiased">
  ${newHtml}
  <script>
    ${newJs}
  </script>
</body>
</html>`;
      onApplyCodeEdits(reconstructed);
    }
    setIsDirty(false);
  };

  const getLanguage = () => {
    switch (activeTab) {
      case 'css':
        return 'css';
      case 'js':
        return 'javascript';
      case 'html':
      case 'full':
      default:
        return 'html';
    }
  };

  return (
    <div
      className={`fixed top-16 bottom-0 right-0 z-40 bg-[#0d121f] border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ${
        isFullWidth ? 'w-full' : 'w-full md:w-[620px] lg:w-[720px] xl:w-[820px]'
      }`}
    >
      {/* Top Editor Bar */}
      <div className="h-12 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('full')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'full'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>index.html (Complete)</span>
          </button>

          <button
            onClick={() => setActiveTab('html')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'html'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>body.html</span>
          </button>

          <button
            onClick={() => setActiveTab('css')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'css'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>styles.css</span>
          </button>

          <button
            onClick={() => setActiveTab('js')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'js'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>script.js</span>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy current file code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsFullWidth(!isFullWidth)}
            className="hidden sm:block p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={isFullWidth ? 'Restore Drawer Width' : 'Expand Full Width'}
          >
            {isFullWidth ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Close Editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="flex-1 relative bg-[#1e1e1e]">
        <Editor
          height="100%"
          language={getLanguage()}
          value={editedCode}
          theme="vs-dark"
          onChange={(value) => {
            setEditedCode(value || '');
            setIsDirty(true);
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Editor Footer / Apply Controls */}
      <div className="h-12 border-t border-slate-800 bg-slate-900 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono text-emerald-400">{getLanguage().toUpperCase()}</span>
          <span>•</span>
          <span>{editedCode.split('\n').length} lines</span>
          {isDirty && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Unsaved live changes
            </span>
          )}
        </div>

        <button
          onClick={handleApply}
          disabled={!isDirty}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            !isDirty
              ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
          }`}
          title="Update the sandboxed preview with your edits"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Apply to Live Preview</span>
        </button>
      </div>
    </div>
  );
};
