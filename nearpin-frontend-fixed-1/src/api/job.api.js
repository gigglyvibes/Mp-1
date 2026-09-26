import axiosClient from "./axiosClient";

export const listJobs = (params) => axiosClient.get("/jobs", { params });
export const getNearbyJobs = (params) => axiosClient.get("/jobs/nearby", { params });
export const getJobById = (id) => axiosClient.get(`/jobs/${id}`);
export const getMyJobs = () => axiosClient.get("/jobs/business/my-jobs");
export const createJob = (formData) =>
  axiosClient.post("/jobs", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateJob = (id, payload) => axiosClient.patch(`/jobs/${id}`, payload);
export const publishJob = (id) => axiosClient.patch(`/jobs/${id}/publish`);
export const cancelJob = (id) => axiosClient.patch(`/jobs/${id}/cancel`);
