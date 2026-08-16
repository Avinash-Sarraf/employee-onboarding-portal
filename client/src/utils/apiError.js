/**
 * Centralized API error parsing for axios failures.
 */

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

const STATUS_MESSAGES = {
  400: "Please check your input and try again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "This action conflicts with existing data.",
  413: "The file is too large.",
  422: "Please fix the highlighted fields.",
  429: "Too many requests. Please wait a moment.",
  500: "Server error. Please try again later.",
  503: "Service temporarily unavailable.",
};

/**
 * @param {unknown} error — axios error or Error
 * @param {string} [fallback]
 * @returns {string}
 */
export function getApiErrorMessage(error, fallback = DEFAULT_MESSAGE) {
  if (!error) return fallback;

  const axiosErr = error;
  const data = axiosErr.response?.data;
  const status = axiosErr.response?.status;

  if (data?.message && typeof data.message === "string") {
    return data.message;
  }

  if (data?.error && typeof data.error === "string") {
    return data.error;
  }

  if (status && STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status];
  }

  if (axiosErr.message && axiosErr.message !== "Network Error") {
    return axiosErr.message;
  }

  if (!axiosErr.response) {
    return "Network error. Check your connection and try again.";
  }

  return fallback;
}

/**
 * @param {unknown} error
 * @returns {Record<string, string>}
 */
export function getApiFieldErrors(error) {
  const data = error?.response?.data;
  if (data?.fieldErrors && typeof data.fieldErrors === "object") {
    return data.fieldErrors;
  }
  if (data?.errors && typeof data.errors === "object") {
    return data.errors;
  }
  return {};
}

/**
 * @param {unknown} error
 * @param {{ generalKey?: string }} [opts]
 * @returns {Record<string, string>}
 */
export function mapApiErrorToFormState(error, opts = {}) {
  const generalKey = opts.generalKey || "general";
  const fieldErrors = getApiFieldErrors(error);
  if (Object.keys(fieldErrors).length > 0) {
    return fieldErrors;
  }
  return { [generalKey]: getApiErrorMessage(error) };
}
