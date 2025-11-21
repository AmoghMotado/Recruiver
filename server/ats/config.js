// server/ats/config.js

// Global limits / constants
const MAX_FILE_MB = 5;

const GENERAL_WEIGHTS = {
  sections: 0.18,
  formatting: 0.15,
  parseability: 0.12,
  length: 0.10,
  readability: 0.10,
  contact: 0.12,
  richness: 0.13,
  keywords: 0.10,
  balance: 0.10,
};

// Minor tuning per career level (multipliers over base weights)
const CAREER_LEVEL_ADJUST = {
  entry: {
    readability: 1.1,
    sections: 1.05,
    keywords: 0.9,
  },
  mid: {
    keywords: 1.05,
    richness: 1.05,
  },
  senior: {
    keywords: 1.15,
    richness: 1.1,
    sections: 0.95,
  },
};

// Role-aware tuning (applied on top of career level)
const ROLE_ADJUST = {
  SWE: {
    keywords: 1.2,
    richness: 1.1,
  },
  DATA: {
    keywords: 1.2,
    richness: 1.05,
    readability: 1.05,
  },
  PM: {
    readability: 1.2,
    sections: 1.1,
    richness: 1.1,
  },
};

module.exports = {
  MAX_FILE_MB,
  GENERAL_WEIGHTS,
  CAREER_LEVEL_ADJUST,
  ROLE_ADJUST,
};
