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

/**
 * Robust JSON request wrapper that avoids "Unexpected end of JSON input" 
 * when the backend returns HTML error pages (e.g. 502, 404, or waking up on Render).
 */
async function safeRequest<T>(
  url: string, 
  options?: RequestInit, 
  fallbackError = 'Request failed.'
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    if (!contentType.includes('application/json')) {
      if (!res.ok) {
        if (res.status === 401) {
          return { success: false, error: 'Unauthorized. Please sign in to continue.' };
        }
        if (res.status === 502 || res.status === 503) {
          return { 
            success: false, 
            error: 'Backend Web Service is waking up on Render. Please wait 15 seconds and try again.' 
          };
        }
        return { 
          success: false, 
          error: `Backend API unreachable (${res.status}). Verify your backend service is running on Render.` 
        };
      }
      return { 
        success: false, 
        error: 'Backend API returned a non-JSON response. Please ensure your backend service URL is correct.' 
      };
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { 
      success: false, 
      error: err.message || fallbackError 
    };
  }
}

// ================= Config =================

export async function fetchConfigStatus(): Promise<ApiResponse<ConfigStatus>> {
  return safeRequest<ConfigStatus>(
    `${API_BASE}/config-status`,
    { credentials: 'include' },
    'Unable to connect to backend server.'
  );
}

export async function saveApiKey(apiKey: string, model?: string): Promise<ApiResponse<{ isConfigured: boolean; model: string }>> {
  return safeRequest<{ isConfigured: boolean; model: string }>(
    `${API_BASE}/config-key`,
    {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ apiKey, model }),
    },
    'Failed to submit API key.'
  );
}

export async function saveMongoUri(uri: string, dbName?: string): Promise<ApiResponse<{ isMongoConfigured: boolean; isMongoConnected: boolean; dbName: string }>> {
  return safeRequest<{ isMongoConfigured: boolean; isMongoConnected: boolean; dbName: string }>(
    `${API_BASE}/config-mongo`,
    {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ uri, dbName }),
    },
    'Failed to connect to MongoDB Atlas.'
  );
}

// ================= Authentication =================

export async function registerApi(name: string, email: string, password: string): Promise<ApiResponse<{ user: User }>> {
  return safeRequest<{ user: User }>(
    `${API_BASE}/auth/register`,
    {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    },
    'Failed to register account.'
  );
}

export async function loginApi(email: string, password: string): Promise<ApiResponse<{ user: User }>> {
  return safeRequest<{ user: User }>(
    `${API_BASE}/auth/login`,
    {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    'Failed to log in.'
  );
}

export async function logoutApi(): Promise<ApiResponse<null>> {
  return safeRequest<null>(
    `${API_BASE}/auth/logout`,
    {
      ...defaultOptions,
      method: 'POST',
    },
    'Failed to log out.'
  );
}

export async function fetchMeApi(): Promise<ApiResponse<{ user: User }>> {
  return safeRequest<{ user: User }>(
    `${API_BASE}/auth/me`,
    { credentials: 'include' },
    'Not authenticated.'
  );
}

export async function updateProfileApi(name?: string, currentPassword?: string, newPassword?: string): Promise<ApiResponse<{ user: User }>> {
  return safeRequest<{ user: User }>(
    `${API_BASE}/auth/profile`,
    {
      ...defaultOptions,
      method: 'PUT',
      body: JSON.stringify({ name, currentPassword, newPassword }),
    },
    'Failed to update profile.'
  );
}

export async function forgotPasswordApi(email: string): Promise<ApiResponse<null>> {
  return safeRequest<null>(
    `${API_BASE}/auth/forgot-password`,
    {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ email }),
    },
    'Failed to request password reset.'
  );
}

export async function resetPasswordApi(token: string, newPassword: string): Promise<ApiResponse<{ user: User }>> {
  return safeRequest<{ user: User }>(
    `${API_BASE}/auth/reset-password`,
    {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    },
    'Failed to reset password.'
  );
}

// ================= Projects & Versions =================

export async function createProjectApi(
  name: string,
  originalPrompt: string,
  currentCode: GeneratedWebsite
): Promise<ApiResponse<Project>> {
  return safeRequest<Project>(
    `${API_BASE}/projects`,
    {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ name, originalPrompt, currentCode }),
    },
    'Failed to save project.'
  );
}

export async function fetchProjectsApi(search?: string): Promise<ApiResponse<Project[]>> {
  const url = search ? `${API_BASE}/projects?search=${encodeURIComponent(search)}` : `${API_BASE}/projects`;
  return safeRequest<Project[]>(
    url,
    { credentials: 'include' },
    'Failed to fetch projects.'
  );
}

export async function fetchProjectApi(id: string): Promise<ApiResponse<Project>> {
  return safeRequest<Project>(
    `${API_BASE}/projects/${id}`,
    { credentials: 'include' },
    'Failed to fetch project details.'
  );
}

export async function updateProjectApi(
  id: string,
  data: {
    name?: string;
    currentCode?: GeneratedWebsite;
    modificationPrompt?: string;
  }
): Promise<ApiResponse<Project>> {
  return safeRequest<Project>(
    `${API_BASE}/projects/${id}`,
    {
      ...defaultOptions,
      method: 'PUT',
      body: JSON.stringify(data),
    },
    'Failed to update project.'
  );
}

export async function renameProjectApi(id: string, name: string): Promise<ApiResponse<Project>> {
  return safeRequest<Project>(
    `${API_BASE}/projects/${id}/rename`,
    {
      ...defaultOptions,
      method: 'PATCH',
      body: JSON.stringify({ name }),
    },
    'Failed to rename project.'
  );
}

export async function deleteProjectApi(id: string): Promise<ApiResponse<null>> {
  return safeRequest<null>(
    `${API_BASE}/projects/${id}`,
    {
      ...defaultOptions,
      method: 'DELETE',
    },
    'Failed to delete project.'
  );
}

export async function fetchProjectVersionsApi(id: string): Promise<ApiResponse<ProjectVersion[]>> {
  return safeRequest<ProjectVersion[]>(
    `${API_BASE}/projects/${id}/versions`,
    { credentials: 'include' },
    'Failed to load versions.'
  );
}

export async function restoreProjectVersionApi(id: string, versionId: string): Promise<ApiResponse<Project>> {
  return safeRequest<Project>(
    `${API_BASE}/projects/${id}/versions/${versionId}/restore`,
    {
      ...defaultOptions,
      method: 'POST',
    },
    'Failed to restore version.'
  );
}

// ================= AI Generation =================

export async function generateWebsiteApi(
  prompt: string,
  styleTheme?: string
): Promise<ApiResponse<GeneratedWebsite>> {
  return safeRequest<GeneratedWebsite>(
    `${API_BASE}/generate`,
    {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ prompt, styleTheme }),
    },
    'Network error while generating website.'
  );
}

export async function refineWebsiteApi(
  currentCode: string,
  modification: string,
  chatHistory?: { role: string; content: string }[]
): Promise<ApiResponse<GeneratedWebsite>> {
  return safeRequest<GeneratedWebsite>(
    `${API_BASE}/refine`,
    {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ currentCode, modification, chatHistory }),
    },
    'Network error while refining website.'
  );
}
