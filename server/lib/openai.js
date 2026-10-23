// server/lib/openai.js
// Lazily created OpenAI client. Returns null when OPENAI_API_KEY is not set so
// callers can fall back gracefully instead of crashing the whole server.
const OpenAI = require("openai");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

let client = null;

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60 * 1000,
      maxRetries: 2,
    });
  }
  return client;
}

module.exports = { getOpenAI, OPENAI_MODEL };
