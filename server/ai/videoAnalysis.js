// server/ai/videoAnalysis.js
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze interview using OpenAI GPT-4 Turbo
 * Returns structured metrics for 5 evaluation parameters
 */
export async function analyzeInterviewWithOpenAI({
  transcript = "",
  eyeContactPercent = 0,
  wordCount = 0,
  durationSec = 0,
  extraStats = {},
} = {}) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("[analyzeInterviewWithOpenAI] OPENAI_API_KEY not set");
      return getDefaultMetrics();
    }

    // Validate inputs
    if (!transcript || transcript.trim().length === 0) {
      console.warn(
        "[analyzeInterviewWithOpenAI] No transcript provided, using default metrics"
      );
      return getDefaultMetrics();
    }

    const transcriptLength = transcript.length;
    console.log(
      `[analyzeInterviewWithOpenAI] Analyzing transcript (${transcriptLength} chars, ${wordCount} words, ${durationSec}s)`
    );

    // Create analysis prompt for GPT-4
    const analysisPrompt = createAnalysisPrompt(
      transcript,
      eyeContactPercent,
      wordCount,
      durationSec
    );

    console.log(
      "[analyzeInterviewWithOpenAI] Calling OpenAI GPT-4 Turbo..."
    );

    // Call OpenAI API
    const message = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert AI interview evaluator. Analyze the interview transcript and provide structured JSON feedback on 5 key parameters. Return ONLY valid JSON, no markdown, no extra text, no code blocks.",
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = message.choices[0].message.content || "";

    console.log(
      "[analyzeInterviewWithOpenAI] Response received, length:",
      responseText.length
    );

    // Extract JSON from response
    const metrics = parseAnalysisResponse(responseText);

    if (!metrics) {
      console.warn("[analyzeInterviewWithOpenAI] Failed to parse metrics, using defaults");
      return getDefaultMetrics();
    }

    // Validate and normalize scores
    const normalizedMetrics = normalizeMetrics(metrics, {
      eyeContactPercent,
      wordCount,
      durationSec,
    });

    console.log(
      "[analyzeInterviewWithOpenAI] Analysis complete:",
      normalizedMetrics
    );

    return normalizedMetrics;
  } catch (error) {
    console.error("[analyzeInterviewWithOpenAI] Error:", error.message);
    // Return safe defaults if analysis fails
    return getDefaultMetrics();
  }
}

/**
 * Create the prompt for GPT-4 to analyze interview
 */
function createAnalysisPrompt(
  transcript,
  eyeContactPercent,
  wordCount,
  durationSec
) {
  return `Analyze the following interview transcript and provide scores for 5 key parameters.

INTERVIEW TRANSCRIPT:
"""
${transcript}
"""

CONTEXT:
- Eye Contact: ${eyeContactPercent}%
- Word Count: ${wordCount}
- Duration: ${durationSec}s
- Speaking Rate: ${durationSec > 0 ? Math.round(wordCount / (durationSec / 60)) : 0} WPM

EVALUATE AND PROVIDE SCORES (0-100) FOR:

1. **Appearance & Professionalism**: How professional, confident, and well-presented is the candidate? (Consider clarity of expression, composure, and overall presence in the transcript)

2. **Language & Grammar**: Quality of language, grammar, vocabulary, articulation. How well-articulated and clear are the responses?

3. **Confidence**: How confident and decisive does the candidate sound? Assess conviction, clarity, and minimal hesitation.

4. **Content Delivery**: How well structured, clear, relevant, and organized are the answers? Do they address questions directly?

5. **Technical Knowledge**: Does the candidate demonstrate expertise, deep understanding, and relevant knowledge? Quality of examples and technical depth.

ALSO PROVIDE:
- "sentiment": "positive", "neutral", or "negative"
- "emotionalTone": Brief 1-2 sentence description (max 100 chars)
- "fillerCount": Estimate of filler words (um, uh, like, you know, actually, basically)
- "speakingPace": "slow" (< 90 WPM), "normal" (90-160 WPM), or "fast" (> 160 WPM)

CRITICAL: Return ONLY this JSON structure, nothing else:
{
  "appearanceScore": <0-100>,
  "languageGrammarScore": <0-100>,
  "confidenceScore": <0-100>,
  "contentDeliveryScore": <0-100>,
  "knowledgeScore": <0-100>,
  "sentiment": "<positive|neutral|negative>",
  "emotionalTone": "<description>",
  "fillerCount": <number>,
  "speakingPace": "<slow|normal|fast>",
  "sentimentScore": <0-100>
}`;
}

