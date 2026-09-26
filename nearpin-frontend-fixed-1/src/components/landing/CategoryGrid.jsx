import React from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../../data/categories";

const [SHOP_HELP, ...REST] = CATEGORIES;

const CategoryGrid = () => (
  <section className="container-app py-20">
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">What’s on offer</p>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Seven kinds of work, one radius.</h2>
      </div>
      <Link to="/categories" className="hidden shrink-0 font-mono text-xs text-teal hover:text-teal-light sm:block">
        View all →
      </Link>
    </div>

    <div className="mt-10 grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
      {/* Featured card — content-rich, not decorative empty space */}
      <Link
        to={`/jobs?category=${encodeURIComponent(SHOP_HELP.category)}`}
        className="card group relative flex flex-col justify-between overflow-hidden p-6 transition hover:-translate-y-1 hover:border-teal/40 hover:shadow-card-hover sm:col-span-2"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-charcoal-elevated text-xl">
              {SHOP_HELP.icon}
            </span>
            <h3 className="mt-5 font-display text-xl font-semibold text-ink">{SHOP_HELP.category}</h3>
          </div>
          <div className="hidden flex-col items-center gap-1.5 pt-1 sm:flex">
            {[0, 1, 2].map((n) => (
              <span
                key={n}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-charcoal-elevated text-[13px]"
                style={{ marginLeft: n * 10 }}
              >
                {["🏷️", "📋", "🧾"][n]}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {SHOP_HELP.jobs.slice(0, 3).map((job) => (
            <span
              key={job}
              className="rounded-full border border-line bg-charcoal-elevated px-3 py-1 text-xs text-muted"
            >
              {job}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <span className="font-mono text-xs text-teal-light">12 jobs nearby</span>
          <span className="font-mono text-xs font-medium text-signal transition-transform group-hover:translate-x-0.5">
            View jobs →
          </span>
        </div>
      </Link>

      {REST.slice(0, 1).map((cat) => (
        <Link
          key={cat.slug}
          to={`/jobs?category=${encodeURIComponent(cat.category)}`}
          className="card group flex flex-col justify-between p-5 transition hover:-translate-y-1 hover:border-teal/40 hover:shadow-card-hover"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-charcoal-elevated text-xl transition-colors group-hover:bg-signal/15">
            {cat.icon}
          </span>
          <div className="mt-6">
            <h3 className="font-display font-semibold text-ink">{cat.category}</h3>
            <p className="mt-1 text-xs text-muted line-clamp-2">{cat.jobs.slice(0, 3).join(" · ")}</p>
          </div>
        </Link>
      ))}

      {REST.slice(1).map((cat) => (
        <Link
          key={cat.slug}
          to={`/jobs?category=${encodeURIComponent(cat.category)}`}
          className="card group flex flex-col justify-between p-5 transition hover:-translate-y-1 hover:border-teal/40 hover:shadow-card-hover"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-charcoal-elevated text-xl transition-colors group-hover:bg-signal/15">
            {cat.icon}
          </span>
          <div className="mt-6">
            <h3 className="font-display font-semibold text-ink">{cat.category}</h3>
            <p className="mt-1 text-xs text-muted line-clamp-2">{cat.jobs.slice(0, 3).join(" · ")}</p>
          </div>
        </Link>
      ))}
    </div>
  </section>
);

export default CategoryGrid;
