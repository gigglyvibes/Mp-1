import React from "react";

const STEPS = [
  { n: "01", title: "Post or browse", body: "Businesses post a shift with pay, timing and location. Students browse or get pinged automatically." },
  { n: "02", title: "Apply & match", body: "Students within 5km apply in one tap. The business accepts the right fit for the job." },
  { n: "03", title: "Sign the agreement", body: "Both sides digitally sign a Work Agreement — job scope, pay, and timing, in writing." },
  { n: "04", title: "Do the work", body: "The student shows up and completes the job. Simple as that." },
  { n: "05", title: "Confirm & rate", body: "Business confirms payment was made, student confirms it was received. Then a rating." },
];

/**
 * This is a genuine sequence (each step depends on the last), so
 * numbered markers encode real information here — unlike a decorative
 * feature list.
 */
const HowItWorks = () => (
  <section id="how-it-works" className="border-y border-line bg-paper py-20">
    <div className="container-app">
      <p className="eyebrow">The flow</p>
      <h2 className="mt-2 max-w-lg text-3xl font-bold sm:text-4xl">
        Five steps from posting to payment.
      </h2>

      <div className="mt-12 grid gap-0 md:grid-cols-5">
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            className={`relative border-line px-1 py-6 md:px-5 md:py-0 ${
              i !== 0 ? "border-t md:border-l md:border-t-0" : ""
            }`}
          >
            <span className="font-mono text-xs text-signal">{step.n}</span>
            <h3 className="mt-3 font-display font-semibold text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
