import React from "react";

const TONES = {
  signal: "bg-signal/15 text-signal",
  teal: "bg-teal/15 text-teal-light",
  gold: "bg-gold/15 text-gold",
  neutral: "bg-white/5 text-faint",
};

const Badge = ({ tone = "neutral", children, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wide ${TONES[tone]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
