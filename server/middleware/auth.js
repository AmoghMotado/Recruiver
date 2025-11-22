// server/middleware/auth.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev";

function getTokenFromRequest(req) {
  // 1) HTTP-only cookie (our main place)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // 2) Optional: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
}

// Any logged-in user
function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Try multiple possible keys for ID and role, then normalize.
    const id = decoded.id || decoded.userId || decoded.uid || null;

    const rawRole =
      decoded.role ||
      decoded.userRole ||
      decoded.portal ||
      decoded.accountType ||
      null;

    const role = rawRole ? String(rawRole).toUpperCase() : null;

    req.user = {
      id,
      role,          // always uppercased (e.g. "RECRUITER", "CANDIDATE")
      email: decoded.email || decoded.userEmail || null,
      _rawRole: rawRole, // for debugging
    };

    next();
  } catch (err) {
    console.error("JWT error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Restrict by role
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userRole = req.user.role
      ? String(req.user.role).toUpperCase()
      : "";

    const allowed = allowedRoles.map((r) => String(r).toUpperCase());

    if (!allowed.includes(userRole)) {
      console.warn("requireRole denied:", {
        userId: req.user.id,
        userRole: req.user.role,
        allowedRoles,
      });
      return res.status(403).json({ message: "Forbidden for this role" });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
