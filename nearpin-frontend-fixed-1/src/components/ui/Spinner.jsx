import React from "react";

const Spinner = ({ size = 20, className = "" }) => (
  <span
    className={`inline-block animate-spin rounded-full border-2 border-ink/15 border-t-signal ${className}`}
    style={{ width: size, height: size }}
    role="status"
    aria-label="Loading"
  />
);

export default Spinner;
