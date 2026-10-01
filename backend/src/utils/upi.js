const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

const normalizeUpi = (v) => String(v || "").trim().toLowerCase();

const isValidUpi = (v) => UPI_REGEX.test(normalizeUpi(v));

module.exports = {
  UPI_REGEX,
  normalizeUpi,
  isValidUpi,
};
