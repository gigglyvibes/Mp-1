import axiosClient from "./axiosClient";

/**
 * Rating API module
 * Communicates with backend endpoints. Errors propagate to callers.
 */

export const rateStudent = async (applicationId, payload) => {
  return await axiosClient.post(`/ratings/${applicationId}`, payload);
};

export const rateBusiness = async (applicationId, payload) => {
  return await axiosClient.post(`/ratings/business/${applicationId}`, payload);
};

export const getApplicationRatings = async (applicationId) => {
  return await axiosClient.get(`/ratings/application/${applicationId}`);
};

export const getStudentRatings = async (studentId) => {
  return await axiosClient.get(`/ratings/student/${studentId}`);
};

export const hasReviewedLocally = (_applicationId, _role) => {
  return false;
};
