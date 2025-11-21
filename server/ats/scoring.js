// server/ats/scoring.js
const natural = require("natural");
const keywordExtractor = require("keyword-extractor");

const { extractSkills } = require("./skills");
const {
  GENERAL_WEIGHTS,
  CAREER_LEVEL_ADJUST,
  ROLE_ADJUST,
} = require("./config");

const tokenizer = new natural.WordTokenizer();
const sentenceTokenizer = new natural.SentenceTokenizer();

/* ----------------------- shared helpers ----------------------- */

function normalizeWhitespace(text = "") {
  return text.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

/**
 * Very light header/footer clean-up:
 * - remove isolated page numbers
 * - remove lines like "Page 1 of 3"
 */
function stripObviousHeaders(text = "") {
  const lines = text.split(/\r?\n/);
  const cleaned = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;

    // "Page 1 of 3"
    if (/^page \d+ of \d+$/i.test(trimmed)) return false;
    // Just a number on its own
    if (/^\d+$/.test(trimmed)) return false;

    return true;
  });
  return cleaned.join("\n");
}

/* ----------------------- resume analysis ----------------------- */

function analyzeSections(text) {
  const lower = text.toLowerCase();

  const patterns = {
    summary: /(summary|objective|profile)/,
    experience: /(experience|work history|employment|professional experience)/,
    education: /(education|academics|academic background)/,
    skills: /(skills|technical skills|key skills|skills & abilities)/,
    projects: /(projects|personal projects|academic projects|side projects)/,
    certifications: /(certifications|licenses)/,
    achievements: /(achievements|awards|honors|accomplishments)/,
  };

  const present = {};
  let hits = 0;
  let coreHits = 0;
  const coreKeys = ["summary", "experience", "education", "skills", "projects"];

  for (const [key, re] of Object.entries(patterns)) {
    const ok = re.test(lower);
    present[key] = ok;
    if (ok) {
      hits++;
      if (coreKeys.includes(key)) coreHits++;
    }
  }

  const coreScore = coreHits / coreKeys.length;
  const extraScore =
    (hits - coreHits) / (Object.keys(patterns).length - coreKeys.length || 1);
  const score = Math.round(
    (0.8 * coreScore + 0.2 * Math.max(0, extraScore)) * 100
  );

  return { present, score };
}

function analyzeStructure(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const bulletLines = lines.filter((l) => /^[-•▪*]/.test(l)).length;
  const bulletRatio = lines.length ? bulletLines / lines.length : 0;

  const allCapsHeadings = lines.filter(
    (l) =>
      l.length > 3 &&
      l.length < 60 &&
      /^[A-Z0-9 .,&/-]+$/.test(l) &&
      !/\.$/.test(l)
  ).length;

  const hasTabs = /\t/.test(text);
  const hasPipes = /\|/.test(text);

  // Length suitability: 350–900 words ideal
  let lengthScore;
  if (wordCount < 250) lengthScore = 40;
  else if (wordCount < 350) lengthScore = 70;
  else if (wordCount <= 900) lengthScore = 100;
  else if (wordCount <= 1200) lengthScore = 75;
  else lengthScore = 40;

  // Formatting score
  let formattingScore = 50;
  if (bulletRatio >= 0.25 && bulletRatio <= 0.7) formattingScore += 20;
  if (bulletRatio >= 0.4 && bulletRatio <= 0.6) formattingScore += 10;
  if (allCapsHeadings >= 3) formattingScore += 10;
  if (hasTabs || hasPipes) formattingScore -= 20;

  formattingScore = clamp(formattingScore, 0, 100);

  // Parse-ability
  const nonAsciiRatio =
    (text.match(/[^\x00-\x7F]/g) || []).length / (text.length || 1);
  const avgLineLength = lines.length
    ? lines.reduce((s, l) => s + l.length, 0) / lines.length
    : 0;

  let parseScore = 80;
  if (nonAsciiRatio > 0.05) parseScore -= 20;
  if (avgLineLength > 110) parseScore -= 20;
  if (hasTabs || hasPipes) parseScore -= 10;
  if (bulletRatio < 0.1) parseScore -= 10;

  parseScore = clamp(parseScore, 0, 100);

  return {
    wordCount,
    bulletLines,
    bulletRatio,
    allCapsHeadings,
    hasTabs,
    hasPipes,
    lengthScore,
    formattingScore,
    parseScore,
  };
}

