import React, { useState } from "react";

const FAQS = [
  { q: "Does Nearpin handle payments?", a: "No. Businesses and students agree on payment directly, in cash, UPI, or however suits them. The platform only records a confirmation statement from both sides once the work is done — it is never a payment intermediary." },
  { q: "Who can register as a student?", a: "Anyone between 18 and 26 with a valid Aadhaar Card, uploaded during registration. The student provides their age and an admin reviews the Aadhaar to verify age eligibility before the account is marked verified." },
  { q: "How does the matching actually work?", a: "When a business publishes a job, Nearpin queries MongoDB for students within a 5km radius (using their live geo-coordinates) and pushes a real-time notification to each one instantly via Socket.io." },
  { q: "What is the Digital Work Agreement?", a: "Once a business accepts a student's application, both parties review a summary of the job (scope, location, timing, pay) and digitally sign with their full name. The job only becomes active once both signatures are recorded." },
  { q: "What if the work goes badly, or payment is disputed?", a: "Nearpin only helps people discover each other nearby — we are not responsible for work quality, payment disputes, personal disagreements, or damages. Businesses are responsible for verifying work before confirming payment." },
  { q: "Can a business remove or edit a job after posting?", a: "Yes, as long as the job hasn't already been completed or cancelled. Businesses can edit details, cancel a job, or save it as a draft before publishing." },
  { q: "How are students verified?", a: "Every student uploads an Aadhaar Card at registration. An admin reviews the Aadhaar and verifies the student's identity and 18–26 age eligibility before the account is marked as verified." },
];

const FaqPage = () => {
  const [open, setOpen] = useState(0);
  return (
    <section className="container-app py-16">
      <p className="eyebrow">Support</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Frequently asked questions</h1>

      <div className="mt-10 max-w-2xl divide-y divide-line border-y border-line">
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
            {open === i && <p className="max-w-xl pb-5 text-sm leading-relaxed text-muted">{item.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FaqPage;
