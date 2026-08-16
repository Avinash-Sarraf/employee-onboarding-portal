/**
 * Consistent JSON responses for the API.
 * success: boolean — always present on normal handler responses.
 */

const ok = (res, payload = {}, status = 200) => {
  const body =
    typeof payload === "object" && payload !== null && !Array.isArray(payload)
      ? { success: true, ...payload }
      : { success: true, data: payload };
  return res.status(status).json(body);
};

const fail = (res, message = "Request failed", status = 400, extra = {}) => {
  return res.status(status).json({ success: false, message, ...extra });
};

module.exports = { ok, fail };
