const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { fail } = require("./utils/apiResponse");
const { MAX_UPLOAD_BYTES } = require("./utils/documentConstants");
const { ensureUploadsDir } = require("./utils/fileStorage");

dotenv.config();
connectDB();

ensureUploadsDir();
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", require("./routes/authRoutes"));

const hrRoutes = require("./routes/hrRoutes");
app.use("/api/hr", hrRoutes);

app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/training", require("./routes/trainingRoutes"));
app.use("/api/announcements", require("./routes/announcementRoutes"));
app.use("/api/onboarding", require("./routes/onboardingRoutes"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const UPLOAD_USER_FACING_MESSAGES = new Set([
  "Only PDF, JPG, or PNG files are allowed",
  "Invalid file name",
  "File extension must match type (.pdf, .jpg, .jpeg, .png)",
  "File type and extension do not match",
]);

// Multer / upload errors
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (req.file?.path) {
    try {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch {
      /* ignore */
    }
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      const mb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
      return fail(res, `File too large (max ${mb}MB)`, 400);
    }
    return fail(res, err.message || "Upload failed", 400);
  }

  if (err && UPLOAD_USER_FACING_MESSAGES.has(err.message)) {
    return fail(res, err.message, 400);
  }

  console.error(err);
  return fail(res, err.message || "Internal server error", 500);
});

const http = require("http");
const { initRealtime } = require("./realtime/socketServer");

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
initRealtime(httpServer);

httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nPort ${PORT} is already in use. Stop the other process or set PORT in .env to a free port.\n` +
        `  Windows: netstat -ano | findstr :${PORT}   then   taskkill /PID <pid> /F\n`
    );
    process.exit(1);
  }
  console.error("Server failed to start:", err);
  process.exit(1);
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (HTTP + WebSocket)`);
});
