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

    // Middlewares
    server.use(
      cors({
        origin: true,
        credentials: true,
      })
    );
    server.use(express.json());
    server.use(cookieParser());
    server.use(morgan("dev"));

    // Serve uploaded files statically
    server.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

    // API routes (Express)
    server.use("/api/auth", require("./routes/auth"));
    server.use("/api/jobs", require("./routes/jobs"));
    server.use("/api/profile", require("./routes/profile"));
    server.use("/api/ats", require("./routes/ats"));
    server.use("/api/mock", require("./routes/mock")); // Aptitude tests
    server.use("/api/mock-interview", require("./routes/mockInterview")); // ✅ AI Mock Interview
    server.use("/api/chat", require("./routes/chat")); // ✅ Chat assistant

    // Let Next handle everything else
    server.all("*", (req, res) => handle(req, res));

    server.listen(PORT, () =>
      console.log(`➡ Server ready on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
  });
