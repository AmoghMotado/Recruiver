// server/middleware/auth.js
const { getSessionUser } = require("../lib/session");

// Any logged-in user
function requireAuth(req, res, next) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  req.user = user;
  next();
}

// Restrict by role
function requireRole(...allowedRoles) {
  const allowed = allowedRoles.map((r) => String(r).toUpperCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!allowed.includes(req.user.role || "")) {
      return res.status(403).json({ message: "Forbidden for this role" });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
