import React from "react";

const POINTS = [
  { title: "Real 5km matching", body: "MongoDB geospatial queries find students by actual distance, not by city or pincode guesswork.", accent: "signal" },
  { title: "Verified identities", body: "Aadhaar reviewed before a student can apply, so businesses know the student's identity and age eligibility were checked.", accent: "teal" },
  { title: "Digital agreements", body: "Every accepted job gets a signed Work Agreement — scope, pay, and timing, on record.", accent: "signal" },
  { title: "You handle payment", body: "We never touch money. Pay however you agree, then both sides confirm it happened.", accent: "teal" },
];

const WhyChooseUs = () => (
  <section className="bg-charcoal-section py-20">
    <div className="container-app">
      <p className="eyebrow">Why Nearpin</p>
      <h2 className="mt-2 max-w-lg text-3xl font-bold sm:text-4xl">Built for trust between strangers who live 10 minutes apart.</h2>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        {POINTS.map((p) => (
          <div key={p.title} className="flex gap-4 border-t border-line pt-5">
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${p.accent === "signal" ? "bg-signal" : "bg-teal"}`} />
            <div>
              <h3 className="font-display font-semibold text-ink">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyChooseUs;
