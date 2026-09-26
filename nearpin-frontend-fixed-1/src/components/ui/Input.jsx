import React from "react";

const Input = React.forwardRef(({ label, error, className = "", ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label-field">{label}</label>}
    <input ref={ref} className={`input-field ${error ? "border-signal" : ""} ${className}`} {...props} />
    {error && <p className="mt-1 font-mono text-xs text-signal-dark">{error}</p>}
  </div>
));

Input.displayName = "Input";
export default Input;
