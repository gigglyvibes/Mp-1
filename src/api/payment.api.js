import axiosClient from "./axiosClient";

export const getPaymentConfirmation = (agreementId) =>
  axiosClient.get(`/payments/agreement/${agreementId}`);

export const initPaymentConfirmation = (agreementId) =>
  axiosClient.post(`/payments/${agreementId}`);

export const confirmPayment = (id, data = {}) =>
  axiosClient.patch(`/payments/${id}/confirm`, data);

export const disputePayment = (id, data) =>
  axiosClient.patch(`/payments/${id}/dispute`, data);

export const getDisputedPayments = () =>
  axiosClient.get("/payments/admin/disputed");
