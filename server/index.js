// server/index.js
const express = require("express");
const next = require("next");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app
  .prepare()
  .then(() => {
    const server = express();

    // CORS
    server.use(
      cors({
        origin: true,
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
    server.use(morgan("dev"));

    // Static uploads
    server.use(
      "/uploads",
      express.static(path.join(process.cwd(), "uploads"))
    );

    // API routes (Express – legacy / non-AI stuff)
    server.use("/api/auth", require("./routes/auth"));
    server.use("/api/jobs", require("./routes/jobs"));
    server.use("/api/profile", require("./routes/profile"));
    server.use("/api/candidates", require("./routes/candidates"));
    server.use("/api/ats", require("./ats"));
    server.use("/api/aptitude", require("./routes/aptitude"));
    server.use("/api/mock", require("./routes/mock"));

    // 🔹 NEW: Video interview config + candidate session (questions per job)
    server.use("/api/video-interview", require("./routes/videoInterview"));

    // AI video interview pipeline (upload, analyze, score)
    server.use("/api/interview", require("./routes/interview"));

    // Keep legacy mock interview flow on a different path
    server.use(
      "/api/mock-interview-legacy",
      require("./routes/mockInterview")
    );

    server.use("/api/chat", require("./routes/chat"));

    // Let Next.js handle all page routes and Next API routes
    server.all("*", (req, res) => handle(req, res));

    server.listen(PORT, () => {
      console.log(`➡ Server ready on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
  });
