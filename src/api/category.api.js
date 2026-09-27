import axiosClient from "./axiosClient";

export const getCategories = () => axiosClient.get("/job-types");
export const getJobTypes = () => axiosClient.get("/job-types");
export const getCategoryJobs = () => axiosClient.get("/job-types/jobs");
