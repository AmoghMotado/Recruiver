// server/ai/metrics.js

// Helper: split transcript into words & sentences
export function tokenizeTranscript(transcript = "") {
  const text = transcript.trim();
  const words = text ? text.split(/\s+/) : [];
  const sentences = text ? text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean) : [];
  return { words, sentences };
}

export function computeWordCount(transcript) {
  const { words } = tokenizeTranscript(transcript);
  return words.length;
}

export function estimateHesitation(transcript) {
  const lower = (transcript || "").toLowerCase();
  const fillerWords = ["um", "uh", "like", "you know", "actually", "basically", "sort of", "kind of"];
  let fillerCount = 0;

  fillerWords.forEach((fw) => {
    const regex = new RegExp(`\\b${fw.replace(" ", "\\s+")}\\b`, "g");
    const matches = lower.match(regex);
    if (matches) fillerCount += matches.length;
  });

  // Crude estimate: more filler words = more hesitation
  return {
    fillerCount,
    hesitationScore: Math.max(0, 100 - fillerCount * 5), // 0–100
  };
}

export function estimateGrammarAndLanguage(transcript) {
  const { words, sentences } = tokenizeTranscript(transcript);
  if (!words.length) return { languageGrammarScore: 0 };

  const avgSentenceLength = sentences.length ? words.length / sentences.length : words.length;
  const longWords = words.filter((w) => w.length >= 7).length;
  const longWordRatio = longWords / words.length;

  let score = 50;

  // Longer, structured sentences => better grammar
  if (avgSentenceLength >= 12 && avgSentenceLength <= 25) score += 20;
  // Higher proportion of long words => richer vocabulary
  if (longWordRatio > 0.2) score += 15;

  score = Math.max(0, Math.min(100, score));
  return { languageGrammarScore: score };
}

export function estimateSentiment(transcript) {
  const lower = (transcript || "").toLowerCase();

  const positiveWords = ["good", "great", "excited", "happy", "confident", "enjoy", "learn", "opportunity"];
  const negativeWords = ["bad", "worried", "nervous", "afraid", "upset", "problem", "issue", "difficult"];

  let pos = 0;
  let neg = 0;

  positiveWords.forEach((w) => {
    const regex = new RegExp(`\\b${w}\\b`, "g");
    const matches = lower.match(regex);
    if (matches) pos += matches.length;
  });

  negativeWords.forEach((w) => {
    const regex = new RegExp(`\\b${w}\\b`, "g");
    const matches = lower.match(regex);
    if (matches) neg += matches.length;
  });

  let sentiment = "neutral";
  if (pos > neg + 1) sentiment = "positive";
  else if (neg > pos + 1) sentiment = "negative";

  return {
    sentiment,
    sentimentScore: sentiment === "positive" ? 80 : sentiment === "negative" ? 30 : 60,
  };
}

export function estimateConfidence(transcript, hesitationInfo) {
  const { words } = tokenizeTranscript(transcript);
  const wordCount = words.length;
  const { fillerCount } = hesitationInfo;

  let score = 50;

  if (wordCount > 150) score += 20;
  if (wordCount > 250) score += 10;

  score -= fillerCount * 3;

  score = Math.max(0, Math.min(100, score));
  return { confidenceScore: score };
}

export function estimateKnowledgeAndContentDelivery(transcript) {
  const { words, sentences } = tokenizeTranscript(transcript);
  let knowledgeScore = 50;
  let contentDeliveryScore = 50;

  const uniqueWords = new Set(words.map((w) => w.toLowerCase())).size;
  const typeTokenRatio = words.length ? uniqueWords / words.length : 0;

  if (typeTokenRatio > 0.4) knowledgeScore += 20;
  if (typeTokenRatio > 0.5) knowledgeScore += 10;

  if (sentences.length >= 5) contentDeliveryScore += 15;
  if (sentences.length >= 8) contentDeliveryScore += 10;

  knowledgeScore = Math.max(0, Math.min(100, knowledgeScore));
  contentDeliveryScore = Math.max(0, Math.min(100, contentDeliveryScore));

  return { knowledgeScore, contentDeliveryScore };
}

export function computeAppearanceScore(eyeContactPercent) {
  // Appearance here = composed & engaged on camera (using eye contact %)
  if (!eyeContactPercent && eyeContactPercent !== 0) return 0;
  let score = eyeContactPercent; // 0–100 mapping
  score = Math.max(0, Math.min(100, score));
  return { appearanceScore: score };
}

// Emotion "timeline" from sentences (approx)
// Each sentence -> one "frame" with simple sentiment-based emotion
export function buildEmotionTimeline(transcript) {
  const { sentences } = tokenizeTranscript(transcript);
  return sentences.map((sentence, index) => {
    const { sentiment } = estimateSentiment(sentence);
    let emotion = "neutral";

    if (sentiment === "positive") emotion = "engaged";
    else if (sentiment === "negative") emotion = "concerned";

    return {
      index,
      text: sentence,
      emotion,
    };
  });
}

/**
 * Entry point: compute all metrics from transcript + eye contact +
 * (optionally) extra stats like fillerCount that you pass from frontend.
 */
export function computeAllMetrics({
  transcript = "",
  eyeContactPercent = 0,
  extra = {},
} = {}) {
  const wordCount = computeWordCount(transcript);
  const hesitationInfo = extra.hesitationInfo || estimateHesitation(transcript);
  const grammarInfo = estimateGrammarAndLanguage(transcript);
  const sentimentInfo = estimateSentiment(transcript);
  const confidenceInfo = estimateConfidence(transcript, hesitationInfo);
  const knowledgeContentInfo = estimateKnowledgeAndContentDelivery(transcript);
  const appearanceInfo = computeAppearanceScore(eyeContactPercent);
  const emotionTimeline = buildEmotionTimeline(transcript);

  return {
    wordCount,
    pauses: {
      estimatedPauses: hesitationInfo.fillerCount,
      hesitationScore: hesitationInfo.hesitationScore,
    },
    appearanceScore: appearanceInfo.appearanceScore,
    languageGrammarScore: grammarInfo.languageGrammarScore,
    confidenceScore: confidenceInfo.confidenceScore,
    contentDeliveryScore: knowledgeContentInfo.contentDeliveryScore,
    knowledgeScore: knowledgeContentInfo.knowledgeScore,
    sentiment: sentimentInfo.sentiment,
    sentimentScore: sentimentInfo.sentimentScore,
    emotionTimeline,
    eyeContactPercent,
  };
}
