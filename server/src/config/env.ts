import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from server directory
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

export interface AppConfig {
  port: number;
  nodeEnv: string;
  geminiApiKey: string;
  geminiModel: string;
  clientOrigin: string;
  frontendUrl: string;
  mongodbUri: string;
  mongodbDbName: string;
  jwtSecret: string;
  sessionSecret: string;
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  clientOrigin: process.env.CLIENT_ORIGIN || 'https://webgenius-ui.onrender.com/',
  frontendUrl: process.env.FRONTEND_URL || 'https://webgenius-ui.onrender.com/',
  mongodbUri: process.env.MONGODB_URI || '',
  mongodbDbName: process.env.MONGODB_DB_NAME || 'webgenius_ai',
  jwtSecret: process.env.JWT_SECRET || 'dev_webgenius_super_secret_jwt_key_2026_secure',
  sessionSecret: process.env.SESSION_SECRET || 'dev_webgenius_session_secret_2026_secure',
};

export function isApiKeyConfigured(): boolean {
  return Boolean(config.geminiApiKey && config.geminiApiKey.trim().length > 10);
}

export function isMongoConfigured(): boolean {
  return Boolean(config.mongodbUri && config.mongodbUri.trim().length > 10);
}

export function updateApiKey(newKey: string, newModel?: string): boolean {
  try {
    const trimmed = newKey.trim();
    config.geminiApiKey = trimmed;
    process.env.GEMINI_API_KEY = trimmed;

    if (newModel && newModel.trim()) {
      config.geminiModel = newModel.trim();
      process.env.GEMINI_MODEL = newModel.trim();
    }

    persistEnvVariable('GEMINI_API_KEY', trimmed);
    if (newModel && newModel.trim()) {
      persistEnvVariable('GEMINI_MODEL', config.geminiModel);
    }
    return true;
  } catch (error) {
    console.error('Failed to update API key:', error);
    return false;
  }
}

export function updateMongoConfig(newUri: string, newDbName?: string): boolean {
  try {
    const trimmedUri = newUri.trim();
    config.mongodbUri = trimmedUri;
    process.env.MONGODB_URI = trimmedUri;

    persistEnvVariable('MONGODB_URI', trimmedUri);

    if (newDbName && newDbName.trim()) {
      const trimmedDb = newDbName.trim();
      config.mongodbDbName = trimmedDb;
      process.env.MONGODB_DB_NAME = trimmedDb;
      persistEnvVariable('MONGODB_DB_NAME', trimmedDb);
    }
    return true;
  } catch (error) {
    console.error('Failed to update MongoDB config:', error);
    return false;
  }
}

function persistEnvVariable(key: string, value: string): void {
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  } else {
    envContent = `${key}=${value}\n`;
  }
  fs.writeFileSync(envPath, envContent, 'utf8');
}
