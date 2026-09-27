import React from "react";
import { Link } from "react-router-dom";

const VARIANTS = {
  signal: "btn-signal",
  outline: "btn-outline",
  ghost: "btn-ghost",
};

/**
 * Shared button. Renders a <Link> when `to` is given, an <a> when `href`
 * is given, otherwise a native <button>.
 */
const Button = ({ variant = "signal", to, href, className = "", children, ...props }) => {
  const classes = `${VARIANTS[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