/**
 * Parse OpenAI response and extract JSON metrics
 */
function parseAnalysisResponse(responseText) {
  try {
    // Try to extract JSON from response (in case there's markdown or extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.warn("[parseAnalysisResponse] No JSON found in response");
      console.log("[parseAnalysisResponse] Response text:", responseText.substring(0, 300));
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    const requiredFields = [
      "appearanceScore",
      "languageGrammarScore",
      "confidenceScore",
      "contentDeliveryScore",
      "knowledgeScore",
    ];

    for (const field of requiredFields) {
      if (typeof parsed[field] !== "number") {
        console.warn(`[parseAnalysisResponse] Missing or invalid field: ${field}`);
        return null;
      }
    }

    console.log("[parseAnalysisResponse] Successfully parsed JSON");
    return parsed;
  } catch (error) {
    console.error("[parseAnalysisResponse] JSON parse error:", error.message);
    return null;
  }
}

/**
 * Normalize metrics to ensure all values are within valid ranges
 */
function normalizeMetrics(metrics, context = {}) {
  if (!metrics) {
    console.warn("[normalizeMetrics] No metrics provided, using defaults");
    return getDefaultMetrics();
  }

  const { eyeContactPercent = 0, wordCount = 0, durationSec = 0 } = context;

  // Clamp scores to 0-100
  const clamp = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
  };

  // Calculate WPM
  const wpm =
    durationSec > 0 ? Math.round(wordCount / (durationSec / 60)) : 0;

  const normalized = {
    appearanceScore: clamp(metrics.appearanceScore),
    languageGrammarScore: clamp(metrics.languageGrammarScore),
    confidenceScore: clamp(metrics.confidenceScore),
    contentDeliveryScore: clamp(metrics.contentDeliveryScore),
    knowledgeScore: clamp(metrics.knowledgeScore),
    sentimentScore: clamp(metrics.sentimentScore ?? 60),
    sentiment: validateSentiment(metrics.sentiment),
    eyeContactPercent: clamp(eyeContactPercent),
    emotionalTone:
      typeof metrics.emotionalTone === "string"
        ? metrics.emotionalTone.substring(0, 150)
        : "Neutral emotional tone.",
    wordCount,
    wpm,
    fillerCount: clamp(metrics.fillerCount ?? 0),
    speakingPace:
      metrics.speakingPace === "fast"
        ? "fast"
        : metrics.speakingPace === "slow"
        ? "slow"
        : "normal",
    pauses: {
      estimatedPauses: clamp(metrics.fillerCount ?? 0),
    },
  };

  return normalized;
}

/**
 * Validate sentiment value
 */
function validateSentiment(sentiment) {
  if (
    sentiment === "positive" ||
    sentiment === "negative" ||
    sentiment === "neutral"
  ) {
    return sentiment;
  }
  return "neutral";
}

/**
 * Return default metrics if analysis fails
 */
export function getDefaultMetrics() {
  return {
    appearanceScore: 75,
    languageGrammarScore: 75,
    confidenceScore: 70,
    contentDeliveryScore: 72,
    knowledgeScore: 70,
    sentimentScore: 60,
    sentiment: "neutral",
    eyeContactPercent: 50,
    emotionalTone: "Neutral emotional tone detected.",
    wordCount: 0,
    wpm: 0,
    fillerCount: 5,
    speakingPace: "normal",
    pauses: {
      estimatedPauses: 5,
    },
  };
}