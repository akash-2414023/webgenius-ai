export interface GeneratedWebsite {
  title: string;
  summary: string;
  html: string;
  css: string;
  js: string;
  fullCode: string;
  palette?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  features: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  snapshotCode?: string;
  summary?: string;
  features?: string[];
}

export type DeviceViewport = 'desktop' | 'tablet' | 'mobile';

export type EditorTab = 'full' | 'html' | 'css' | 'js';

export interface ConfigStatus {
  isConfigured: boolean;
  model: string;
  nodeEnv: string;
  maskedKey: string | null;
  isMongoConfigured: boolean;
  isMongoConnected: boolean;
  dbName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Project {
  _id: string;
  owner?: string;
  name: string;
  originalPrompt: string;
  currentCode: GeneratedWebsite;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectVersion {
  _id: string;
  projectId: string;
  versionNumber: number;
  fullCode?: string;
  modificationPrompt: string;
  summary?: string;
  createdAt: string;
}

export type AppView = 'builder' | 'dashboard';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  setupRequired?: boolean;
  message?: string;
}
