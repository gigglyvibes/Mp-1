import React, { useState } from "react";
import { Link } from "react-router-dom";
import { OFFICIAL_JOB_CATEGORIES } from "../../data/categories";

const CategoryGrid = () => {
  const [selectedSlug, setSelectedSlug] = useState(OFFICIAL_JOB_CATEGORIES[0].slug);

  const activeCategory =
    OFFICIAL_JOB_CATEGORIES.find((c) => c.slug === selectedSlug) || OFFICIAL_JOB_CATEGORIES[0];

  return (
    <section className="container-app py-20" id="job-types">
      {/* Section Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">JOB CATEGORIES</p>
          <h2 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
            Explore Job Types
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Explore the different types of micro-jobs available on NearPin. Browse categories to
            understand the kinds of work students can take up and businesses can post.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/job-types"
            className="rounded-full border border-teal/40 bg-teal/5 px-4 py-2 font-mono text-xs text-teal transition hover:border-teal hover:bg-teal/10"
          >
            View Full Catalog →
          </Link>
        </div>
      </div>

      {/* Category Pills Navigation (Responsive, no giant scrollbars) */}
      <div className="mt-8 flex flex-wrap gap-2">
        {OFFICIAL_JOB_CATEGORIES.map((cat) => {
          const isSelected = selectedSlug === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setSelectedSlug(cat.slug)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-display text-xs font-semibold transition ${
                isSelected
                  ? "bg-teal text-charcoal font-bold shadow-sm"
                  : "border border-line/80 bg-charcoal-card text-muted hover:border-teal/40 hover:text-ink"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Category Showcase Card */}
      <div className="mt-8 card overflow-hidden border-line">
        {/* Category Header */}
        <div className="border-b border-line bg-charcoal-elevated/40 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-charcoal-elevated text-2xl shadow-sm">
                {activeCategory.icon}
              </span>
              <div>
                <h3 className="font-display text-xl font-bold uppercase tracking-wide text-ink sm:text-2xl">
                  {activeCategory.name}
                </h3>
                <p className="mt-1 text-xs text-muted sm:text-sm">
                  {activeCategory.description}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-line bg-charcoal-elevated px-3 py-1 font-mono text-xs font-medium text-teal-light">
              {activeCategory.jobTypes.length} JOB TYPES
            </span>
          </div>
        </div>

        {/* Available Job Types */}
        <div className="p-6 sm:p-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-faint">
            Available Job Types
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeCategory.jobTypes.map((jobType) => (
              <span
                key={jobType}
                className="rounded-lg border border-line bg-charcoal-elevated/70 px-3.5 py-2 font-display text-xs font-medium text-ink"
              >
                {jobType}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Overview Grid of all 7 categories */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {OFFICIAL_JOB_CATEGORIES.map((cat) => {
          const isSelected = selectedSlug === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setSelectedSlug(cat.slug)}
              className={`flex flex-col items-center rounded-xl border p-3.5 text-center transition ${
                isSelected
                  ? "border-teal bg-teal/10 shadow-sm"
                  : "border-line bg-charcoal-card hover:border-teal/40 hover:bg-charcoal-elevated"
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-charcoal-elevated text-xl">
                {cat.icon}
              </span>
              <span className="mt-2 font-display text-xs font-semibold text-ink line-clamp-1">
                {cat.name}
              </span>
              <span className="mt-0.5 font-mono text-[10px] text-teal-light">
                {cat.jobTypes.length} types
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryGrid;
