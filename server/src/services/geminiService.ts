import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, isApiKeyConfigured } from '../config/env.js';

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

function getGeminiClient(): GoogleGenerativeAI {
  if (!isApiKeyConfigured()) {
    throw new Error('GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in server/.env or configure it in the app settings.');
  }
  return new GoogleGenerativeAI(config.geminiApiKey);
}

const SYSTEM_PROMPT = `
You are WebGenius AI, an elite full-stack UI/UX architect and creative frontend engineer.
Your task is to generate complete, high-converting, accessible, responsive, and aesthetically stunning modern websites based on the user's prompt.

TECHNICAL CONSTRAINTS & REQUIREMENTS:
1. Production-Grade Output: The website must look like a modern $20,000 agency design.
2. Technology: Use HTML5, modern Tailwind CSS classes (via CDN), Google Fonts (e.g. Inter, Plus Jakarta Sans, Outfit), and vanilla JavaScript.
3. Live Interactivity: Add real interactivity using JavaScript (e.g., sticky navigation with blur, mobile hamburger menu toggle, interactive FAQ accordions, testimonial carousel/switcher, tab switchers, dynamic pricing toggles [Monthly/Annual with recalculation], search/filter bars, and contact modal/form submission with visual toast alert).
4. Do NOT use placeholder text like "Lorem ipsum" where meaningful copywriting can be generated. Write real, persuasive, compelling headlines, feature copy, metrics, and call-to-actions.
5. High quality visuals: Use Unsplash high-res imagery with descriptive keywords (e.g. https://images.unsplash.com/photo-...) and clean inline SVG icons (heroicons/feather style) for crisp rendering.
6. Responsive Design: Perfect mobile-first layout with desktop, tablet, and mobile breakpoints.
7. Return STRICT JSON with the following schema:
{
  "title": "Website Title / Brand",
  "summary": "Brief 1-2 sentence explanation of the design choices and typography",
  "html": "Body HTML content",
  "css": "Custom CSS classes or keyframe animations",
  "js": "Interactive JavaScript code (without script tags)",
  "fullCode": "<!DOCTYPE html><html lang='en'><head>... complete runnable standalone index.html combining CDN links, head, styles, body, and scripts ...</html>",
  "features": ["feature 1", "feature 2", "feature 3"],
  "palette": {
    "primary": "#hex",
    "secondary": "#hex",
    "background": "#hex",
    "text": "#hex"
  }
}
`;

const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

async function executeGeminiWithFallback(
  genAI: GoogleGenerativeAI,
  promptContent: string,
  systemPrompt: string
): Promise<string> {
  const modelsToTry = Array.from(
    new Set([config.geminiModel, ...FALLBACK_MODELS].filter(Boolean))
  );

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      });

      const response = await model.generateContent(promptContent);
      // If successful and different from current config model, update config model
      if (modelName !== config.geminiModel) {
        config.geminiModel = modelName;
        process.env.GEMINI_MODEL = modelName;
      }
      return response.response.text();
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${modelName} failed during generation:`, err.message);
      if (err.message && (err.message.includes('404') || err.message.includes('not found') || err.message.includes('no longer available'))) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All candidate Gemini models failed to generate content.');
}

export async function generateWebsite(userPrompt: string, styleTheme?: string): Promise<GeneratedWebsite> {
  const genAI = getGeminiClient();

  const promptContent = `Create a complete website for the following description:
"${userPrompt}"

${styleTheme ? `Requested visual style/theme: ${styleTheme}` : ''}

Remember to return valid JSON with "title", "summary", "html", "css", "js", "fullCode", "features", and "palette".
The "fullCode" MUST be a 100% self-contained, working HTML document with Tailwind CSS CDN (<script src="https://cdn.tailwindcss.com"></script>) and any necessary scripts included.`;

  const textResponse = await executeGeminiWithFallback(genAI, promptContent, SYSTEM_PROMPT);

  return parseGeminiJsonResponse(textResponse, userPrompt);
}

export async function refineWebsite(
  currentFullCode: string,
  modificationRequest: string,
  chatHistory?: { role: string; content: string }[]
): Promise<GeneratedWebsite> {
  const genAI = getGeminiClient();

  const promptContent = `You are refining an existing website.
Here is the current code of the website:
\`\`\`html
${currentFullCode.slice(0, 30000)}
\`\`\`

USER'S MODIFICATION REQUEST:
"${modificationRequest}"

Instructions:
1. Apply the user's modifications accurately while preserving the rest of the existing website structure, content, and design.
2. Return the updated website in the exact same JSON format with "title", "summary", "html", "css", "js", "fullCode", "features", and "palette".
3. "fullCode" must be the complete, updated standalone HTML document ready to render.`;

  const textResponse = await executeGeminiWithFallback(genAI, promptContent, SYSTEM_PROMPT);

  return parseGeminiJsonResponse(textResponse, modificationRequest);
}

function parseGeminiJsonResponse(rawText: string, fallbackTopic: string): GeneratedWebsite {
  let cleaned = rawText.trim();

  // Strip markdown code block if present despite responseMimeType
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Validate required fields
    if (!parsed.fullCode && parsed.html) {
      // Reconstruct fullCode if missing
      parsed.fullCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${parsed.title || 'Generated Website'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${parsed.css || ''}
  </style>
</head>
<body class="bg-slate-50 text-slate-900 font-sans antialiased">
  ${parsed.html}
  <script>
    ${parsed.js || ''}
  </script>
</body>
</html>`;
    }

    return {
      title: parsed.title || 'WebGenius Generated Website',
      summary: parsed.summary || `Custom website generated for: ${fallbackTopic}`,
      html: parsed.html || '',
      css: parsed.css || '',
      js: parsed.js || '',
      fullCode: parsed.fullCode || '',
      palette: parsed.palette || {
        primary: '#3b82f6',
        secondary: '#10b981',
        background: '#ffffff',
        text: '#0f172a',
      },
      features: Array.isArray(parsed.features) ? parsed.features : ['Responsive design', 'Tailwind CSS styling', 'Interactive features'],
    };
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', err, rawText);
    throw new Error('Gemini returned an unexpected response format. Please try again.');
  }
}
