import React, { useState } from 'react';
import { 
  Sparkles, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Code2, 
  Download, 
  Settings, 
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Save,
  Check,
  RefreshCw,
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  Database
} from 'lucide-react';
import { DeviceViewport, ConfigStatus, User, AppView } from '../../types';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  viewport: DeviceViewport;
  setViewport: (vp: DeviceViewport) => void;
  isEditorOpen: boolean;
  setIsEditorOpen: (open: boolean) => void;
  configStatus: ConfigStatus | null;
  onOpenSettings: (tab?: 'gemini' | 'mongo') => void;
  onOpenExport: () => void;
  onResetProject: () => void;
  hasGeneratedCode: boolean;
  user: User | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSaveProject: () => void;
  activeProjectName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  viewport,
  setViewport,
  isEditorOpen,
  setIsEditorOpen,
  configStatus,
  onOpenSettings,
  onOpenExport,
  onResetProject,
  hasGeneratedCode,
  user,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  hasUnsavedChanges,
  isSaving,
  onSaveProject,
  activeProjectName,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & View Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentView('builder')}
          className="flex items-center gap-3 group text-left"
          title="Return to Website Builder"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
                WebGenius <span className="text-emerald-400">AI</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-medium">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {activeProjectName ? `Editing: ${activeProjectName}` : 'AI Website Architect & Full-Stack Builder'}
            </p>
          </div>
        </button>

        {/* Dashboard Toggle Pill */}
        {user && (
          <div className="hidden md:flex items-center ml-2 pl-2 border-l border-slate-800">
            <button
              onClick={() => setCurrentView(currentView === 'builder' ? 'dashboard' : 'builder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'dashboard'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentView === 'dashboard' ? 'Back to Builder' : 'Dashboard'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Center Viewport Switcher (Builder Mode Only) */}
      {currentView === 'builder' && (
        <div className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setViewport('desktop')}
            title="Desktop View (100%)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewport === 'desktop'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>

          <button
            onClick={() => setViewport('tablet')}
            title="Tablet View (768px)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewport === 'tablet'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>

          <button
            onClick={() => setViewport('mobile')}
            title="Mobile View (390px)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewport === 'mobile'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Gemini Status Indicator */}
        <button
          onClick={() => onOpenSettings('gemini')}
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
            configStatus?.isConfigured
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
          }`}
          title="Click to view Gemini AI configuration"
        >
          {configStatus?.isConfigured ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gemini Ready</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini Setup</span>
            </>
          )}
        </button>

        {/* MongoDB Status Indicator */}
        <button
          onClick={() => onOpenSettings('mongo')}
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
            configStatus?.isMongoConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
          }`}
          title="Click to view MongoDB Atlas configuration"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>{configStatus?.isMongoConnected ? 'Atlas Live' : 'Atlas Offline'}</span>
        </button>

        {/* Save Project Button (Builder Mode) */}
        {currentView === 'builder' && hasGeneratedCode && (
          <button
            onClick={onSaveProject}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSaving
                ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-wait'
                : hasUnsavedChanges
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 animate-pulse'
                : 'bg-slate-900 text-emerald-400 border-slate-800 hover:border-slate-700'
            }`}
            title="Save project to MongoDB Atlas"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : hasUnsavedChanges ? (
              <Save className="w-3.5 h-3.5" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Project' : 'Saved'}</span>
          </button>
        )}

        {/* Code Inspector Toggle */}
        {currentView === 'builder' && (
          <button
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            disabled={!hasGeneratedCode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              !hasGeneratedCode
                ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                : isEditorOpen
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-750 hover:border-slate-700'
            }`}
            title="Inspect and live-edit generated HTML/CSS/JS with Monaco"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">Code Editor</span>
          </button>
        )}

        {/* Export ZIP Button */}
        {currentView === 'builder' && (
          <button
            onClick={onOpenExport}
            disabled={!hasGeneratedCode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              !hasGeneratedCode
                ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-500/40 shadow-sm'
            }`}
            title="Download complete runnable project files"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}

        {/* Reset / New Project */}
        {currentView === 'builder' && hasGeneratedCode && (
          <button
            onClick={onResetProject}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
            title="Start fresh project"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={() => onOpenSettings()}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          title="Gemini AI & MongoDB Atlas Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Account / Auth Dropdown */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-white transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs uppercase">
                {user.name.charAt(0)}
              </div>
              <span className="hidden md:inline max-w-[100px] truncate">{user.name}</span>
            </button>

            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0f172a] border border-slate-800 shadow-2xl py-1 z-50 animate-fadeIn text-xs"
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate font-mono">{user.email}</p>
                </div>

                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-850 hover:text-emerald-400 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>My Projects</span>
                </button>

                <button
                  onClick={() => {
                    onOpenProfile();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-850 hover:text-emerald-400 flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Account Profile</span>
                </button>

                <div className="border-t border-slate-800 my-1" />

                <button
                  onClick={() => {
                    onLogout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
          >
            <UserIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
