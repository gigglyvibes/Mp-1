import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as jobApi from "../api/job.api";
import * as applicationApi from "../api/application.api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const JobDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyState, setApplyState] = useState("idle"); // idle | applying | applied | error
  const [applyError, setApplyError] = useState("");

  useEffect(() => {
    jobApi
      .getJobById(id)
      .then(({ data }) => setJob(data.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    setApplyState("applying");
    setApplyError("");
    try {
      await applicationApi.applyToJob(id, {});
      setApplyState("applied");
    } catch (err) {
      setApplyError(err.response?.data?.message || "Couldn't submit your application.");
      setApplyState("error");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container-app py-24 text-center">
        <p className="text-muted">This job couldn’t be found. It may have been removed.</p>
        <Button to="/jobs" variant="outline" className="mt-6">
          Back to all jobs
        </Button>
      </div>
    );
  }

  const spotsLeft = Math.max(job.requiredStudents - (job.acceptedStudentsCount || 0), 0);

  return (
    <section className="container-app py-14">
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Link to="/jobs" className="font-mono text-xs text-muted hover:text-ink">
            ← Back to jobs
          </Link>

          <p className="eyebrow mt-4">{job.category}</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{job.title}</h1>
          <p className="mt-2 text-muted">{job.job} · {job.address}</p>

          {job.images?.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {job.images.map((img) => (
                <img key={img.url} src={img.url} alt={job.title} className="h-28 w-full rounded-lg object-cover" />
              ))}
            </div>
          )}

          <div className="card mt-8 p-6">
            <h2 className="font-display font-semibold text-ink">About this job</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{job.description}</p>
            {job.specialInstructions && (
              <>
                <h3 className="mt-5 font-display text-sm font-semibold text-ink">Special instructions</h3>
                <p className="mt-1 text-sm text-muted">{job.specialInstructions}</p>
              </>
            )}
            {job.skillsRequired?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {job.skillsRequired.map((s) => (
                  <Badge key={s} tone="teal">{s}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              ["Starts", formatDate(job.startDateTime)],
              ["Ends", formatDate(job.endDateTime)],
              ["Duration", job.estimatedDuration],
              ["Working hours", job.workingHours || "—"],
              ["Gender preference", job.genderPreference === "any" ? "No preference" : job.genderPreference],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-charcoal-elevated p-4">
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted">{label}</p>
                <p className="mt-1 text-sm font-medium text-ink">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-6">
            <p className="font-mono text-2xl font-bold text-teal-light">₹{job.price}</p>
            <p className="mt-1 text-xs text-muted">total for the job</p>

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <span className="text-sm text-muted">Spots</span>
              <Badge tone={spotsLeft > 0 ? "signal" : "neutral"}>
                {spotsLeft > 0 ? `${spotsLeft} of ${job.requiredStudents} open` : "Filled"}
              </Badge>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted">Posted by</span>
              <span className="text-sm font-medium text-ink">{job.business?.businessName}</span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted">Contact</span>
              <span className="font-mono text-sm text-ink">{job.contactNumber}</span>
            </div>

            <div className="mt-6">
              {!user ? (
                <Button to="/login" variant="signal" className="w-full">
                  Log in to apply
                </Button>
              ) : user.role !== "student" ? (
                <p className="text-center text-xs text-muted">Only student accounts can apply to jobs.</p>
              ) : applyState === "applied" ? (
                <p className="rounded-lg bg-teal/10 px-4 py-3 text-center text-sm text-teal-light">
                  Application submitted ✓
                </p>
              ) : (
                <>
                  <Button
                    variant="signal"
                    className="w-full"
                    onClick={handleApply}
                    disabled={applyState === "applying" || spotsLeft === 0}
                  >
                    {applyState === "applying" ? <Spinner size={16} /> : spotsLeft === 0 ? "No spots left" : "Apply for this job"}
                  </Button>
                  {applyError && <p className="mt-2 font-mono text-xs text-signal-dark">{applyError}</p>}
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default JobDetailsPage;
