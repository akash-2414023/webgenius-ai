import { Request, Response } from 'express';
import { config, isApiKeyConfigured, isMongoConfigured, updateApiKey, updateMongoConfig } from '../config/env.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectToDatabase, isDatabaseConnected, getDatabaseStatus } from '../db/connection.js';

export async function handleGetConfigStatus(_req: Request, res: Response): Promise<void> {
  const configured = isApiKeyConfigured();
  const dbStatus = getDatabaseStatus();
  
  res.status(200).json({
    success: true,
    data: {
      isConfigured: configured,
      model: config.geminiModel,
      nodeEnv: config.nodeEnv,
      maskedKey: configured 
        ? `${config.geminiApiKey.substring(0, 4)}••••••••${config.geminiApiKey.substring(config.geminiApiKey.length - 4)}` 
        : null,
      isMongoConfigured: dbStatus.isConfigured,
      isMongoConnected: dbStatus.isConnected,
      dbName: dbStatus.dbName,
    },
  });
}

export async function handleSaveApiKey(req: Request, res: Response): Promise<void> {
  const { apiKey, model: requestedModel } = req.body;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    res.status(400).json({
      success: false,
      error: 'Please provide a valid Gemini API key (starts with AIzaSy...).',
    });
    return;
  }

  // Model candidates to test in priority order
  const modelCandidates = Array.from(
    new Set(
      [
        requestedModel,
        config.geminiModel,
        'gemini-3.8-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
      ].filter(Boolean)
    )
  );

  const testGenAI = new GoogleGenerativeAI(apiKey.trim());
  let workingModel: string | null = null;
  let lastError: any = null;

  for (const candidate of modelCandidates) {
    try {
      const modelInstance = testGenAI.getGenerativeModel({ model: candidate });
      await modelInstance.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
      });
      workingModel = candidate;
      break;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model candidate "${candidate}" test failed:`, err.message);
      if (err.message && (err.message.includes('404') || err.message.includes('not found') || err.message.includes('no longer available'))) {
        continue;
      }
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('key not valid'))) {
        break;
      }
    }
  }

  if (!workingModel) {
    res.status(400).json({
      success: false,
      error: `The API key could not be verified by Google Gemini: ${lastError?.message || 'Invalid key or no compatible model available.'}`,
    });
    return;
  }

  // Save key and working model
  const saved = updateApiKey(apiKey.trim(), workingModel);
  if (!saved) {
    res.status(500).json({
      success: false,
      error: 'Failed to persist the API key to server environment.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: `API key validated and securely saved! Connected with model: ${workingModel}`,
    data: {
      isConfigured: true,
      model: workingModel,
    },
  });
}

export async function handleSaveMongoUri(req: Request, res: Response): Promise<void> {
  const { uri, dbName } = req.body;

  if (!uri || typeof uri !== 'string' || !uri.startsWith('mongodb')) {
    res.status(400).json({
      success: false,
      error: 'Please provide a valid MongoDB connection string (e.g., mongodb+srv://...).',
    });
    return;
  }

  const success = await connectToDatabase(uri.trim());

  if (!success) {
    res.status(400).json({
      success: false,
      error: 'Could not connect to MongoDB with the provided URI. Please check your credentials, network access (IP whitelist: 0.0.0.0/0 on Atlas), and cluster status.',
    });
    return;
  }

  updateMongoConfig(uri.trim(), dbName);

  res.status(200).json({
    success: true,
    message: 'MongoDB Atlas connection established and saved successfully!',
    data: {
      isMongoConfigured: true,
      isMongoConnected: true,
      dbName: config.mongodbDbName,
    },
  });
}
