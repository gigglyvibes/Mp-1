import axiosClient from "./axiosClient";

/**
 * Admin API module
 * Strictly communicates with backend REST endpoints.
 * Errors bubble up to the UI callers.
 */

// Fetch dashboard metrics
export const getDashboardMetrics = async () => {
  const res = await axiosClient.get("/admin/dashboard");
  return res.data;
};

// Fetch users with filters
export const getUsers = async (params = {}) => {
  const res = await axiosClient.get("/admin/users", { params });
  return res.data;
};

// Verify student Aadhaar (sends decision: "verified" | "rejected")
export const verifyStudent = async (userId, { decision, status, reason = "" }) => {
  const finalDecision = decision || status;
  const res = await axiosClient.patch(`/admin/users/${userId}/verify`, {
    decision: finalDecision,
    reason,
  });
  return res.data;
};

// Suspend user
export const suspendUser = async (userId, { reason }) => {
  const res = await axiosClient.patch(`/admin/users/${userId}/suspend`, { reason });
  return res.data;
};

// Unsuspend user
export const unsuspendUser = async (userId) => {
  const res = await axiosClient.patch(`/admin/users/${userId}/unsuspend`);
  return res.data;
};

// Get jobs for moderation
export const getJobs = async (params = {}) => {
  const res = await axiosClient.get("/admin/jobs", { params });
  return res.data;
};

// Delete job (take down)
export const deleteJob = async (jobId) => {
  const res = await axiosClient.delete(`/admin/jobs/${jobId}`);
  return res.data;
};

// Get contact messages
export const getContactMessages = async () => {
  const res = await axiosClient.get("/admin/contact-messages");
  return res.data;
};

// Mark message as read
export const markContactMessageRead = async (messageId) => {
  const res = await axiosClient.patch(`/admin/contact-messages/${messageId}/read`);
  return res.data;
};
