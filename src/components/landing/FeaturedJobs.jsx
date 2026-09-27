import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import JobCard from "../jobs/JobCard";
import Spinner from "../ui/Spinner";
import * as jobApi from "../../api/job.api";
import { SAMPLE_JOBS } from "../../data/categories";

const FeaturedJobs = () => {
  const [jobs, setJobs] = useState(() => SAMPLE_JOBS.slice(0, 6));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    jobApi
      .listJobs({ limit: 6 })
      .then(({ data }) => {
        if (mounted && data.data?.items?.length) {
          setJobs(data.data.items);
        }
      })
      .catch(() => {
        // Keep SAMPLE_JOBS fallback
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="container-app py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Freshly posted</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Recently posted jobs.</h2>
        </div>
        <Link to="/jobs" className="hidden shrink-0 font-mono text-xs text-teal hover:text-teal-light sm:block">
          Browse all →
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : jobs.length === 0 ? (
        <p className="mt-10 rounded-xl2 border border-dashed border-line py-16 text-center text-sm text-muted">
          No jobs posted yet — be the first business to post one.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedJobs;
