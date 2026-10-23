// server/index.js
// Load .env / .env.production the same way Next.js does, before anything
// reads process.env (the env check below runs before Next starts).
require("@next/env").loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const express = require("express");
const next = require("next");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { isProd, validateEnv, getAllowedOrigins } = require("./lib/env");

validateEnv();

const app = next({ dev: !isProd });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app
  .prepare()
  .then(() => {
    const server = express();

    server.disable("x-powered-by");
    // Behind a load balancer / Cloud Run, so secure cookies and req.ip work
    server.set("trust proxy", 1);

    // Content-Security-Policy is added once the redesign removes inline styles
    server.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

    const allowedOrigins = getAllowedOrigins();
    server.use(
      "/api",
      cors({
        origin(origin, cb) {
          // Same-origin requests and server-to-server calls send no Origin
          if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
          return cb(null, false);
        },
        credentials: true,
      })
    );

    // JSON parser (skip for ATS multipart routes to avoid PayloadTooLargeError)
    const jsonParser = express.json({ limit: "2mb" });
    server.use((req, res, next) => {
      if (req.path.startsWith("/api/ats/")) {
        return next();
      }
      return jsonParser(req, res, next);
    });

    server.use(cookieParser());
    server.use(morgan(isProd ? "combined" : "dev"));

    server.get("/healthz", (req, res) => res.json({ ok: true }));

    // Uploaded files, with per-file access checks (never served statically)
    server.use("/uploads", require("./routes/files"));

    // API routes (Express)
    server.use("/api/auth", require("./routes/auth"));
    server.use("/api/jobs", require("./routes/jobs"));
    server.use("/api/profile", require("./routes/profile"));
    server.use("/api/candidates", require("./routes/candidates"));
    server.use("/api/ats", require("./ats"));
    server.use("/api/aptitude", require("./routes/aptitude"));

    // Video interview config + candidate session (questions per job)
    server.use("/api/video-interview", require("./routes/videoInterview"));

    // AI video interview pipeline (upload, analyze, score)
    server.use("/api/interview", require("./routes/interview"));

    server.use("/api/chat", require("./routes/chat"));

    // Let Next.js handle all page routes and Next API routes
    server.all("*", (req, res) => handle(req, res));

    // Last-resort error handler: log the details, return a generic message
    // eslint-disable-next-line no-unused-vars
    server.use((err, req, res, next) => {
      console.error("Unhandled error:", err);
      if (res.headersSent) return;
      const status = err.status || err.statusCode || 500;
      res.status(status).json({ error: status === 500 ? "Server error" : err.message });
    });

    server.listen(PORT, () => {
      console.log(`➡ Server ready on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
  });
