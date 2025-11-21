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
    // We sign as { id, role, email } in routes/auth.js
    req.user = {
      id: decoded.id || decoded.userId, // support both just in case
      role: decoded.role,
      email: decoded.email,
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
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden for this role" });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
