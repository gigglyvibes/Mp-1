import axiosClient from "./axiosClient";

export const getStudentById = (studentId) => axiosClient.get(`/students/${studentId}`);

export const getProfile = () => axiosClient.get("/students/profile");

export const updateProfile = (data) => axiosClient.patch("/students/profile", data);
