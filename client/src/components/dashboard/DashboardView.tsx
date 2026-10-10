import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Clock, 
  RefreshCw, 
  Check, 
  ArrowUpDown, 
  Layers,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { Project, User } from '../../types';
import { fetchProjectsApi, renameProjectApi, deleteProjectApi } from '../../services/api';

interface DashboardViewProps {
  user: User;
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onOpenProject,
  onNewProject,
  onOpenProfile,
  onLogout,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated-desc' | 'updated-asc' | 'name-asc'>('updated-desc');
  const [isLoading, setIsLoading] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadProjects = async () => {
    setIsLoading(true);
    const res = await fetchProjectsApi(searchQuery);
    setIsLoading(false);
    if (res.success && res.data) {
      setProjects(res.data);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [searchQuery]);

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    const res = await renameProjectApi(id, editingName.trim());
    if (res.success) {
      setProjects((prev) =>
        prev.map((p) => (p._id === id ? { ...p, name: editingName.trim() } : p))
      );
      setEditingProjectId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteProjectApi(id);
    if (res.success) {
      setProjects((prev) => prev.filter((p) => p._id !== id));
      setDeleteConfirmId(null);
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'updated-desc') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (sortBy === 'updated-asc') {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b14] overflow-y-auto">
      {/* Top Banner / Hero */}
      <div className="border-b border-slate-800 bg-[#0d121f]/80 backdrop-blur-md px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Workspace Dashboard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
              Welcome back, <span className="text-emerald-400">{user.name}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your AI-crafted websites, restore historical snapshots, or build a new web application.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onNewProject}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New Website</span>
            </button>

            <button
              onClick={onOpenProfile}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Account Settings"
            >
              <UserIcon className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/10 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-6 flex-1 flex flex-col">
        {/* Search, Filter & Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name or prompt..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="updated-desc" className="bg-slate-900">Recently Updated</option>
                <option value="updated-asc" className="bg-slate-900">Oldest First</option>
                <option value="name-asc" className="bg-slate-900">Name (A-Z)</option>
              </select>
            </div>

            <button
              onClick={loadProjects}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh project list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Projects Grid or Empty State */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm font-medium">Loading your projects from MongoDB Atlas...</p>
          </div>
        ) : sortedProjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80 my-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 mb-4">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 font-['Plus_Jakarta_Sans']">
              {searchQuery ? 'No matching websites found' : 'No saved websites yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              {searchQuery
                ? 'Try a different search query or clear the filter.'
                : 'Generate your first website using natural language and save it to your account.'}
            </p>
            <button
              onClick={onNewProject}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Website Builder</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedProjects.map((p) => (
              <div
                key={p._id}
                className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top Preview / Palette Header */}
                <div 
                  className="h-28 p-4 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-[#0e1628] border-b border-slate-800"
                >
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                      v{p.versionCount || 1}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(p.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="z-10">
                    <p className="text-xs text-slate-400 line-clamp-1 italic">
                      "{p.originalPrompt}"
                    </p>
                  </div>

                  {/* Decorative glowing gradient circle */}
                  <div 
                    className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none"
                    style={{ backgroundColor: p.currentCode?.palette?.primary || '#10b981' }}
                  />
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Title or Inline Edit */}
                    {editingProjectId === p._id ? (
                      <div className="flex items-center gap-1.5 mb-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-sm bg-slate-950 border border-emerald-500 rounded-lg text-white focus:outline-none font-bold"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(p._id);
                            if (e.key === 'Escape') setEditingProjectId(null);
                          }}
                        />
                        <button
                          onClick={() => handleRename(p._id)}
                          className="p-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate font-['Plus_Jakarta_Sans']">
                          {p.name}
                        </h3>
                        <button
                          onClick={() => {
                            setEditingProjectId(p._id);
                            setEditingName(p.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                          title="Rename project"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {p.currentCode?.summary || 'Custom generated responsive layout with interactive features.'}
                    </p>

                    {/* Features tags */}
                    {p.currentCode?.features && p.currentCode.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {p.currentCode.features.slice(0, 3).map((f, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    {deleteConfirmId === p._id ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-rose-400 font-medium">Delete?</span>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="px-2 py-1 rounded bg-rose-500 text-white font-bold hover:bg-rose-600"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(p._id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onOpenProject(p._id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-semibold text-xs transition-all shadow-sm"
                    >
                      <span>Open in Builder</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
