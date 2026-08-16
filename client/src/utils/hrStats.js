/**
 * @param {Array<{ status: string, documents?: any[], onboardingState?: string }>} employees
 */
export function computeHrDashboardStats(employees) {
  const total = employees.length;
  const verification = { pending: 0, verified: 0, rejected: 0 };
  let employeesWithPendingDocs = 0;
  const onboardingByState = {};

  for (const e of employees) {
    const s = e.status || "pending";
    if (s === "verified") verification.verified += 1;
    else if (s === "rejected") verification.rejected += 1;
    else verification.pending += 1;

    const docs = e.documents || [];
    if (docs.some((d) => d.status === "pending")) {
      employeesWithPendingDocs += 1;
    }

    const os = e.onboardingState || "awaiting_profile";
    onboardingByState[os] = (onboardingByState[os] || 0) + 1;
  }

  return {
    total,
    verification,
    employeesWithPendingDocs,
    onboardingByState,
  };
}
