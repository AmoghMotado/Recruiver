// lib/authCookie.js
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

export function signUserToken(payload, maxAgeSeconds = 7 * 24 * 60 * 60) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: maxAgeSeconds });
}

export function setAuthCookie(res, token, maxAgeSeconds = 7 * 24 * 60 * 60) {
  const cookie = serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
  res.setHeader("Set-Cookie", cookie);
}
