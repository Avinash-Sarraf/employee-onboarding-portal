import { validateName } from "./formValidation";

const hasText = (value) => String(value ?? "").trim().length > 0;

export const validateHrAccountField = (field, value) => {
  const v = String(value ?? "").trim();
  if (field === "name") return validateName(v, "Full name") || "";
  if (field === "phone") {
    if (!v) return "";
    if (v.length < 8) return "Enter a valid phone number.";
  }
  if (field === "jobTitle" && v.length > 120) return "Job title is too long.";
  if (field === "department" && v.length > 120) return "Department is too long.";
  return "";
};

export const validateModuleField = (field, value) => {
  if (field === "title") {
    const v = String(value ?? "").trim();
    if (!v) return "Module title is required.";
    if (v.length < 3) return "Module title must be at least 3 characters.";
  }
  if (field === "estimatedMinutes") {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return "Estimated minutes must be 0 or more.";
  }
  return "";
};

export const validateAnnouncementField = (field, value) => {
  const v = String(value ?? "").trim();
  if (field === "title") {
    if (!v) return "Announcement title is required.";
    if (v.length < 3) return "Announcement title must be at least 3 characters.";
  }
  if (field === "body") {
    if (!v) return "Announcement body is required.";
    if (v.length < 8) return "Announcement body must be at least 8 characters.";
  }
  return "";
};

export const validateProfessionalAssignment = (data, locked) => {
  if (locked) return {};
  const errors = {};
  if (!hasText(data.professionalRole)) errors.professionalRole = "Role is required.";
  if (!hasText(data.professionalDepartment)) errors.professionalDepartment = "Department is required.";
  if (!hasText(data.professionalEmploymentType)) {
    errors.professionalEmploymentType = "Select employment type.";
  }
  if (!hasText(data.professionalJoiningDate)) {
    errors.professionalJoiningDate = "Joining date is required.";
  }
  if (!hasText(data.professionalWorkLocation)) {
    errors.professionalWorkLocation = "Work location is required.";
  }
  return errors;
};

export const validateHrDeskField = (field, value) => {
  const v = String(value ?? "").trim();
  if (field === "joiningInstructions") {
    if (v.length > 2000) return "Joining instructions must be under 2000 characters.";
  }
  if (field === "reportingInstructions") {
    if (v.length > 2000) return "Reporting instructions must be under 2000 characters.";
  }
  if (field === "officeLocation") {
    if (v.length > 200) return "Office location must be under 200 characters.";
  }
  if (field === "assignedJoiningDate") {
    if (v) {
      const date = new Date(v);
      if (isNaN(date.getTime())) return "Enter a valid date.";
    }
  }
  return "";
};

export const validateHrDeskSettings = (data) => {
  const errors = {};
  const joiningInstructionsErr = validateHrDeskField("joiningInstructions", data.joiningInstructions);
  if (joiningInstructionsErr) errors.joiningInstructions = joiningInstructionsErr;
  
  const reportingInstructionsErr = validateHrDeskField("reportingInstructions", data.reportingInstructions);
  if (reportingInstructionsErr) errors.reportingInstructions = reportingInstructionsErr;
  
  const officeLocationErr = validateHrDeskField("officeLocation", data.officeLocation);
  if (officeLocationErr) errors.officeLocation = officeLocationErr;
  
  const assignedJoiningDateErr = validateHrDeskField("assignedJoiningDate", data.assignedJoiningDate);
  if (assignedJoiningDateErr) errors.assignedJoiningDate = assignedJoiningDateErr;
  
  return errors;
};

