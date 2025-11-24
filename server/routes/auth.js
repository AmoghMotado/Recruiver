// server/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../lib/firebaseAdmin");
const router = express.Router();
// ---- Robust fetch polyfill (works with node-fetch v2/v3 or Node18 global) ----
let fetchImpl = global.fetch;
if (!fetchImpl) {
  const nodeFetch = require("node-fetch");
  fetchImpl = nodeFetch.default || nodeFetch;
}
const fetch = (...args) => fetchImpl(...args);



// ---------- Google config ----------
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  `${BASE_URL.replace(/\/$/, "")}/api/auth/google/callback`;

// ---------- Helpers ----------

function normalizeRole(raw) {
  if (!raw) return null;
  const v = String(raw).toUpperCase();
  if (v === "RECRUITER" || v === "CANDIDATE") return v;
  return null;
}

// Find user by email in Firestore
async function findUserByEmail(email) {
  const snap = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

// Create JWT
function createJwt(userId, role) {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// Set auth cookie
function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ---------- Email / Password auth ----------

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      password,
      role, // CANDIDATE or RECRUITER
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedRole = normalizeRole(role) || "CANDIDATE";

    // Check if user already exists
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    // Create user document in Firestore
    const userRef = await db.collection("users").add({
      firstName: firstName || "",
      lastName: lastName || "",
      email: normalizedEmail,
      phone: phone || "",
      dob: dob || "",
      gender: gender || "",
      role: normalizedRole,
      passwordHash,
      authProvider: "password",
      createdAt: now,
      updatedAt: now,
    });

    console.log(
      "[AUTH] Created email/password user:",
      userRef.id,
      normalizedEmail,
      "role:",
      normalizedRole
    );

    const user = {
      id: userRef.id,
      firstName: firstName || "",
      lastName: lastName || "",
      email: normalizedEmail,
      role: normalizedRole,
    };

    const token = createJwt(user.id, user.role);
    setAuthCookie(res, token);

    return res.status(201).json({ token, user });
  } catch (err) {
    console.error("Register error (Firebase):", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
// body must include: { email, password, role }
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const requestedRole = normalizeRole(role);
    if (!requestedRole) {
      return res.status(400).json({ error: "Invalid or missing role" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await findUserByEmail(normalizedEmail);
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const storedRole = normalizeRole(user.role) || "CANDIDATE";

    // ---- CRITICAL ROLE CHECK ----
    if (storedRole !== requestedRole) {
      console.warn(
        "[AUTH] Email login blocked due to role mismatch for",
        normalizedEmail,
        "stored:",
        storedRole,
        "requested:",
        requestedRole
      );
      return res
        .status(403)
        .json({ error: "Invalid role selected for this account" });
    }
    // -----------------------------

    const token = createJwt(user.id, storedRole);
    setAuthCookie(res, token);

    const safeUser = {
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
      role: storedRole,
    };

    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("Login error (Firebase):", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ---------- Google OAuth 2.0 auth ----------

function buildGoogleAuthUrl(state) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    console.error(
      "Google OAuth not configured. GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI missing."
    );
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// GET /api/auth/google
// query: role=CANDIDATE|RECRUITER, redirect=/some/path
router.get("/google", (req, res) => {
  try {
    const rawRole = (req.query.role || req.query.type || "CANDIDATE").toString();
    const role = normalizeRole(rawRole) || "CANDIDATE";

    const redirect =
      req.query.redirect ||
      (role === "RECRUITER"
        ? "/recruiter/dashboard"
        : "/candidate/dashboard");

    const statePayload = { role, redirect };
    const state = Buffer.from(JSON.stringify(statePayload)).toString(
      "base64url"
    );

    const url = buildGoogleAuthUrl(state);
    console.log("Google OAuth URL:", url);
    return res.redirect(url);
  } catch (err) {
    console.error("GET /api/auth/google error:", err);
    return res.status(500).send("Failed to start Google login");
  }
});

// Backward compatibility: /api/auth/oauth-login → /api/auth/google
router.get("/oauth-login", (req, res) => {
  const params = new URLSearchParams(req.query).toString();
  return res.redirect(`/api/auth/google?${params}`);
});

// GET /api/auth/google/callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    let payload = { role: "CANDIDATE", redirect: "/candidate/dashboard" };
    if (state) {
      try {
        payload = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      } catch (e) {
        console.warn("Failed to parse Google state:", e);
      }
    }

    const requestedRole = normalizeRole(payload.role) || "CANDIDATE";
    const redirectUrl =
      payload.redirect ||
      (requestedRole === "RECRUITER"
        ? "/recruiter/dashboard"
        : "/candidate/dashboard");

    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error("Google token error:", tokenRes.status, txt);
      return res.status(500).send("Failed to exchange Google auth code");
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    const idToken = tokenJson.id_token;

    if (!accessToken && !idToken) {
      console.error("No tokens from Google:", tokenJson);
      return res.status(500).send("No tokens received from Google");
    }

    // 2. Fetch user info
    let profile = null;

    if (accessToken) {
      const profileRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo?alt=json",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      profile = await profileRes.json();
    }

    if (!profile || !profile.email) {
      console.error("Google profile missing email:", profile);
      return res.status(500).send("Failed to fetch Google profile");
    }

    const email = String(profile.email).toLowerCase().trim();
    const firstName = profile.given_name || (profile.name || "").split(" ")[0];
    const lastName =
      profile.family_name ||
      (profile.name || "").split(" ").slice(1).join(" ");

    console.log(
      "[AUTH] Google callback for email:",
      email,
      "requested role:",
      requestedRole
    );

    // 3. Find or create user in Firestore
    let user = await findUserByEmail(email);
    let userId;

    if (!user) {
      const now = new Date().toISOString();
      const userRef = await db.collection("users").add({
        firstName: firstName || "",
        lastName: lastName || "",
        email,
        role: requestedRole,
        authProvider: "google",
        createdAt: now,
        updatedAt: now,
      });
      userId = userRef.id;
      user = {
        id: userId,
        firstName: firstName || "",
        lastName: lastName || "",
        email,
        role: requestedRole,
      };
      console.log(
        "[AUTH] Created new Google user:",
        userId,
        email,
        requestedRole
      );
    } else {
      userId = user.id;
      const storedRole = normalizeRole(user.role) || "CANDIDATE";

      // ---- CRITICAL ROLE CHECK FOR GOOGLE ----
      if (storedRole !== requestedRole) {
        console.warn(
          "[AUTH] Google login blocked due to role mismatch for",
          email,
          "stored:",
          storedRole,
          "requested:",
          requestedRole
        );

        // Redirect back to homepage/login with error details
        const url = new URL(BASE_URL);
        url.pathname = "/";
        url.searchParams.set("error", "invalid_role");
        url.searchParams.set("expected", storedRole);
        url.searchParams.set("tried", requestedRole);

        return res.redirect(url.toString());
      }
      // ----------------------------------------

      const updateData = {
        authProvider: "google",
        updatedAt: new Date().toISOString(),
      };

      // If old user had no role set, persist the storedRole
      if (!user.role) {
        updateData.role = storedRole;
      }

      await db.collection("users").doc(userId).set(updateData, { merge: true });

      user.role = storedRole;
      console.log(
        "[AUTH] Re-used existing user:",
        userId,
        email,
        "role:",
        user.role
      );
    }

    // 4. Issue JWT + set cookie
    const finalRole = normalizeRole(user.role) || requestedRole;
    const token = createJwt(userId, finalRole);
    setAuthCookie(res, token);

    console.log(
      "[AUTH] Google login success for:",
      email,
      "role:",
      finalRole,
      "→ redirect",
      redirectUrl
    );

    // 5. Redirect back to app
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("GET /api/auth/google/callback error:", err);
    return res.status(500).send("Google login failed");
  }
});

// ---------- Optional: simple logout ----------
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ ok: true });
});

module.exports = router;