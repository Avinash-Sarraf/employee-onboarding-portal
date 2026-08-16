/**
 * Allowed onboarding documents — keep in sync with Profile schema enum.
 */
const ALLOWED_DOC_TYPES = [
  "RESUME",
  "AADHAR",
  "PAN",
  "DEGREE",
  "NDA",
  "EXPERIENCE_CERTIFICATE",
];

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
]);

/** Extension we will store — derived from MIME, not client filename */
const MIME_TO_EXT = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
};

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function isAllowedDocType(docType) {
  return ALLOWED_DOC_TYPES.includes(String(docType || "").trim());
}

const DOC_TYPE_LABELS = {
  RESUME: "Résumé / CV",
  AADHAR: "Aadhaar",
  PAN: "PAN card",
  DEGREE: "Degree / marksheets",
  NDA: "NDA",
  EXPERIENCE_CERTIFICATE: "Experience certificate",
};

function docTypeLabel(docType) {
  return DOC_TYPE_LABELS[String(docType || "").trim()] || docType || "Document";
}

function extFromMime(mimetype) {
  return MIME_TO_EXT[mimetype] || null;
}

module.exports = {
  ALLOWED_DOC_TYPES,
  ALLOWED_MIMES,
  MIME_TO_EXT,
  MAX_UPLOAD_BYTES,
  isAllowedDocType,
  extFromMime,
  docTypeLabel,
};
