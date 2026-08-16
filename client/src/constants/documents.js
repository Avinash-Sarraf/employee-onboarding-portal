/** Mirror server document types — single source for employee UI */
export const DOCUMENT_TYPES = [
  { value: "RESUME", label: "Résumé / CV" },
  { value: "AADHAR", label: "Aadhaar" },
  { value: "PAN", label: "PAN card" },
  { value: "DEGREE", label: "Degree / marksheets" },
  { value: "NDA", label: "NDA (signed)" },
  { value: "EXPERIENCE_CERTIFICATE", label: "Experience certificate" },
];

export const DOCUMENT_TYPE_VALUES = DOCUMENT_TYPES.map((d) => d.value);

export const DOC_STATUS_LABEL = {
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

export const statusBadgeClass = (status) => {
  switch (status) {
    case "verified":
      return "bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30";
    case "rejected":
      return "bg-rose-100 text-rose-800 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30";
    default:
      return "bg-amber-100 text-amber-900 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30";
  }
};
