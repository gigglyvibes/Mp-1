import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import JobCard from "../components/jobs/JobCard";
import Spinner from "../components/ui/Spinner";
import * as jobApi from "../api/job.api";
import { CATEGORIES } from "../data/categories";

const AllJobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const category = searchParams.get("category") || "";
  const page = Number(searchParams.get("page") || 1);

  useEffect(() => {
    setLoading(true);
    jobApi
      .listJobs({ page, limit: 9, category: category || undefined, search: search || undefined })
      .then(({ data }) => setResult(data.data))
      .catch(() => setResult({ items: [], total: 0, totalPages: 1 }))
      .finally(() => setLoading(false));
  }, [page, category, search]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  return (
    <section className="container-app py-14">
      <p className="eyebrow">Browse</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">All jobs</h1>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <form
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            updateParam("search", search);
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job titles…"
            className="input-field"
          />
        </form>
        <select
          className="input-field sm:w-64"
          value={category}
          onChange={(e) => updateParam("category", e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.category}>
              {c.category}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={28} />
        </div>
      ) : result.items.length === 0 ? (
        <p className="mt-14 rounded-xl2 border border-dashed border-line py-16 text-center text-sm text-muted">
          No jobs match your search yet. Try a different category.
        </p>
      ) : (
        <>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>

          {result.totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: result.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateParam("page", String(i + 1))}
                  className={`h-9 w-9 rounded-full font-mono text-xs transition ${
                    page === i + 1 ? "bg-ink text-paper" : "border border-line text-muted hover:border-ink"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default AllJobsPage;
