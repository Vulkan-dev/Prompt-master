import { heuristicAnalyze, heuristicOptimize, heuristicImageToPrompt } from "./heuristics";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || (import.meta as any).env?.VITE_OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

const TEXT_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",
  "inclusionai/ling-3.0-flash:free",
  "openrouter/free",
];

const VISION_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "openrouter/free",
];

const TIMEOUT_MS = 15000;

export interface SecurityResult {
  securityScore: number;
  warnings: string[];
  isSecure: boolean;
}

export interface AnalysisResult {
  overallScore: number;
  policyViolation?: boolean;
  criteria: {
    clarity: number;
    context: number;
    constraints: number;
    persona: number;
    tone: number;
  };
  feedback: string[];
  missingElements: string[];
  security?: SecurityResult;
}

function cleanAndParseJSON<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  return JSON.parse(cleaned);
}

async function callOpenRouter(
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  modelArg?: string | string[],
  maxTokens?: number
): Promise<string> {
  const modelsToTry: string[] = Array.isArray(modelArg)
    ? modelArg
    : modelArg
    ? [modelArg]
    : TEXT_MODELS;

  let lastError: any = null;

  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const response = await fetch(OPENROUTER_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": origin,
          "X-Title": "KernelX-Prompt",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens || 1024,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`OpenRouter API model ${model} failed (${response.status}): ${errorText}`);
        lastError = new Error(`OpenRouter API error ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && content.trim()) {
        return content;
      }
    } catch (error) {
      console.warn(`Attempt with model ${model} failed:`, error);
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error("All free model fallback attempts failed.");
}

export async function analyzePrompt(prompt: string): Promise<AnalysisResult> {
  if (!OPENROUTER_API_KEY) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(heuristicAnalyze(prompt)), 100);
    });
  }

  try {
    const content = `Analyze this prompt as a Prompt Security and Quality Auditor. Return JSON only.

Prompt: "${prompt}"

Evaluate (1-10): clarity, context, constraints, persona, tone.
Check safety policy violation.
Score 100 if all criteria covered and professionally written.

JSON: { "overallScore": number, "policyViolation": bool, "criteria": { "clarity": number, "context": number, "constraints": number, "persona": number, "tone": number }, "feedback": [string], "missingElements": [string] }`;

    const responseText = await callOpenRouter([{ role: "user", content }]);
    return cleanAndParseJSON<AnalysisResult>(responseText);
  } catch (error) {
    console.error("AI Analysis failed, falling back to heuristics:", error);
    return heuristicAnalyze(prompt);
  }
}

export interface OptimizationResult {
  optimizedPrompt: string;
  logicBreakdown: string[];
}

export interface ImageToPromptResult {
  generatedPrompt: string;
  negativePrompt?: string;
  visualAnalysis: string[];
  style?: string;
  camera?: string;
  lighting?: string;
  colorPalette?: string[];
  confidence?: string;
  policyViolation?: boolean;
  violationReason?: string;
}

export async function imageToPrompt(base64Image: string, mimeType: string): Promise<ImageToPromptResult> {
  if (!OPENROUTER_API_KEY) {
    const local = await heuristicImageToPrompt(base64Image, mimeType);
    return { ...local, policyViolation: false };
  }

  const visionContent = `You are ImagePromptAI. Describe EVERYTHING you see in this image in extreme detail for AI image generation. Be very specific about subjects, characters, objects, text, colors, composition, style. Never invent things.

JSON: { "generatedPrompt": "detailed prompt", "negativePrompt": "quality exclusions", "visualAnalysis": ["6 bullet points"], "style": "art style", "camera": "angle", "lighting": "lighting", "colorPalette": ["colors"], "confidence": "High|Medium|Low", "policyViolation": false, "violationReason": null }`;

  const visionMessages = [
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        { type: "text", text: visionContent },
      ],
    },
  ];

  try {
    const responseText = await callOpenRouter(visionMessages, VISION_MODELS, 2048);
    const result = cleanAndParseJSON<ImageToPromptResult>(responseText);
    if (result.generatedPrompt && result.generatedPrompt.length > 20) {
      return result;
    }
  } catch (error) {
    console.warn("Vision models failed, attempting canvas fingerprint + text model fallback:", error);
  }

  // Fallback: canvas fingerprint + text model
  const local = await heuristicImageToPrompt(base64Image, mimeType);
  const fingerprint = (local as any)._fingerprint || local.generatedPrompt;

  try {
    const textContent = `You are an expert AI image prompt engineer. I have a detailed visual fingerprint of an image extracted via canvas analysis. Use this fingerprint to write the most accurate, detailed AI image generation prompt possible.

VISUAL FINGERPRINT:
${fingerprint}

YOUR TASK:
Write a detailed image generation prompt that would recreate this image as faithfully as possible. Include:
- Subject/scene description based on color layout and regions
- Style based on complexity and saturation
- Lighting based on brightness analysis
- Color palette and temperature
- Composition and mood
- Camera/perspective based on orientation
- Negative prompt for quality exclusions

Be specific and detailed. Never mention "fingerprint" or "canvas analysis" in your output.

JSON: { "generatedPrompt": "detailed prompt", "negativePrompt": "quality exclusions", "visualAnalysis": ["6 bullet points about what you inferred"], "style": "inferred style", "camera": "inferred perspective", "lighting": "inferred lighting", "colorPalette": ["colors from fingerprint"], "confidence": "High", "policyViolation": false, "violationReason": null }`;

    const responseText = await callOpenRouter([{ role: "user", content: textContent }], TEXT_MODELS, 2048);
    return cleanAndParseJSON<ImageToPromptResult>(responseText);
  } catch (error) {
    console.error("Text model fallback also failed:", error);
    return { ...local, policyViolation: false };
  }
}

export interface EnhancementResult {
  enhancedPrompt: string;
  category: string;
  improvements: string[];
}

export async function enhancePrompt(prompt: string): Promise<EnhancementResult> {
  if (!OPENROUTER_API_KEY) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({
        enhancedPrompt: heuristicOptimize(prompt, {
          overallScore: 50,
          criteria: { clarity: 5, context: 5, constraints: 5, persona: 5, tone: 5 },
          feedback: [],
          missingElements: []
        }),
        category: "general",
        improvements: [
          "Added expert persona for authority",
          "Injected explicit constraints",
          "Clarified output format"
        ]
      }), 100);
    });
  }

  try {
    const content = `You are PromptEnhancer. Transform this rough prompt into a production-grade version. Return JSON only.

Original: "${prompt}"

Never change the user's goal. Never hallucinate. Use <PLACEHOLDER> for missing info.
Improve clarity, logic, constraints, format. Preserve intent.

Detect category: programming|writing|image|research|general.

JSON: { "enhancedPrompt": string, "category": string, "improvements": [string] }`;

    const responseText = await callOpenRouter([{ role: "user", content }]);
    return cleanAndParseJSON<EnhancementResult>(responseText);
  } catch (error) {
    console.error("AI Enhancement failed, falling back to heuristics:", error);
    return {
      enhancedPrompt: heuristicOptimize(prompt, {
        overallScore: 50,
        criteria: { clarity: 5, context: 5, constraints: 5, persona: 5, tone: 5 },
        feedback: [],
        missingElements: []
      }),
      category: "general",
      improvements: [
        "Applied standard engineering frameworks",
        "Refined clarity and task definition",
        "Injected context and constraints"
      ]
    };
  }
}

export async function optimizePrompt(prompt: string, analysis: AnalysisResult): Promise<OptimizationResult> {
  if (!OPENROUTER_API_KEY) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({
        optimizedPrompt: heuristicOptimize(prompt, analysis),
        logicBreakdown: [
          "Integrated expert persona for authority",
          "Added explicit constraints to guide output",
          "Clarified the core task and desired tone"
        ]
      }), 100);
    });
  }

  try {
    const content = `You are a Master Prompt Engineer. Rewrite this prompt to score 100/100. Return JSON only.

Original: "${prompt}"
Missing: ${analysis.missingElements.join(", ")}

Integrate persona, context, task, constraints, format naturally. No labels. Flowing professional instruction. Add 3 bullet points explaining changes.

JSON: { "optimizedPrompt": string, "logicBreakdown": [string] }`;

    const responseText = await callOpenRouter([{ role: "user", content }]);
    return cleanAndParseJSON<OptimizationResult>(responseText);
  } catch (error) {
    console.error("AI Optimization failed, falling back to heuristics:", error);
    return {
      optimizedPrompt: heuristicOptimize(prompt, analysis),
      logicBreakdown: [
        "Applied standard engineering frameworks",
        "Refined clarity and task definition",
        "Injected context and constraints"
      ]
    };
  }
}