function analyzeReadability(text) {
  const sentences = sentenceTokenizer.tokenize(text);
  const words = tokenizer.tokenize(text);
  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;
  const avgWords = wordCount / sentenceCount;

  let readabilityScore;
  if (avgWords < 8) readabilityScore = 60;
  else if (avgWords <= 22) readabilityScore = 100;
  else if (avgWords <= 30) readabilityScore = 80;
  else readabilityScore = 50;

  return {
    avgSentenceLength: avgWords,
    readabilityScore,
  };
}

function analyzeContact(text) {
  const hasEmail =
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const hasPhone = /(\+?\d[\d\s\-]{8,})/.test(text);
  const hasLinkedIn = /(linkedin\.com\/in\/)/i.test(text);
  const hasGithub = /(github\.com\/)/i.test(text);
  const hasPortfolio =
    /(behance\.net|dribbble\.com|medium\.com|portfolio|devfolio\.co)/i.test(
      text
    );

  const hits = [
    hasEmail,
    hasPhone,
    hasLinkedIn,
    hasGithub,
    hasPortfolio,
  ].filter(Boolean).length;

  const scoreMap = [20, 45, 65, 85, 100];
  const score = scoreMap[hits] || 0;

  return {
    hasEmail,
    hasPhone,
    hasLinkedIn,
    hasGithub,
    hasPortfolio,
    score,
  };
}

