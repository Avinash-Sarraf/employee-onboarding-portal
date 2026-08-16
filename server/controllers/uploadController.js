const Profile = require("../models/Profile");
const { ok, fail } = require("../utils/apiResponse");
const { isAllowedDocType } = require("../utils/documentConstants");
const { safeUnlinkByFileUrl, UPLOAD_SUBDIR } = require("../utils/fileStorage");
const { ensureEmployeeProfile } = require("../utils/ensureProfile");

exports.uploadDocument = async (req, res) => {
  try {
    const { userId, docType } = req.body;

    if (!userId || !docType) {
      return fail(res, "userId and docType are required", 400);
    }
    if (!isAllowedDocType(docType)) {
      return fail(res, "Invalid document type", 400);
    }
    if (!req.file) {
      return fail(res, "File is required", 400);
    }

    if (String(userId) !== String(req.user.id)) {
      return fail(
        res,
        "You can only upload documents for your own account",
        403
      );
    }

    let profile = await Profile.findOne({ userId: String(userId) });
    if (!profile) {
      profile = await ensureEmployeeProfile(userId);
    }
    if (!profile) return fail(res, "Profile not found", 404);

    const existing = profile.documents.find((d) => d.docType === docType);
    if (existing?.fileUrl) {
      safeUnlinkByFileUrl(existing.fileUrl);
    }

    profile.documents = profile.documents.filter((doc) => doc.docType !== docType);
    profile.documents.push({
      docType,
      fileName: req.file.filename,
      fileUrl: `${UPLOAD_SUBDIR}/${req.file.filename}`,
      status: "pending",
      verificationComment: "",
      reviewedAt: undefined,
      reviewedBy: undefined,
      uploadDate: new Date(),
    });

    await profile.save();
    return ok(res, {
      message: "Document uploaded successfully",
      data: { documents: profile.documents },
    });
  } catch (err) {
    if (req.file?.path) {
      try {
        const fs = require("fs");
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch {
        /* ignore */
      }
    }
    return fail(res, "Upload error", 500, { error: err.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { userId, docType } = req.body;

    if (!userId || !docType) {
      return fail(res, "userId and docType are required", 400);
    }
    if (!isAllowedDocType(docType)) {
      return fail(res, "Invalid document type", 400);
    }

    if (String(userId) !== String(req.user.id)) {
      return fail(res, "You can only delete your own documents", 403);
    }

    let profile = await Profile.findOne({ userId: String(userId) });
    if (!profile) {
      profile = await ensureEmployeeProfile(userId);
    }
    if (!profile) return fail(res, "Profile not found", 404);

    const doc = profile.documents.find((d) => d.docType === docType);
    if (!doc) {
      return fail(res, "Document not found", 404);
    }

    if (doc.fileUrl) safeUnlinkByFileUrl(doc.fileUrl);

    profile.documents = profile.documents.filter((d) => d.docType !== docType);
    await profile.save();

    return ok(res, {
      message: "Document deleted successfully",
      data: { documents: profile.documents },
    });
  } catch (err) {
    return fail(res, "Delete error", 500, { error: err.message });
  }
};
