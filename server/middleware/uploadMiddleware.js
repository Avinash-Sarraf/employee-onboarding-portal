const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const {
  ALLOWED_MIMES,
  extFromMime,
  MAX_UPLOAD_BYTES,
} = require("../utils/documentConstants");
const { ensureUploadsDir, uploadsRoot } = require("../utils/fileStorage");

ensureUploadsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsRoot());
  },
  filename: (req, file, cb) => {
    const ext = extFromMime(file.mimetype);
    const rand = crypto.randomBytes(10).toString("hex");
    const uid = req.user?.id ? String(req.user.id).replace(/[^a-zA-Z0-9_-]/g, "") : "anon";
    const name = `doc_${uid}_${Date.now()}_${rand}${ext || ".bin"}`;
    cb(null, name);
  },
});

const dangerousName = (originalname) => {
  const base = path.basename(String(originalname || ""));
  return (
    !base ||
    base.includes("..") ||
    base.includes("/") ||
    base.includes("\\") ||
    base.length > 200
  );
};

const fileFilter = (req, file, cb) => {
  if (dangerousName(file.originalname)) {
    return cb(new Error("Invalid file name"), false);
  }
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    return cb(new Error("Only PDF, JPG, or PNG files are allowed"), false);
  }
  const ext = path.extname(file.originalname || "").toLowerCase();
  const allowedExt = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
  if (!allowedExt.has(ext)) {
    return cb(
      new Error("File extension must match type (.pdf, .jpg, .jpeg, .png)"),
      false
    );
  }
  const mimeExtOk =
    (file.mimetype === "application/pdf" && ext === ".pdf") ||
    (file.mimetype === "image/png" && ext === ".png") ||
    (file.mimetype === "image/jpeg" && (ext === ".jpg" || ext === ".jpeg"));
  if (!mimeExtOk) {
    return cb(new Error("File type and extension do not match"), false);
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});
