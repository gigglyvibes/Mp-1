import axiosClient from "./axiosClient";

export const rateStudent = (applicationId, payload) => axiosClient.post(`/ratings/${applicationId}`, payload);
export const getStudentRatings = (studentId) => axiosClient.get(`/ratings/student/${studentId}`);
