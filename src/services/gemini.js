/**
 * ExamPrepp — Gemini 2.5 Flash service
 *
 * Four exported functions, one for each AI operation.
 * All functions return { data, error, warning } — never throw to the UI layer.
 *
 * Phase 1: analyzePastQuestions(files)
 * Phase 2: generateStudyGuide(pastQuestionFiles, lectureNoteFiles, predictions)
 * On-demand: generateFlashcards(guide)
 * On-demand: generateQuiz(guide)
 */

import {
  PROMPT_ANALYZE_PAST_QUESTIONS,
  PROMPT_GENERATE_STUDY_GUIDE,
  PROMPT_GENERATE_FLASHCARDS,
  PROMPT_GENERATE_QUIZ,
} from './prompts.js';

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

const MODEL = 'gemini-2.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const MIN_PAST_QUESTION_FILES = 3;
const OPTIMAL_PAST_QUESTION_FILES = 5;

// Retry config for transient server-side errors (503 overloaded, 500, 429 rate-limit).
// These are Google's infrastructure problems — exponential backoff resolves most of them
// within seconds, invisibly behind the Rising Insight animation.
const TRANSIENT_STATUSES = new Set([429, 500, 503]);
const MAX_RETRIES = 5;        // 5 total attempts (1 first try + 4 retries)
const BASE_RETRY_MS = 1000;   // starts at 1s, doubles each time → 1s, 2s, 4s, 8s max

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/**
 * Convert a browser File object to a Gemini inlineData part.
 * Supports PDF and image files (jpeg, png, webp, gif).
 */
