import React from "react";
import { Link } from "react-router-dom";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "All Jobs", to: "/jobs" },
      { label: "Nearby Jobs", to: "/nearby" },
      { label: "Categories", to: "/categories" },
      { label: "How It Works", to: "/how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "FAQ", to: "/faq" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms" },
    ],
  },
];

const Footer = () => (
  <footer className="border-t border-line bg-charcoal-footer text-ink">
    <div className="container-app py-16">
      <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-signal" />
            <span className="font-display text-lg font-bold text-ink">Nearpin</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted">
            Nearpin connects nearby business owners with students for temporary micro jobs,
            matched by real-time distance. We only help people find each other — we’re not
            responsible for work quality, payments, or disputes between users.
          </p>
          <div className="mt-6 flex gap-3">
            {["Instagram", "LinkedIn", "X"].map((s) => (
              <a
                key={s}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-xs text-muted hover:border-signal hover:text-signal transition"
                aria-label={s}
              >
                {s[0]}
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-teal-light">{col.title}</p>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-footerlink hover:text-signal transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Nearpin. All rights reserved.</p>
        <p className="font-mono">support@nearpin.app · +91 00000 00000</p>
      </div>
    </div>
  </footer>
);

export default Footer;
