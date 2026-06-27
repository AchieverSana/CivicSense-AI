import fetch from 'node-fetch';

const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

class GeminiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const RETRYABLE_STATUSES = new Set([429, 500, 503]);
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(body: object): Promise<string> {
  const API_KEY = process.env.GEMINI_API_KEY!;
  let lastErr: GeminiError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as any;

    if (res.ok) {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    console.error('Gemini API error:', res.status, JSON.stringify(data));
    lastErr = new GeminiError(
      data.error?.message || `Gemini API request failed with status ${res.status}`,
      res.status
    );

    if (RETRYABLE_STATUSES.has(res.status) && attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * (attempt + 1));
      continue;
    }
    throw lastErr;
  }

  throw lastErr;
}

function buildTextBody(prompt: string) {
  return { contents: [{ parts: [{ text: prompt }] }] };
}

export interface IssueAnalysis {
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  department: string;
  priorityScore: number;
  estimatedFixDays: number;
  confidence: number;
  actionRecommendation: string;
}

const validCategories = [
  'Pothole', 'Garbage', 'Water leakage', 'Broken streetlight',
  'Road damage', 'Sewage', 'Tree fall', 'Other',
];

function buildAnalysisPrompt(context: string, location: string) {
  return `You are a civic infrastructure AI for ${location}, India. Classify this issue: "${context}".
The "category" field MUST be exactly one of these values (pick the closest match, use "Other" if none fit well): ${validCategories.join(', ')}.
Respond ONLY with valid JSON, no markdown:
{"category":"Pothole","severity":"High","title":"short title","description":"2 sentence description","department":"Roads Dept","priorityScore":70,"estimatedFixDays":7,"confidence":0.9,"actionRecommendation":"action here"}`;
}

function parseAnalysis(text: string): IssueAnalysis {
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
  if (!validCategories.includes(parsed.category)) {
    parsed.category = 'Other';
  }
  return parsed;
}

export async function analyzeIssueText(description: string, location: string): Promise<IssueAnalysis> {
  const prompt = buildAnalysisPrompt(description, location);
  const text = await callGemini(buildTextBody(prompt));
  return parseAnalysis(text);
}

export async function analyzeIssueImage(
  imageBuffer: Buffer,
  mimeType: string,
  location: string,
  userDesc?: string
): Promise<IssueAnalysis> {
  const base64Data = imageBuffer.toString('base64');
  const textPrompt = buildAnalysisPrompt(
    userDesc ? `${userDesc} (from the attached image)` : 'the civic infrastructure issue shown in this image',
    location
  );

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
          { text: textPrompt },
        ],
      },
    ],
  };

  try {
    const text = await callGemini(body);
    return parseAnalysis(text);
  } catch (err) {
    // Fall back to text-only if vision call fails (e.g. unsupported mime type)
    console.warn('Image analysis failed, falling back to text-only:', err);
    return analyzeIssueText(userDesc || 'civic infrastructure issue', location);
  }
}

export async function checkDuplicate(
  newTitle: string,
  newCategory: string,
  nearbyIssues: Array<{ id: string; title: string; category: string }>
): Promise<{ isDuplicate: boolean; duplicateId?: string; confidence: number }> {
  if (nearbyIssues.length === 0) return { isDuplicate: false, confidence: 0 };

  const prompt = `You are a duplicate-detection AI for civic issues. A new issue has been reported:
Title: "${newTitle}", Category: "${newCategory}"

Nearby existing issues (within 100m):
${nearbyIssues.map((i, idx) => `${idx + 1}. ID: ${i.id} | Title: "${i.title}" | Category: "${i.category}"`).join('\n')}

Determine if the new issue is a duplicate of any existing one. Issues are duplicates if they describe the same physical problem.
Respond ONLY with valid JSON, no markdown:
{"isDuplicate": false, "duplicateId": null, "confidence": 0.1}`;

  try {
    const text = await callGemini(buildTextBody(prompt));
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    return {
      isDuplicate: result.isDuplicate === true && result.confidence > 0.7,
      duplicateId: result.duplicateId || undefined,
      confidence: result.confidence || 0,
    };
  } catch {
    return { isDuplicate: false, confidence: 0 };
  }
}

export async function chatWithCivicAI(
  messages: Array<{ role: string; parts: string }>,
  city: string,
  stats: any
): Promise<string> {
  const history = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.parts}`)
    .join('\n');
  const prompt = `You are CivicSense AI for ${city}, India. Stats: ${stats.open} open issues, ${stats.resolved} resolved, avg ${stats.avgResolutionDays} days resolution. Answer concisely in 2-3 sentences.\n\n${history}\nAssistant:`;
  return await callGemini(buildTextBody(prompt));
}

export async function generatePredictiveInsights(
  city: string,
  trends: Array<{ category: string; count: number; growthRate: number }>
): Promise<string> {
  const prompt = `Generate 3 bullet predictive insights for ${city} based on these civic issue trends: ${JSON.stringify(trends)}. Start each with •`;
  return await callGemini(buildTextBody(prompt));
}
