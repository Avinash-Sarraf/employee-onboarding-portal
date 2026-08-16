/**
 * Join class names; falsy values are omitted.
 * @param {...(string|undefined|null|false)} parts
 * @returns {string}
 */
export function cn(...parts) {
  return parts.filter(Boolean).join(" ").trim();
}
