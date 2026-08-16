/** Human-readable labels for server notification `type` */
export const NOTIFICATION_TYPE_LABELS = {
  profile_verified: "Profile approved",
  profile_rejected: "Profile rejected",
  profile_pending: "Profile pending",
  document_verified: "Document approved",
  document_rejected: "Document rejected",
  document_pending: "Document pending",
  chat_message: "Message",
  joining_instructions: "Joining instructions",
  training_update: "Training",
  hr_announcement: "Announcement",
};

export function notificationTypeLabel(type) {
  return NOTIFICATION_TYPE_LABELS[type] || type || "Notification";
}
