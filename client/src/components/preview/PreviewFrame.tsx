import React, { useRef, useState, useEffect } from 'react';
import { 
  RefreshCw, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Sparkles, 
  Rocket, 
  Utensils, 
  Briefcase, 
  Dumbbell
} from 'lucide-react';
import { DeviceViewport, GeneratedWebsite } from '../../types';

interface PreviewFrameProps {
  website: GeneratedWebsite | null;
  viewport: DeviceViewport;
  isLoading: boolean;
  loadingStep: string;
  onSelectStarterPrompt: (prompt: string, styleTheme: string) => void;
}

export const PreviewFrame: React.FC<PreviewFrameProps> = ({
  website,
  viewport,
  isLoading,
  loadingStep,
  onSelectStarterPrompt,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reload iframe
  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  // Open preview in new standalone tab
  const handleOpenInNewTab = () => {
    if (!website?.fullCode) return;
    const blob = new Blob([website.fullCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Starter templates
  const starterPrompts = [
    {
      title: 'SaaS Platform',
      tag: 'Tech / AI',
      icon: Rocket,
      color: 'from-blue-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30',
      styleTheme: 'Modern Dark Futuristic',
      prompt: 'A modern B2B SaaS landing page for an AI workflow automation tool called "NexusFlow". Include a dark mode hero section with gradient headline, a live interactive ROI calculator slider, 3-tier pricing cards with a Monthly/Annual toggle, feature grid with glowing borders, customer logos, and an interactive FAQ accordion.',
    },
    {
      title: 'Luxury Bistro',
      tag: 'Hospitality',
      icon: Utensils,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      styleTheme: 'Warm Elegant & Artisanal',
      prompt: 'An upscale Italian restaurant and wine bar called "Trattoria Bellini". Include a hero section with high-res food imagery, an interactive menu with category tabs (Antipasti, Primi, Secondi, Dolci), Chef bio story, customer testimonials, and an interactive table reservation modal form.',
    },
    {
      title: 'Creative Portfolio',
      tag: 'Design & Agency',
      icon: Briefcase,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      styleTheme: 'Minimalist Clean & Bento Grid',
      prompt: 'A minimal, high-impact portfolio for a Senior Product Designer. Feature an aesthetic hero with avatar, a bento-grid showcase of featured case studies with hover zoom states, skill badges, client testimonials, and an interactive "Hire Me" contact modal with direct email copy.',
    },
    {
      title: 'Fitness Studio',
      tag: 'Health & Wellness',
      icon: Dumbbell,
      color: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
      styleTheme: 'High Energy Bold & Vibrant',
      prompt: 'A high-energy boutique fitness and CrossFit gym called "Apex Athletic Club". Include an intense hero video/image placeholder, interactive weekly class schedule filterable by day (Mon-Sun), trainer profiles, membership pricing comparison, and a "Claim 3-Day Free Pass" form.',
    },
  ];

  // Viewport width styling
  const getViewportClasses = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[390px] h-[780px] rounded-[44px] shadow-2xl border-[10px] border-slate-800 ring-1 ring-slate-700/50';
      case 'tablet':
        return 'w-[768px] h-[920px] rounded-[24px] shadow-2xl border-[10px] border-slate-800 ring-1 ring-slate-700/50';
      case 'desktop':
      default:
        return 'w-full h-full rounded-b-xl border-x border-b border-slate-800';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative flex-1 flex flex-col h-full bg-[#070b14] overflow-hidden ${
        isFullscreen ? 'p-0' : 'p-3 sm:p-5'
      }`}
    >
      {/* Top Browser Bar */}
      <div className="h-10 bg-slate-900 border border-slate-800 rounded-t-xl px-4 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/50" />
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1 rounded-md bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-400 max-w-[280px] truncate">
            <span className="text-emerald-400">https://</span>
            <span>preview.webgenius.local/</span>
            <span className="text-slate-200">{website?.title ? website.title.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'sandbox'}</span>
          </div>
        </div>

        {/* Browser control buttons */}
        <div className="flex items-center gap-1">
          {website && (
            <>
              <button
                onClick={handleReload}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Reload Sandbox Frame"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Open Sandbox in Full New Tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-2 bg-[#050811] relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-500/25">
                <Sparkles className="w-10 h-10 text-slate-950 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div className="absolute -inset-2 bg-emerald-500/20 blur-xl rounded-full -z-10" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">
              WebGenius AI Architect is Building...
            </h3>
            
            <p className="text-sm text-emerald-400 font-mono tracking-wide mb-4">
              {loadingStep || 'Synthesizing layout structure & components...'}
            </p>

            <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-full animate-[shimmer_2s_infinite]" />
            </div>

            <p className="text-xs text-slate-500 mt-4 max-w-sm">
              Assembling modern semantic HTML5, responsive Tailwind classes, and vanilla JS interactions.
            </p>
          </div>
        )}

        {/* Content State: Empty vs Active iframe */}
        {!website?.fullCode ? (
          <div className="max-w-3xl w-full text-center px-4 py-8">
            <div className="inline-flex p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-emerald-400 mb-5 shadow-inner">
              <Layers className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 font-['Plus_Jakarta_Sans'] tracking-tight">
              Create Any Website in Seconds
            </h2>
            
            <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto mb-8">
              Describe your idea in natural language or pick one of the curated starter architectures below to test real-time AI generation.
            </p>

            {/* Starter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {starterPrompts.map((starter, i) => {
                const IconComponent = starter.icon;
                return (
                  <button
                    key={i}
                    onClick={() => onSelectStarterPrompt(starter.prompt, starter.styleTheme)}
                    className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all text-left group hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`p-2 rounded-lg bg-gradient-to-br border ${starter.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                          {starter.tag}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {starter.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {starter.prompt}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-emerald-400 font-medium">
                      <span>Click to build this site</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={`transition-all duration-300 flex items-center justify-center ${getViewportClasses()}`}>
            <iframe
              key={iframeKey}
              ref={iframeRef}
              title={website.title || 'WebGenius Generated Website'}
              srcDoc={website.fullCode}
              sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
              className="w-full h-full bg-white rounded-inherit border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
};
