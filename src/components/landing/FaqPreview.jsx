import React, { useState } from "react";
import { Link } from "react-router-dom";

const FAQS = [
  { q: "Does Nearpin handle payments?", a: "No. Businesses and students agree on payment directly. The platform only records a confirmation from both sides once work is done." },
  { q: "Who can register as a student?", a: "Anyone between 18 and 26 with a valid Aadhaar Card. An admin reviews the Aadhaar and age eligibility before the account is verified." },
  { q: "How does matching actually work?", a: "When a job is published, we query for students within 5km using their live location and notify them in real time." },
  { q: "What if the work goes badly?", a: "Nearpin only helps people discover each other nearby — we're not responsible for work quality, payment disputes, or disagreements between users." },
];

const FaqPreview = () => {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="container-app py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Questions</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Before you jump in.</h2>
        </div>
        <Link to="/faq" className="hidden shrink-0 font-mono text-xs text-teal hover:text-teal-light sm:block">
          Full FAQ →
        </Link>
      </div>

      <div className="mt-10 divide-y divide-line border-y border-line">
        {FAQS.map((item, i) => (
          <div key={item.q}>
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
              aria-expanded={open === i}
            >
              <span className="font-display font-medium text-ink">{item.q}</span>
              <span className={`shrink-0 font-mono text-lg text-signal transition-transform ${open === i ? "rotate-45" : ""}`}>+</span>
            </button>
            {open === i && <p className="max-w-2xl pb-5 text-sm leading-relaxed text-muted">{item.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FaqPreview;
