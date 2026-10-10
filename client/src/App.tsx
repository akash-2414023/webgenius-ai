import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { PreviewFrame } from './components/preview/PreviewFrame';
import { PromptPanel } from './components/chat/PromptPanel';
import { CodeEditorDrawer } from './components/editor/CodeEditorDrawer';
import { SettingsModal } from './components/modals/SettingsModal';
import { ExportModal } from './components/modals/ExportModal';
import { AuthModal, AuthMode } from './components/auth/AuthModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { 
  DeviceViewport, 
  GeneratedWebsite, 
  ConfigStatus, 
  ChatMessage, 
  User, 
  AppView, 
  ProjectVersion 
} from './types';
import { 
  fetchConfigStatus, 
  generateWebsiteApi, 
  refineWebsiteApi, 
  fetchMeApi, 
  logoutApi, 
  createProjectApi, 
  updateProjectApi, 
  fetchProjectApi, 
  fetchProjectVersionsApi, 
  restoreProjectVersionApi 
} from './services/api';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & View (persisted in localStorage across refreshes)
  const [currentView, setCurrentView] = useState<AppView>(() => {
    try {
      const saved = localStorage.getItem('webgenius_current_view');
      return (saved === 'dashboard' || saved === 'builder') ? (saved as AppView) : 'builder';
    } catch {
      return 'builder';
    }
  });

  // Website & Editor State
  const [website, setWebsite] = useState<GeneratedWebsite | null>(null);
  const [viewport, setViewport] = useState<DeviceViewport>('desktop');
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');

  // Persistent Project State
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string | undefined>(undefined);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [dbVersions, setDbVersions] = useState<ProjectVersion[]>([]);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Settings & Export Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'gemini' | 'mongo'>('gemini');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);

  // Notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Sync currentView changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('webgenius_current_view', currentView);
    } catch {
      // localStorage may be disabled in private mode
    }
  }, [currentView]);

  // Check user session and config status on startup
  const checkStatus = async () => {
    const res = await fetchConfigStatus();
    if (res.success && res.data) {
      setConfigStatus(res.data);
    }
  };

  const checkUserSession = async () => {
    setIsAuthChecking(true);
    try {
      const res = await fetchMeApi();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
        // If not logged in and on dashboard, smoothly fall back to builder
        if (currentView === 'dashboard') {
          setCurrentView('builder');
        }
      }
    } catch {
      setUser(null);
    } finally {
      setIsAuthChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    checkUserSession();

    // Check if URL has ?token=... for password reset
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setAuthModalMode('reset');
      setIsAuthModalOpen(true);
    }
  }, []);

  // Step-by-step loading simulation for rich UX
  const startLoadingAnimation = () => {
    const steps = [
      'Deconstructing design requirements & typography...',
      'Synthesizing semantic HTML5 and Tailwind CSS layout...',
      'Generating interactive JavaScript animations and handlers...',
      'Injecting responsive breakpoints and assets...',
      'Validating DOM structure and final sandbox rendering...',
    ];
    let i = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      i++;
      if (i < steps.length) {
        setLoadingStep(steps[i]);
      } else {
        clearInterval(interval);
      }
    }, 2800);
    return interval;
  };

  // Generate website
  const handleGenerate = async (prompt: string, styleTheme: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentPrompt(prompt);
    const interval = startLoadingAnimation();

    try {
      const res = await generateWebsiteApi(prompt, styleTheme);
      clearInterval(interval);
      setIsLoading(false);

      if (res.success && res.data) {
        const generated = res.data;
        setWebsite(generated);
        setActiveProjectName(generated.title);
        setHasUnsavedChanges(true);

        const newMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Generated: "${generated.title}"`,
          timestamp: new Date().toISOString(),
          snapshotCode: generated.fullCode,
          summary: generated.summary,
          features: generated.features,
        };
        setChatHistory([newMsg]);

        // If user is logged in and MongoDB is connected, auto-save initial project
        if (user && configStatus?.isMongoConnected && !activeProjectId) {
          saveProjectToDatabase(generated, prompt, generated.title);
        }
      } else {
        if (res.setupRequired) {
          setSettingsTab('gemini');
          setIsSettingsOpen(true);
        }
        setErrorMessage(res.error || 'Failed to generate website. Please check your Gemini API key.');
      }
    } catch (err: any) {
      clearInterval(interval);
      setIsLoading(false);
      setErrorMessage(err.message || 'An unexpected error occurred during generation.');
    }
  };

  // Refine website
  const handleRefine = async (modification: string) => {
    if (!website?.fullCode) return;

    setIsLoading(true);
    setErrorMessage(null);
    const interval = startLoadingAnimation();

    try {
      const historyContext = chatHistory.map((c) => ({
        role: c.role,
        content: c.content,
      }));

      const res = await refineWebsiteApi(website.fullCode, modification, historyContext);
      clearInterval(interval);
      setIsLoading(false);

      if (res.success && res.data) {
        const refined = res.data;
        setWebsite(refined);
        setHasUnsavedChanges(true);

        const newMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Refined: "${modification}"`,
          timestamp: new Date().toISOString(),
          snapshotCode: refined.fullCode,
          summary: refined.summary,
          features: refined.features,
        };
        setChatHistory((prev) => [...prev, newMsg]);

        // Auto-persist refinement if active project exists
        if (activeProjectId && user && configStatus?.isMongoConnected) {
          updateProjectInDatabase(activeProjectId, refined, modification);
        }
      } else {
        if (res.setupRequired) {
          setSettingsTab('gemini');
          setIsSettingsOpen(true);
        }
        setErrorMessage(res.error || 'Failed to refine website. Please try again.');
      }
    } catch (err: any) {
      clearInterval(interval);
      setIsLoading(false);
      setErrorMessage(err.message || 'An unexpected error occurred while refining.');
    }
  };

  // Apply edits made directly in Monaco
  const handleApplyCodeEdits = (updatedFullCode: string) => {
    if (!website) return;
    const updated = {
      ...website,
      fullCode: updatedFullCode,
    };
    setWebsite(updated);
    setHasUnsavedChanges(true);

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Manual edits applied via Code Inspector',
      timestamp: new Date().toISOString(),
      snapshotCode: updatedFullCode,
    };
    setChatHistory((prev) => [...prev, newMsg]);
  };

  // Save Project Handler
  const handleSaveProject = async () => {
    if (!website) return;

    if (!user) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      setErrorMessage('Please sign in to save your website to your account.');
      return;
    }

    if (!configStatus?.isMongoConnected) {
      setSettingsTab('mongo');
      setIsSettingsOpen(true);
      setErrorMessage('MongoDB Atlas is offline. Please configure your cluster URI to persist projects.');
      return;
    }

    if (activeProjectId) {
      await updateProjectInDatabase(activeProjectId, website, 'Manual Save');
    } else {
      await saveProjectToDatabase(website, currentPrompt || 'Custom Website', activeProjectName || website.title);
    }
  };

  const saveProjectToDatabase = async (site: GeneratedWebsite, prompt: string, name: string) => {
    setIsSaving(true);
    const res = await createProjectApi(name || 'Untitled Website', prompt, site);
    setIsSaving(false);

    if (res.success && res.data) {
      setActiveProjectId(res.data._id);
      setActiveProjectName(res.data.name);
      setHasUnsavedChanges(false);
      setSuccessBanner(`Project "${res.data.name}" saved to your cloud workspace.`);
      setTimeout(() => setSuccessBanner(null), 3000);
      loadProjectVersions(res.data._id);
    } else {
      setErrorMessage(res.error || 'Failed to save project.');
    }
  };

  const updateProjectInDatabase = async (id: string, site: GeneratedWebsite, modificationPrompt?: string) => {
    setIsSaving(true);
    const res = await updateProjectApi(id, {
      name: activeProjectName,
      currentCode: site,
      modificationPrompt: modificationPrompt || 'Code Update',
    });
    setIsSaving(false);

    if (res.success && res.data) {
      setHasUnsavedChanges(false);
      setSuccessBanner('Changes synced with MongoDB Atlas.');
      setTimeout(() => setSuccessBanner(null), 2500);
      loadProjectVersions(id);
    } else {
      setErrorMessage(res.error || 'Failed to update project.');
    }
  };

  const loadProjectVersions = async (id: string) => {
    const res = await fetchProjectVersionsApi(id);
    if (res.success && res.data) {
      setDbVersions(res.data);
    }
  };

  // Open existing project from Dashboard
  const handleOpenProject = async (projectId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    const res = await fetchProjectApi(projectId);
    setIsLoading(false);

    if (res.success && res.data) {
      const p = res.data;
      setWebsite(p.currentCode);
      setActiveProjectId(p._id);
      setActiveProjectName(p.name);
      setCurrentPrompt(p.originalPrompt);
      setHasUnsavedChanges(false);

      const msg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Loaded project: "${p.name}" (Version ${p.versionCount || 1})`,
        timestamp: new Date().toISOString(),
        snapshotCode: p.currentCode.fullCode,
        summary: p.currentCode.summary,
        features: p.currentCode.features,
      };
      setChatHistory([msg]);

      loadProjectVersions(p._id);
      setCurrentView('builder');
    } else {
      setErrorMessage(res.error || 'Could not load project.');
    }
  };

  // Restore DB Version
  const handleRestoreDbVersion = async (versionId: string) => {
    if (!activeProjectId) return;
    setIsLoading(true);
    const res = await restoreProjectVersionApi(activeProjectId, versionId);
    setIsLoading(false);

    if (res.success && res.data) {
      setWebsite(res.data.currentCode);
      setHasUnsavedChanges(false);
      setSuccessBanner('Restored earlier version snapshot.');
      setTimeout(() => setSuccessBanner(null), 3000);
      loadProjectVersions(activeProjectId);
    } else {
      setErrorMessage(res.error || 'Failed to restore version.');
    }
  };

  // Reset to new blank project
  const handleNewProject = () => {
    setWebsite(null);
    setActiveProjectId(null);
    setActiveProjectName(undefined);
    setCurrentPrompt('');
    setChatHistory([]);
    setDbVersions([]);
    setHasUnsavedChanges(false);
    setIsEditorOpen(false);
    setCurrentView('builder');
  };

  // Logout handler
  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setCurrentView('builder');
    setSuccessBanner('Logged out successfully.');
    setTimeout(() => setSuccessBanner(null), 2500);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070b14] text-slate-100 select-none">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        viewport={viewport}
        setViewport={setViewport}
        isEditorOpen={isEditorOpen}
        setIsEditorOpen={setIsEditorOpen}
        configStatus={configStatus}
        onOpenSettings={(tab) => {
          if (tab) setSettingsTab(tab);
          setIsSettingsOpen(true);
        }}
        onOpenExport={() => setIsExportOpen(true)}
        onResetProject={handleNewProject}
        hasGeneratedCode={Boolean(website?.fullCode)}
        user={user}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onOpenProfile={() => {
          setAuthModalMode('profile');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSaveProject={handleSaveProject}
        activeProjectName={activeProjectName}
      />

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2 flex items-center justify-between text-xs text-rose-300 animate-fadeIn z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-500/20 rounded text-rose-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Success Banner */}
      {successBanner && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs text-emerald-300 animate-fadeIn z-20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="p-1 hover:bg-emerald-500/20 rounded text-emerald-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MAIN VIEWPORT: Dashboard vs Builder */}
      {currentView === 'dashboard' ? (
        isAuthChecking ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#070b14] text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading your dashboard & projects...</p>
          </div>
        ) : user ? (
          <DashboardView
            user={user}
            onOpenProject={handleOpenProject}
            onNewProject={handleNewProject}
            onOpenProfile={() => {
              setAuthModalMode('profile');
              setIsAuthModalOpen(true);
            }}
            onLogout={handleLogout}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#070b14] text-slate-400 gap-4 p-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold">
              🔒
            </div>
            <div className="text-center max-w-sm">
              <h3 className="text-lg font-semibold text-white mb-1">Sign in to view Dashboard</h3>
              <p className="text-xs text-slate-400">
                Please log in to your WebGenius AI account to view and manage your saved projects.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentView('builder')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Go to Website Builder
              </button>
            </div>
          </div>
        )
      ) : (
        <main className="flex-1 flex overflow-hidden relative">
          {/* Left: AI Prompt & Control Panel */}
          <PromptPanel
            website={website}
            isLoading={isLoading}
            onGenerate={handleGenerate}
            onRefine={handleRefine}
            configStatus={configStatus}
            onOpenSettings={() => {
              setSettingsTab('gemini');
              setIsSettingsOpen(true);
            }}
            chatHistory={chatHistory}
            onSelectSnapshot={(code) => {
              if (website) setWebsite({ ...website, fullCode: code });
            }}
            dbVersions={dbVersions}
            onRestoreDbVersion={handleRestoreDbVersion}
            activeProjectName={activeProjectName}
          />

          {/* Center: Sandboxed Preview */}
          <PreviewFrame
            website={website}
            viewport={viewport}
            isLoading={isLoading}
            loadingStep={loadingStep}
            onSelectStarterPrompt={(prompt, styleTheme) => handleGenerate(prompt, styleTheme)}
          />

          {/* Right Drawer: Monaco Code Inspector */}
          <CodeEditorDrawer
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            website={website}
            onApplyCodeEdits={handleApplyCodeEdits}
          />
        </main>
      )}

      {/* Settings Modal (Gemini & MongoDB Atlas) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        configStatus={configStatus}
        onConfigUpdated={checkStatus}
        initialTab={settingsTab}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        website={website}
      />

      {/* Auth Modal (Login / Register / Forgot / Reset / Profile) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        user={user}
        onAuthSuccess={(u) => {
          setUser(u);
          setSuccessBanner(`Welcome, ${u.name}!`);
          setTimeout(() => setSuccessBanner(null), 3000);
        }}
        onLogout={handleLogout}
        resetToken={resetToken}
      />
    </div>
  );
};
