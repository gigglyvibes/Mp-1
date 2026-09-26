import axiosClient from "./axiosClient";

export const initPaymentConfirmation = (agreementId) => axiosClient.post(`/payments/${agreementId}`);
export const confirmPayment = (id) => axiosClient.patch(`/payments/${id}/confirm`);
