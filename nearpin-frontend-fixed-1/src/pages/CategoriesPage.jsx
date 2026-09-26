import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import JobCard from "../components/jobs/JobCard";
import Spinner from "../components/ui/Spinner";
import * as categoryApi from "../api/category.api";
import { CATEGORIES } from "../data/categories";

const CategoriesPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    categoryApi
      .getCategoryJobs()
      .then(({ data }) => {
        if (mounted) setGroups(data.data || []);
      })
      .catch(() => {
        if (mounted) setError("Unable to load category-wise jobs right now.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const fallback = useMemo(
    () => CATEGORIES.map((cat) => ({ ...cat, jobs: [] })),
    []
  );
  const categoryGroups = (groups.length ? groups : fallback).map((group) => ({
    ...group,
    icon: group.icon || CATEGORIES.find((cat) => cat.category === group.category)?.icon || "•",
  }));

  return (
    <section className="container-app py-14">
      <p className="eyebrow">Explore opportunities</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Job Categories</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
            Find available jobs grouped by category. Pick a category and explore the jobs posted by nearby businesses.
          </p>
        </div>
        <Link to="/jobs" className="rounded-full border border-teal px-4 py-2 font-mono text-xs text-teal hover:bg-teal/10">
          View all jobs
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={30} /></div>
      ) : error ? (
        <p className="mt-10 rounded-xl border border-signal/30 bg-signal/10 p-5 text-sm text-ink">{error}</p>
      ) : (
        <div className="mt-10 space-y-12">
          {categoryGroups.map((group) => (
            <section key={group.slug || group.category}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-charcoal-elevated text-xl">
                    {group.icon || "•"}
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink">{group.category}</h2>
                    <p className="mt-0.5 text-xs text-muted">
                      {group.jobs?.length || 0} available job{group.jobs?.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/jobs?category=${encodeURIComponent(group.category)}`}
                  className="font-mono text-xs text-teal hover:text-teal-light"
                >
                  View category →
                </Link>
              </div>

              {group.jobs?.length ? (
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.jobs.map((job) => <JobCard key={job._id} job={job} />)}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-line bg-charcoal-elevated/40 p-7 text-sm text-muted">
                  No active public jobs in this category right now.
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
};

export default CategoriesPage;
