export const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export const normalizeUpi = (v) => String(v || "").trim().toLowerCase();

export const isValidUpi = (v) => UPI_REGEX.test(normalizeUpi(v));