function analyzeKeywords(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const alphaTokens = tokens.filter((t) => /^[a-z]+$/.test(t));
  const unique = new Set(alphaTokens);

  const richnessScore = clamp(Math.round((unique.size / 400) * 100), 30, 100);

  const keyTerms = keywordExtractor.extract(text, {
    language: "english",
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true,
  });

  const technical = keyTerms.filter(
    (k) => /[0-9.+#]/.test(k) || k.length > 10
  );
  const technicalScore = clamp(
    Math.round((technical.length / 40) * 100),
    20,
    100
  );

  return {
    uniqueTokenCount: unique.size,
    richnessScore,
    technicalKeywords: technical.slice(0, 80),
    technicalScore,
  };
}

function computeBalance(scores) {
  const values = Object.values(scores);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const stdev = Math.sqrt(variance);

  let score;
  if (stdev < 8) score = 100;
  else if (stdev < 15) score = 80;
  else if (stdev < 25) score = 60;
  else score = 40;

  return { mean, stdev, score };
}

/* -------------------- AI-style enhancements -------------------- */

function buildEnhancementsBySection(analysis) {
  const { sections, structure, readability, contact, keywords, skills } =
    analysis;

  const out = {
    global: [],
    summary: [],
    experience: [],
    skills: [],
    projects: [],
  };

  // Sections
  if (sections.score < 80) {
    const missing = Object.entries(sections.present)
      .filter(
        ([k, v]) =>
          !v && ["summary", "experience", "education", "skills", "projects"].includes(k)
      )
      .map(([k]) => capitalize(k));
    if (missing.length) {
      out.global.push(
        `Add or improve clear section headings for: ${missing.join(
          ", "
        )}. ATS parsers rely heavily on these markers.`
      );
    }
  }

  // Bullets & structure
  if (structure.bulletRatio < 0.25) {
    out.experience.push(
      "Convert dense paragraphs into bullet points, each describing one measurable achievement (action + metric)."
    );
  } else if (structure.bulletRatio > 0.7) {
    out.experience.push(
      "Group very long bullet lists into short paragraphs with a summary line so key outcomes stand out."
    );
  }

  // Length
  if (structure.lengthScore < 70) {
    if (structure.wordCount < 350) {
      out.experience.push(
        "Your resume is quite short. Add more detail on responsibilities, tools, and outcomes for each role."
      );
    } else {
      out.global.push(
        "Your resume is long for ATS. Trim older or less relevant experience and keep only what supports the target role."
      );
    }
  }

  // Readability
  if (readability.readabilityScore < 80) {
    out.experience.push(
      "Shorten very long sentences (20+ words) into two lines, each focusing on one action and one measurable result."
    );
  }

  // Contact
  if (contact.score < 80) {
    const missingBits = [];
    if (!contact.hasEmail) missingBits.push("professional email");
    if (!contact.hasPhone) missingBits.push("phone number");
    if (!contact.hasLinkedIn) missingBits.push("LinkedIn");
    if (!contact.hasGithub) missingBits.push("GitHub");
    if (!contact.hasPortfolio) missingBits.push("portfolio link");

    if (missingBits.length) {
      out.global.push(
        `Add a concise contact row at the top that includes: ${missingBits.join(
          ", "
        )}. ATS systems often show this as a header for recruiters.`
      );
    }
  }

  // Skills taxonomy
  if (!skills.flat.length) {
    out.skills.push(
      "List concrete tools and technologies (e.g. React, Node, PostgreSQL, AWS) in a dedicated Skills section."
    );
  } else if (skills.flat.length < 6) {
    out.skills.push(
      "Expand your Skills section with more specific technologies that match your target role."
    );
  }

  // Keywords
  if (keywords.technicalScore < 70) {
    out.skills.push(
      "Include more role-specific keywords inside your Experience bullets (not only in the Skills list) to improve ATS keyword ranking."
    );
  }

  if (!out.global.length && !out.summary.length && !out.experience.length) {
    out.global.push(
      "Your resume is structurally strong. For each job, keep tailoring your summary and skills to the exact JD keywords."
    );
  }

  // Deduplicate within each section
  for (const key of Object.keys(out)) {
    out[key] = Array.from(new Set(out[key]));
  }

  return out;
}

/* ---------------------- main: general ATS ---------------------- */

function computeGeneralATS(resumeText, options = {}) {
  const cleaned = stripObviousHeaders(resumeText || "");
  const text = normalizeWhitespace(cleaned);

  const careerLevel = String(options.careerLevel || "entry").toLowerCase();
  const role = String(options.role || "").toUpperCase(); // SWE / DATA / PM etc.

  const sections = analyzeSections(text);
  const structure = analyzeStructure(text);
  const readability = analyzeReadability(text);
  const contact = analyzeContact(text);
  const keywords = analyzeKeywords(text);
  const skills = extractSkills(text);

  const breakdownBase = {
    sections: sections.score,
    formatting: structure.formattingScore,
    parseability: structure.parseScore,
    length: structure.lengthScore,
    readability: readability.readabilityScore,
    contact: contact.score,
    richness: keywords.richnessScore,
    keywords: scoreTechnicalKeywords(keywords, skills),
  };

  const balance = computeBalance(breakdownBase);

  // Build dynamic weights taking into account level/role
  const weights = buildWeightsForProfile(careerLevel, role);

  const rawScore =
    weights.sections * breakdownBase.sections +
    weights.formatting * breakdownBase.formatting +
    weights.parseability * breakdownBase.parseability +
    weights.length * breakdownBase.length +
    weights.readability * breakdownBase.readability +
    weights.contact * breakdownBase.contact +
    weights.richness * breakdownBase.richness +
    weights.keywords * breakdownBase.keywords +
    weights.balance * balance.score;

  const score = Math.round(clamp(rawScore, 0, 100));

  const enhancementsBySection = buildEnhancementsBySection({
    sections,
    structure,
    readability,
    contact,
    keywords,
    skills,
  });

  const flatSuggestions = [
    ...enhancementsBySection.global,
    ...enhancementsBySection.summary,
    ...enhancementsBySection.experience,
    ...enhancementsBySection.skills,
    ...enhancementsBySection.projects,
  ].slice(0, 10);

  return {
    score,
    breakdown: {
      ...breakdownBase,
      balance: balance.score,
    },
    meta: {
      careerLevel,
      role,
      sections,
      structure,
      readability,
      contact,
      keywords,
      skills,
      balance,
      weights,
    },
    // for existing UI
    suggestions: flatSuggestions,
    // richer structure if you want to group by section on UI
    enhancements: enhancementsBySection,
  };
}

/* ---------------------- main: match ATS ------------------------ */

function computeMatchATS(resumeText, jdText, options = {}) {
  const resumeClean = normalizeWhitespace(stripObviousHeaders(resumeText || ""));
  const jdClean = normalizeWhitespace(stripObviousHeaders(jdText || ""));

  // Keyword sets
  const resumeKw = new Set(
    keywordExtractor.extract(resumeClean, {
      language: "english",
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: true,
    })
  );
  const jdKw = new Set(
    keywordExtractor.extract(jdClean, {
      language: "english",
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: true,
    })
  );

  const matchedKeywords = [...jdKw].filter((k) => resumeKw.has(k));
  const jdMissingKeywords = [...jdKw].filter((k) => !resumeKw.has(k));
  const resumeOnlyKeywords = [...resumeKw].filter((k) => !jdKw.has(k));

  const coverage =
    jdKw.size > 0 ? matchedKeywords.length / jdKw.size : 0;

  // Hard skill coverage using taxonomy
  const resumeSkills = extractSkills(resumeClean);
  const jdSkills = extractSkills(jdClean);

  const jdSkillSet = new Set(jdSkills.flat);
  const resumeSkillSet = new Set(resumeSkills.flat);
  const matchedHardSkills = [...jdSkillSet].filter((s) =>
    resumeSkillSet.has(s)
  );
  const missingHardSkills = [...jdSkillSet].filter(
    (s) => !resumeSkillSet.has(s)
  );

  const hardSkillCoverage =
    jdSkillSet.size > 0 ? matchedHardSkills.length / jdSkillSet.size : 0;

  // Semantic similarity via TF-IDF cosine
  const tfidf = new natural.TfIdf();
  tfidf.addDocument(resumeClean);
  tfidf.addDocument(jdClean);

  const dict = {};
  tfidf.listTerms(0).forEach((item, idx) => (dict[item.term] = idx));
  tfidf.listTerms(1).forEach((item) => {
    if (!(item.term in dict)) {
      dict[item.term] = Object.keys(dict).length;
    }
  });

  const size = Object.keys(dict).length;
  const rv = new Array(size).fill(0);
  const jv = new Array(size).fill(0);

  tfidf.listTerms(0).forEach((item) => {
    rv[dict[item.term]] = item.tfidf;
  });
  tfidf.listTerms(1).forEach((item) => {
    jv[dict[item.term]] = item.tfidf;
  });

  const dot = rv.reduce((s, v, i) => s + v * jv[i], 0);
  const normA = Math.sqrt(rv.reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(jv.reduce((s, v) => s + v * v, 0));
  const cosine = normA && normB ? dot / (normA * normB) : 0;

  const semanticScore = clamp(cosine * 100, 0, 100);
  const jdCoveragePercent = clamp(coverage * 100, 0, 100);
  const hardSkillCoveragePercent = clamp(hardSkillCoverage * 100, 0, 100);

  // Blend into a single match score
  const matchScore =
    0.4 * jdCoveragePercent +
    0.35 * hardSkillCoveragePercent +
    0.25 * semanticScore;

  // Reuse general ATS score
  const general = computeGeneralATS(resumeText, options);

  const blended = Math.round(
    0.7 * matchScore + 0.3 * general.score
  );

  return {
    score: clamp(blended, 0, 100),
    general,
    match: {
      // high-level view
      jdCoveragePercent,
      hardSkillCoveragePercent,
      semanticScore,
      // backward-compatible alias
      cosineSimilarity: semanticScore,
      keywordCoverage: jdCoveragePercent,
      // keyword diagnostics
      resumeKeywordCount: resumeKw.size,
      jdKeywordCount: jdKw.size,
      matchedKeywords: matchedKeywords.slice(0, 50),
      jdMissingKeywords: jdMissingKeywords.slice(0, 50),
      resumeOnlyKeywords: resumeOnlyKeywords.slice(0, 50),
      // hard skills diagnostics
      matchedHardSkills: matchedHardSkills.slice(0, 50),
      missingHardSkills: missingHardSkills.slice(0, 50),
    },
  };
}

/* ----------------------------- utils --------------------------- */

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function capitalize(s = "") {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildWeightsForProfile(careerLevel, role) {
  const base = { ...GENERAL_WEIGHTS };

  const levelAdj = CAREER_LEVEL_ADJUST[careerLevel] || {};
  const roleAdj = ROLE_ADJUST[role] || {};

  const weights = { ...base };
  for (const [k, mult] of Object.entries(levelAdj)) {
    if (weights[k] != null) weights[k] *= mult;
  }
  for (const [k, mult] of Object.entries(roleAdj)) {
    if (weights[k] != null) weights[k] *= mult;
  }

  // Normalise to sum ~ 1
  const sum = Object.values(weights).reduce((s, v) => s + v, 0) || 1;
  for (const k of Object.keys(weights)) {
    weights[k] = weights[k] / sum;
  }

  return weights;
}

function scoreTechnicalKeywords(keywords, skills) {
  // Base from keyword density
  let score = keywords.technicalScore;

  // Boost if we detect many structured skills, especially in multiple categories
  const catCount = Object.keys(skills.categories).length;
  const flatCount = skills.flat.length;

  if (flatCount >= 8) score += 10;
  if (flatCount >= 15) score += 10;
  if (catCount >= 3) score += 5;

  return clamp(score, 20, 100);
}

module.exports = {
  computeGeneralATS,
  computeMatchATS,
};
