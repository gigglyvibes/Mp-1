import React from "react";

const SECTIONS = [
  { title: "What we collect", body: "Name, age, gender, email, phone, location and geo-coordinates, and — for students — an Aadhaar Card image, collected for identity and age-eligibility verification." },
  { title: "How we use it", body: "To match students with nearby jobs, verify identities, generate digital work agreements, and send real-time notifications. We never sell personal data to third parties." },
  { title: "Location data", body: "Your geo-coordinates power proximity matching (the 5km radius). You can update your location at any time from your profile." },
  { title: "Document storage", body: "Aadhaar images are stored securely and are only accessible to authorized platform administrators for verification purposes." },
  { title: "Your rights", body: "You may request a copy of your data or account deletion at any time by contacting support@nearpin.app." },
];

const PrivacyPolicyPage = () => (
  <section className="container-app py-16">
    <p className="eyebrow">Legal</p>
    <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
    <p className="mt-3 font-mono text-xs text-muted">Last updated: August 2026</p>

    <div className="mt-10 max-w-2xl space-y-8">
      {SECTIONS.map((s) => (
        <div key={s.title}>
          <h2 className="font-display font-semibold text-ink">{s.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
        </div>
      ))}
    </div>
  </section>
);

export default PrivacyPolicyPage;
