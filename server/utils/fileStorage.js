const fs = require("fs");
const path = require("path");

const UPLOAD_SUBDIR = "uploads";

function uploadsRoot() {
  return path.join(__dirname, "..", UPLOAD_SUBDIR);
}

function ensureUploadsDir() {
  const root = uploadsRoot();
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
  return root;
}

/** fileUrl stored on profile, e.g. "uploads/abc.pdf" */
function absolutePathFromFileUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== "string") return null;
  const normalized = fileUrl.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..")) return null;
  if (!normalized.startsWith(`${UPLOAD_SUBDIR}/`)) return null;
  const base = path.basename(normalized);
  if (!base || base === "." || base === "..") return null;
  return path.join(uploadsRoot(), base);
}

function safeUnlinkByFileUrl(fileUrl) {
  const abs = absolutePathFromFileUrl(fileUrl);
  if (!abs) return;
  try {
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* ignore missing / race */
  }
}

module.exports = {
  UPLOAD_SUBDIR,
  uploadsRoot,
  ensureUploadsDir,
  absolutePathFromFileUrl,
  safeUnlinkByFileUrl,
};