async function fileToGeminiPart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({
        inlineData: {
          mimeType: file.type,
          data: base64,
        },
      });
    };
    reader.onerror = () => reject(new Error(`Could not read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert an array of File objects to Gemini parts in parallel.
 */
async function filesToGeminiParts(files) {
  return Promise.all(Array.from(files).map(fileToGeminiPart));
}

/**
 * Core Gemini API call with automatic retry + exponential backoff.
 *
 * Retries up to MAX_RETRIES times on transient server errors (503 overloaded,
 * 500 internal, 429 rate-limited). Non-transient errors (400 bad request,
 * 401 auth, safety blocks) fail immediately — retrying wouldn't help.
 *
 * @param {Array}   parts       - Array of Gemini content parts (inlineData + text)
 * @param {boolean} jsonMode    - If true, forces JSON response via responseMimeType
 * @param {number}  temperature - Generation temperature (0–1)
 */
async function callGemini(parts, { jsonMode = false, temperature = 0.2 } = {}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set in environment variables.');

  const generationConfig = { temperature };
  if (jsonMode) generationConfig.responseMimeType = 'application/json';

  // Stringify once — reused across every retry attempt.
  const requestBody = JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig,
  });

  let lastError;
  let delay = BASE_RETRY_MS;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff with ±500 ms jitter so multiple concurrent
      // requests don't hammer the API in lockstep.
      await new Promise((r) => setTimeout(r, delay + Math.random() * 500));
      delay *= 2;
    }

    let response;
    try {
      response = await fetch(`${BASE_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
    } catch (networkErr) {
      // Offline / DNS failure — treat as transient and retry.
      lastError = networkErr;
      console.warn(`[ExamPrepp] Network error (attempt ${attempt + 1}/${MAX_RETRIES}):`, networkErr.message);
      continue;
    }

    if (response.ok) {
      const body = await response.json();
      const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        const blockReason = body?.promptFeedback?.blockReason;
        if (blockReason) throw new Error(`Request blocked by Gemini safety filters: ${blockReason}`);
        throw new Error('Gemini returned an empty response.');
      }
      return text;
    }

    const errBody = await response.json().catch(() => ({}));
    const message = errBody?.error?.message || `Gemini API error (status ${response.status})`;

    if (TRANSIENT_STATUSES.has(response.status)) {
      // Server-side overload or rate-limit — retry with backoff.
      lastError = new Error(message);
      console.warn(`[ExamPrepp] Transient ${response.status} (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
      continue;
    }

    // Non-transient (400 bad request, 401 wrong key, etc.) — fail immediately.
    throw new Error(message);
  }

  throw lastError || new Error('Gemini is currently overloaded. Please try again in a moment.');
}

/**
 * Safely parse a JSON string, stripping markdown fences if present.
 * Returns the parsed object or throws a descriptive error.
 */
function safeParseJSON(text) {
  const clean = text
    .replace(/^```json\s*/m, '')
    .replace(/^```\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    console.error('[ExamPrepp] JSON parse failed. Raw response:\n', text);
    throw new Error('The AI returned a response in an unexpected format. Please try again.');
  }
}

/**
 * Phase 1 returns a mixed response: a human-readable summary, then a JSON block,
 * then a follow-up upload prompt. Pull the three pieces apart.
 *
 * Extraction cascade (most reliable first):
 *   1. Explicit ===JSON=== / ===END=== markers from the prompt
 *   2. A ```json (or bare ```) fenced code block
 *   3. The widest { ... } span as a last resort
 *
 * @returns {{ jsonString: string, summary: string, followUp: string }}
 */
function extractMixedResponse(text) {
  let match = text.match(/===JSON===\s*([\s\S]*?)\s*===END===/);
  if (!match) match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (match) {
    return {
      jsonString: match[1],
      summary: text.slice(0, match.index).trim(),
      followUp: text.slice(match.index + match[0].length).trim(),
    };
  }

  // Last resort: grab from the first { to the last }.
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    return {
      jsonString: text.slice(start, end + 1),
      summary: text.slice(0, start).trim(),
      followUp: text.slice(end + 1).trim(),
    };
  }

  console.error('[ExamPrepp] No JSON block found in Phase 1 response:\n', text);
  throw new Error('Could not locate the predictions in the AI response. Please try again.');
}

/**
 * Build the quality warning for Phase 1 based on file count.
 */
function buildFileCountWarning(count) {
  if (count < MIN_PAST_QUESTION_FILES) {
    return `Only ${count} past question ${count === 1 ? 'file' : 'files'} uploaded. ` +
      `ExamPrepp works best with at least ${MIN_PAST_QUESTION_FILES} years of past papers. ` +
      `Predictions may be less accurate than usual.`;
  }
  if (count > OPTIMAL_PAST_QUESTION_FILES) {
    return `${count} files uploaded. For best performance, ${OPTIMAL_PAST_QUESTION_FILES} years ` +
      `of past papers is optimal, but all files will be analysed.`;
  }
  return null;
}

// ─────────────────────────────────────────────
// Phase 1 — Analyze past questions
// ─────────────────────────────────────────────

/**
 * Analyze past question papers to identify high-probability exam topics.
 *
 * @param {File[]} files - Array of past question PDF/image files
 * @returns {{ data: { course, predictions, summary, followUp } | null, error: string | null, warning: string | null }}
 */
export async function analyzePastQuestions(files) {
  const fileArray = Array.from(files);
  const warning = buildFileCountWarning(fileArray.length);

  try {
    const fileParts = await filesToGeminiParts(fileArray);

    const parts = [
      ...fileParts,
      { text: PROMPT_ANALYZE_PAST_QUESTIONS },
    ];

    // Phase 1 returns a human-readable summary + a JSON block (between
    // ===JSON=== / ===END=== markers) + a follow-up upload prompt, so JSON mode
    // is OFF and we extract the JSON ourselves.
    const raw = await callGemini(parts, { jsonMode: false, temperature: 0.2 });
    const { jsonString, summary, followUp } = extractMixedResponse(raw);
    const parsed = safeParseJSON(jsonString);

    // Validate shape
    if (!parsed.course || !Array.isArray(parsed.predictions)) {
      throw new Error('Unexpected response shape from Gemini. Please try again.');
    }

    // Clamp probabilities to valid range
    const predictions = parsed.predictions.map((p) => ({
      topic: String(p.topic),
      probability: Math.min(95, Math.max(50, Math.round(Number(p.probability)))),
      reasoning: String(p.reasoning),
    }));

    return {
      data: { course: String(parsed.course), predictions, summary, followUp },
      error: null,
      warning,
    };
  } catch (err) {
    return { data: null, error: err.message, warning };
  }
}

// ─────────────────────────────────────────────
// Phase 2 — Generate study guide
// ─────────────────────────────────────────────

/**
 * Generate a grounded study guide using past questions + lecture notes + predictions.
 *
 * IMPORTANT: Both file arrays are always sent to Gemini together.
 * Past questions = context for what is likely to be tested.
 * Lecture notes  = source of truth for all factual content.
 *
 * @param {File[]}  pastQuestionFiles - From Phase 1 (sent again for context)
 * @param {File[]}  lectureNoteFiles  - Newly uploaded in Phase 2
 * @param {Array}   predictions       - predictions array from analyzePastQuestions()
 * @returns {{ data: { guide, topicsCovered } | null, error: string | null, warning: string | null }}
 */
export async function generateStudyGuide(pastQuestionFiles, lectureNoteFiles, predictions) {
  try {
    const [pastParts, notesParts] = await Promise.all([
      filesToGeminiParts(Array.from(pastQuestionFiles)),
      filesToGeminiParts(Array.from(lectureNoteFiles)),
    ]);

    // Build the topics list string to inject into the prompt
    const topicsList = predictions
      .map((p, i) => `${i + 1}. ${p.topic} — ${p.probability}% probability`)
      .join('\n');

    const prompt = PROMPT_GENERATE_STUDY_GUIDE.replace('{TOPICS_LIST}', topicsList);

    // File order matters: past questions first (context), then lecture notes (content)
    const parts = [
      ...pastParts,
      ...notesParts,
      { text: prompt },
    ];

    const guide = await callGemini(parts, { jsonMode: false, temperature: 0.5 });

    if (!guide || guide.trim().length < 100) {
      throw new Error('The generated study guide was too short. Please check your uploaded files and try again.');
    }

    // Extract topic names covered (headings from markdown)
    const topicsCovered = [...guide.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());

    return {
      data: { guide: guide.trim(), topicsCovered },
      error: null,
      warning: lectureNoteFiles.length === 0
        ? 'No lecture notes were uploaded. The study guide was generated from past paper patterns only — content accuracy may be limited.'
        : null,
    };
  } catch (err) {
    return { data: null, error: err.message, warning: null };
  }
}

// ─────────────────────────────────────────────
// On-demand — Generate flashcards
// ─────────────────────────────────────────────

/**
 * Generate flashcards from a completed study guide.
 *
 * @param {string} guide - Markdown study guide from generateStudyGuide()
 * @returns {{ data: { flashcards } | null, error: string | null, warning: null }}
 */
export async function generateFlashcards(guide) {
  try {
    const prompt = PROMPT_GENERATE_FLASHCARDS.replace('{GUIDE}', guide);
    const parts = [{ text: prompt }];

    const raw = await callGemini(parts, { jsonMode: true, temperature: 0.2 });
    const parsed = safeParseJSON(raw);

    if (!Array.isArray(parsed)) {
      throw new Error('Unexpected flashcard response format. Please try again.');
    }

    const flashcards = parsed.map((card) => ({
      front: String(card.front),
      back: String(card.back),
    }));

    return { data: { flashcards }, error: null, warning: null };
  } catch (err) {
    return { data: null, error: err.message, warning: null };
  }
}

// ─────────────────────────────────────────────
// On-demand — Generate quiz
// ─────────────────────────────────────────────

/**
 * Generate a multiple-choice quiz from a completed study guide.
 *
 * @param {string} guide - Markdown study guide from generateStudyGuide()
 * @returns {{ data: { quiz } | null, error: string | null, warning: null }}
 */
export async function generateQuiz(guide) {
  try {
    const prompt = PROMPT_GENERATE_QUIZ.replace('{GUIDE}', guide);
    const parts = [{ text: prompt }];

    const raw = await callGemini(parts, { jsonMode: true, temperature: 0.2 });
    const parsed = safeParseJSON(raw);

    if (!Array.isArray(parsed)) {
      throw new Error('Unexpected quiz response format. Please try again.');
    }

    const quiz = parsed.map((q) => ({
      question: String(q.question),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      answerIndex: Math.min(3, Math.max(0, Math.round(Number(q.answerIndex)))),
      explanation: String(q.explanation),
    }));

    return { data: { quiz }, error: null, warning: null };
  } catch (err) {
    return { data: null, error: err.message, warning: null };
  }
}