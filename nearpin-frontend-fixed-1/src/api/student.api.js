import axiosClient from "./axiosClient";

export const getStudentById = (studentId) => axiosClient.get(`/students/${studentId}`);
