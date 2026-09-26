import axiosClient from "./axiosClient";

export const getCategories = () => axiosClient.get("/categories");
export const getCategoryJobs = () => axiosClient.get("/categories/jobs");
