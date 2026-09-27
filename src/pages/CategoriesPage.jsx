import React, { useState } from "react";
import { OFFICIAL_JOB_CATEGORIES } from "../data/categories";

const CategoriesPage = () => {
  const [activeJobType, setActiveJobType] = useState(null);

  const handleJobTypeClick = (jobType) => {
    setActiveJobType((prev) => (prev === jobType ? null : jobType));
  };

  return (
    <div className="container-app py-12 md:py-16">
      {/* Hero Section */}
      <header className="max-w-3xl">
        <p className="eyebrow">JOB CATEGORIES</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
          Explore Job Types
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Explore the different types of micro-jobs available on NearPin. Browse categories to
          understand the kinds of work students can take up and businesses can post.
        </p>
      </header>

      {/* Active Selection Feedback Banner (Catalog-only hint) */}
      {activeJobType && (
        <div className="mt-8 flex items-center justify-between rounded-xl border border-teal/30 bg-teal/5 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-teal">SELECTED JOB TYPE:</span>
            <span className="font-semibold text-ink">{activeJobType}</span>
            <span className="hidden text-muted sm:inline">
              — A standard micro-job role supported on the NearPin platform.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveJobType(null)}
            className="font-mono text-[11px] text-muted hover:text-ink"
          >
            Clear ✕
          </button>
        </div>
      )}

      {/* Main Content: 2-Column Responsive Grid */}
      <main className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {OFFICIAL_JOB_CATEGORIES.map((cat) => {
          const jobTypeCount = cat.jobTypes.length;

          return (
            <article
              key={cat.slug}
              className="card flex flex-col justify-between p-6 transition-colors hover:border-teal/30"
            >
              <div>
                {/* Card Header: Icon, Name & Predefined Job Types Count */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-charcoal-elevated text-xl shadow-sm">
                      {cat.icon}
                    </span>
                    <div>
                      <h2 className="font-display text-lg font-bold uppercase tracking-wide text-ink sm:text-xl">
                        {cat.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-muted">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-line bg-charcoal-elevated px-2.5 py-1 font-mono text-[11px] font-medium text-teal-light">
                    {jobTypeCount} JOB TYPES
                  </span>
                </div>

                {/* Available Job Types Section */}
                <div className="mt-6 border-t border-line/70 pt-5">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-faint">
                    Available Job Types
                  </p>

                  {/* Job Type Chips */}
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {cat.jobTypes.map((jobType) => {
                      const isSelected = activeJobType === jobType;
                      return (
                        <button
                          key={jobType}
                          type="button"
                          onClick={() => handleJobTypeClick(jobType)}
                          title={`Job Type: ${jobType}`}
                          className={`rounded-lg border px-3 py-1.5 text-left font-display text-xs font-medium transition ${
                            isSelected
                              ? "border-teal bg-teal/15 text-teal-light shadow-sm"
                              : "border-line bg-charcoal-elevated/70 text-ink hover:border-teal/50 hover:bg-charcoal-elevated"
                          }`}
                        >
                          {jobType}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
};

export default CategoriesPage;
