import { ApiResponse, ConfigStatus, GeneratedWebsite, User, Project, ProjectVersion } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL 
  ? `${(import.meta as any).env.VITE_API_URL}/api` 
  : '/api';

const defaultOptions: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
};

// ================= Config =================

export async function fetchConfigStatus(): Promise<ApiResponse<ConfigStatus>> {
  try {
    const res = await fetch(`${API_BASE}/config-status`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Server returned status ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unable to connect to backend server.' };
  }
}

export async function saveApiKey(apiKey: string, model?: string): Promise<ApiResponse<{ isConfigured: boolean; model: string }>> {
  try {
    const res = await fetch(`${API_BASE}/config-key`, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ apiKey, model }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit API key.' };
  }
}

export async function saveMongoUri(uri: string, dbName?: string): Promise<ApiResponse<{ isMongoConfigured: boolean; isMongoConnected: boolean; dbName: string }>> {
  try {
    const res = await fetch(`${API_BASE}/config-mongo`, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ uri, dbName }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to connect to MongoDB Atlas.' };
  }
}

// ================= Authentication =================

export async function registerApi(name: string, email: string, password: string): Promise<ApiResponse<{ user: User }>> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to register account.' };
  }
}

export async function loginApi(email: string, password: string): Promise<ApiResponse<{ user: User }>> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to log in.' };
  }
}

export async function logoutApi(): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      ...defaultOptions,
      method: 'POST',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to log out.' };
  }
}

export async function fetchMeApi(): Promise<ApiResponse<{ user: User }>> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      throw new Error(`Status ${res.status}`);
    }
    return await res.json();
  } catch {
    return { success: false, error: 'Not authenticated.' };
  }
}

export async function updateProfileApi(name?: string, currentPassword?: string, newPassword?: string): Promise<ApiResponse<{ user: User }>> {
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      ...defaultOptions,
      method: 'PUT',
      body: JSON.stringify({ name, currentPassword, newPassword }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update profile.' };
  }
}

export async function forgotPasswordApi(email: string): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to request password reset.' };
  }
}

export async function resetPasswordApi(token: string, newPassword: string): Promise<ApiResponse<{ user: User }>> {
  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reset password.' };
  }
}

// ================= Projects & Versions =================

export async function createProjectApi(
  name: string,
  originalPrompt: string,
  currentCode: GeneratedWebsite
): Promise<ApiResponse<Project>> {
  try {
    const res = await fetch(`${API_BASE}/projects`, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ name, originalPrompt, currentCode }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save project.' };
  }
}

export async function fetchProjectsApi(search?: string): Promise<ApiResponse<Project[]>> {
  try {
    const url = search ? `${API_BASE}/projects?search=${encodeURIComponent(search)}` : `${API_BASE}/projects`;
    const res = await fetch(url, { credentials: 'include' });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch projects.' };
  }
}

export async function fetchProjectApi(id: string): Promise<ApiResponse<Project>> {
  try {
    const res = await fetch(`${API_BASE}/projects/${id}`, { credentials: 'include' });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch project details.' };
  }
}

export async function updateProjectApi(
  id: string,
  data: {
    name?: string;
    currentCode?: GeneratedWebsite;
    modificationPrompt?: string;
  }
): Promise<ApiResponse<Project>> {
  try {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      ...defaultOptions,
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update project.' };
  }
}

export async function renameProjectApi(id: string, name: string): Promise<ApiResponse<Project>> {
  try {
    const res = await fetch(`${API_BASE}/projects/${id}/rename`, {
      ...defaultOptions,
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to rename project.' };
  }
}

export async function deleteProjectApi(id: string): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      ...defaultOptions,
      method: 'DELETE',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete project.' };
  }
}

export async function fetchProjectVersionsApi(id: string): Promise<ApiResponse<ProjectVersion[]>> {
  try {
    const res = await fetch(`${API_BASE}/projects/${id}/versions`, { credentials: 'include' });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to load versions.' };
  }
}

export async function restoreProjectVersionApi(id: string, versionId: string): Promise<ApiResponse<Project>> {
  try {
    const res = await fetch(`${API_BASE}/projects/${id}/versions/${versionId}/restore`, {
      ...defaultOptions,
      method: 'POST',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to restore version.' };
  }
}

// ================= AI Generation =================

export async function generateWebsiteApi(
  prompt: string,
  styleTheme?: string
): Promise<ApiResponse<GeneratedWebsite>> {
  try {
    const res = await fetch(`${API_BASE}/generate`, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ prompt, styleTheme }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error while generating website.' };
  }
}

export async function refineWebsiteApi(
  currentCode: string,
  modification: string,
  chatHistory?: { role: string; content: string }[]
): Promise<ApiResponse<GeneratedWebsite>> {
  try {
    const res = await fetch(`${API_BASE}/refine`, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ currentCode, modification, chatHistory }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error while refining website.' };
  }
}
