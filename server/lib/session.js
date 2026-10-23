// server/lib/session.js
// JWT session helpers shared by the Express routes and the Next.js API routes.
const jwt = require("jsonwebtoken");
const { parse } = require("cookie");
const { getJwtSecret } = require("./env");

const SESSION_COOKIE = "token";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function signSession({ id, role }) {
  return jwt.sign({ id, role }, getJwtSecret(), { expiresIn: SESSION_TTL_SECONDS });
}

function readToken(req) {
  if (req.cookies && req.cookies[SESSION_COOKIE]) return req.cookies[SESSION_COOKIE];

  if (req.headers.cookie) {
    const cookies = parse(req.headers.cookie);
    if (cookies[SESSION_COOKIE]) return cookies[SESSION_COOKIE];
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) return authHeader.slice(7);

  return null;
}

// Returns { id, role } or null. Never throws.
function getSessionUser(req) {
  const token = readToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!decoded || !decoded.id) return null;
    return {
      id: String(decoded.id),
      role: decoded.role ? String(decoded.role).toUpperCase() : null,
    };
  } catch {
    return null;
  }
}

// Wraps a Next.js API route: rejects unauthenticated callers and, when roles
// are given, callers with another role. The handler receives req.user.
function withAuth(handler, { roles } = {}) {
  const allowed = roles ? roles.map((r) => r.toUpperCase()) : null;
  return async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (allowed && !allowed.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden for this role" });
    }
    req.user = user;
    return handler(req, res);
  };
}

module.exports = {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  getSessionUser,
  withAuth,
};
