// server/lib/env.js
// Central place for reading required configuration. Anything security
// sensitive fails loudly in production instead of silently falling back.
const crypto = require("crypto");

const isProd = process.env.NODE_ENV === "production";

let devJwtSecret = null;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (isProd) {
    throw new Error(
      "JWT_SECRET must be set to a random string of at least 32 characters in production."
    );
  }

  if (secret) return secret;

  if (!devJwtSecret) {
    devJwtSecret = crypto.randomBytes(48).toString("hex");
    console.warn(
      "[env] JWT_SECRET is not set. Using a random secret for this process; " +
        "everyone will be logged out when the server restarts."
    );
  }
  return devJwtSecret;
}

function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || process.env.BASE_URL || "";
  const list = raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (!isProd) list.push("http://localhost:3000");
  return list;
}

// Called once at boot so misconfiguration is caught before taking traffic.
function validateEnv() {
  getJwtSecret();

  const missing = [];
  if (!process.env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY (AI features)");
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    missing.push("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (Google sign-in)");
  }
  if (!process.env.SMTP_HOST) missing.push("SMTP_* (outgoing email)");
  if (missing.length) {
    console.warn("[env] Optional features disabled, missing: " + missing.join(", "));
  }
}

module.exports = { isProd, getJwtSecret, getAllowedOrigins, validateEnv };
