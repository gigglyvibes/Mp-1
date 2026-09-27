import axiosClient from "./axiosClient";

export const createAgreement = (applicationId, payload) =>
  axiosClient.post(`/agreements/${applicationId}`, payload);
export const getAgreement = (id) => axiosClient.get(`/agreements/${id}`);
export const signAgreement = (id, fullName) => axiosClient.patch(`/agreements/${id}/sign`, { fullName });

export const getAgreementByApplication = (applicationId) =>
  axiosClient.get(`/agreements/application/${applicationId}`);
