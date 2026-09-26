import React from "react";

const QUOTES = [
  { name: "Ananya R.", role: "Student, BMS College", quote: "Picked up a poster design gig two streets from my hostel between classes. Paid same evening.", stars: 5 },
  { name: "Fresh Basket", role: "Grocery store, Koramangala", quote: "Posted a stock-checking shift and had three verified applicants within twenty minutes.", stars: 5 },
  { name: "Rohit K.", role: "Student, Christ University", quote: "The agreement step made it feel legit — not just a random DM about a random job.", stars: 4 },
];

const initials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const Stars = ({ count }) => (
  <div className="flex gap-0.5 text-gold" aria-label={`${count} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < count ? "opacity-100" : "opacity-20"}>★</span>
    ))}
  </div>
);

const Testimonials = () => (
  <section className="border-y border-line bg-paper py-20">
    <div className="container-app">
      <p className="eyebrow">From the neighborhood</p>
      <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Small jobs, real people.</h2>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {QUOTES.map((q) => (
          <blockquote key={q.name} className="card flex flex-col justify-between p-6">
            <div>
              <Stars count={q.stars} />
              <p className="mt-4 text-sm leading-relaxed text-ink">“{q.quote}”</p>
            </div>
            <footer className="mt-6 flex items-center gap-3 border-t border-line pt-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-charcoal-elevated font-mono text-xs font-medium text-teal-light">
                {initials(q.name)}
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-ink">{q.name}</p>
                <p className="font-mono text-[11px] text-faint">{q.role}</p>
              </div>
            </footer>
          </blockquote>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
