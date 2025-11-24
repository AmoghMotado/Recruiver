// server/middleware/requireAuth.js
// Small bridge so older routes that use "../middleware/requireAuth"
// keep working while the real logic lives in auth.js

const auth = require("./auth");

// If auth.js exports { requireAuth, ... }
if (auth && typeof auth.requireAuth === "function") {
  module.exports = auth.requireAuth;
} else {
  // Fallback: if auth.js directly exports a function
  module.exports = auth;
}