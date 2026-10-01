import React from "react";

const TERMS = [
  "This platform only connects Business Owners and Students.",
  "The platform does not guarantee work quality.",
  "Business Owners are responsible for verifying work before confirming payment.",
  "Students must perform assigned work honestly.",
  "Fraudulent activities may permanently suspend accounts.",
  "Student Aadhaar information is used only for identity and age-eligibility verification.",
  "User information must remain secure.",
];

const TermsPage = () => (
  <section className="container-app py-16">
    <p className="eyebrow">Legal</p>
    <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Terms &amp; Conditions</h1>
    <p className="mt-3 font-mono text-xs text-muted">Last updated: August 2026</p>

    <ol className="mt-10 max-w-2xl space-y-5">
      {TERMS.map((term, i) => (
        <li key={term} className="flex gap-4 border-t border-line pt-5">
          <span className="font-mono text-sm text-signal">{String(i + 1).padStart(2, "0")}</span>
          <p className="text-sm leading-relaxed text-ink">{term}</p>
        </li>
      ))}
    </ol>
  </section>
);

export default TermsPage;
