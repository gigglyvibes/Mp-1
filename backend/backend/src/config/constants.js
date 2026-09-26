module.exports = {
  USER_ROLES: {
    STUDENT: "student",
    BUSINESS: "business",
    ADMIN: "admin",
  },
  JOB_STATUS: {
    DRAFT: "draft",
    PUBLISHED: "published",
    ACTIVE: "active",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
  },
  WORK_COMPLETION_STATUS: {
    IN_PROGRESS: "in_progress",
    COMPLETION_REQUESTED: "completion_requested",
    APPROVED: "approved",
  },
  APPLICATION_STATUS: {
    APPLIED: "applied",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    WITHDRAWN: "withdrawn",
    REMOVED: "removed",
    COMPLETED: "completed",
  },
  VERIFICATION_STATUS: {
    PENDING: "pending",
    VERIFIED: "verified",
    REJECTED: "rejected",
  },
  DEFAULT_SEARCH_RADIUS_KM: Number(process.env.DEFAULT_SEARCH_RADIUS_KM) || 5,
  MIN_STUDENT_AGE: 18,
  MAX_STUDENT_AGE: 26,
};
