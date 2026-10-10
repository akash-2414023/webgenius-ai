import { Request, Response } from 'express';
import { generateWebsite, refineWebsite } from '../services/geminiService.js';
import { isApiKeyConfigured } from '../config/env.js';

export async function handleGenerate(req: Request, res: Response): Promise<void> {
  try {
    const { prompt, styleTheme } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'A prompt description is required to generate a website.',
      });
      return;
    }

    if (!isApiKeyConfigured()) {
      res.status(400).json({
        success: false,
        setupRequired: true,
        error: 'Google Gemini API key is not configured on the server. Please provide an API key in server/.env or configure it via the Setup dialog.',
      });
      return;
    }

    const website = await generateWebsite(prompt.trim(), styleTheme);

    res.status(200).json({
      success: true,
      data: website,
    });
  } catch (error: any) {
    console.error('Error during website generation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during website generation.',
    });
  }
}

export async function handleRefine(req: Request, res: Response): Promise<void> {
  try {
    const { currentCode, modification, chatHistory } = req.body;

    if (!currentCode || typeof currentCode !== 'string') {
      res.status(400).json({
        success: false,
        error: 'The current website code is required to apply modifications.',
      });
      return;
    }

    if (!modification || typeof modification !== 'string' || modification.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'A modification instruction is required.',
      });
      return;
    }

    if (!isApiKeyConfigured()) {
      res.status(400).json({
        success: false,
        setupRequired: true,
        error: 'Google Gemini API key is not configured on the server. Please provide an API key in server/.env or configure it via the Setup dialog.',
      });
      return;
    }

    const website = await refineWebsite(currentCode, modification.trim(), chatHistory);

    res.status(200).json({
      success: true,
      data: website,
    });
  } catch (error: any) {
    console.error('Error during website refinement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while refining the website.',
    });
  }
}
