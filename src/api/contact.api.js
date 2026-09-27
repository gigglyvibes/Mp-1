import axiosClient from "./axiosClient";

export const submitContactMessage = (payload) => axiosClient.post("/contact", payload);
