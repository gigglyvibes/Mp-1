import axiosClient from "./axiosClient";

export const applyToJob = (jobId, payload) => axiosClient.post(`/applications/${jobId}`, payload);
export const getApplicantsForJob = (jobId) => axiosClient.get(`/applications/job/${jobId}`);
export const getMyApplications = (status) =>
  axiosClient.get("/applications/my-applications", { params: status ? { status } : {} });
export const respondToApplication = (id, decision) =>
  axiosClient.patch(`/applications/${id}/respond`, { decision });
export const withdrawApplication = (id) => axiosClient.patch(`/applications/${id}/withdraw`);
export const removeAcceptedStudent = (id) => axiosClient.patch(`/applications/${id}/respond`, { decision: "removed" });

export const getCompletionRequests = () => axiosClient.get("/applications/completion-requests");
export const requestWorkCompletion = (id) => axiosClient.patch(`/applications/${id}/complete`);
export const approveWorkCompletion = (id) => axiosClient.patch(`/applications/${id}/approve-completion`);
