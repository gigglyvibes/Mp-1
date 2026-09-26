import React from "react";

const AboutPage = () => (
  <section className="container-app py-16">
    <p className="eyebrow">About us</p>
    <h1 className="mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">
      We think the best jobs are the ones you can walk to.
    </h1>
    <p className="mt-6 max-w-2xl leading-relaxed text-muted">
      Nearpin started with a simple observation: students living two streets from a business
      that needed a hand for an afternoon had no easy way to find each other. Job boards showed
      listings across the whole city; word-of-mouth was slow and unreliable. We built Nearpin to
      close that gap with real geolocation matching — not city names or pin codes, but an actual
      radius around where you are right now.
    </p>
    <p className="mt-4 max-w-2xl leading-relaxed text-muted">
      We are a neutral meeting point. Nearpin verifies identities, structures a digital work
      agreement, and records payment confirmations — but we don’t process payments, judge work
      quality, or get involved in disputes. That responsibility stays with the business and the
      student, exactly as it would with any in-person arrangement.
    </p>

    <div className="mt-14 grid gap-6 sm:grid-cols-3">
      {[
        ["Founded", "2026"],
        ["Cities live", "Bengaluru"],
        ["Match radius", "5 km default"],
      ].map(([label, value]) => (
        <div key={label} className="card p-6">
          <p className="font-display text-2xl font-bold text-ink">{value}</p>
          <p className="mt-1 font-mono text-xs uppercase tracking-wide text-muted">{label}</p>
        </div>
      ))}
    </div>
  </section>
);

export default AboutPage;
