/** Maps HR / document status strings to Badge tone */
export function hrVerificationTone(status) {
  if (status === "verified") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

export function docStatusTone(status) {
  if (status === "verified") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}
