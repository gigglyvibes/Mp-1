import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as jobApi from "../api/job.api";
import * as applicationApi from "../api/application.api";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ActiveJobPage = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const jobResponse = await jobApi.getJobById(jobId);
      setJob(jobResponse.data.data);

      if (user?.role === "student") {
        const { data } = await applicationApi.getMyApplications();
        setApplication(data.data.find((item) => item.job?._id === jobId) || null);
      } else if (user?.role === "business") {
        const { data } = await applicationApi.getCompletionRequests();
        setApplication(data.data.find((item) => item.job?._id === jobId) || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load the active job.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [jobId, user?.role]);

  const requestCompletion = async () => {
    if (!application) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const { data } = await applicationApi.requestWorkCompletion(application._id);
      setApplication(data.data);
      setMessage("Your completion request has been sent to the business.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit completion.");
    } finally {
      setSubmitting(false);
    }
  };

  const approveCompletion = async () => {
    if (!application) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const { data } = await applicationApi.approveWorkCompletion(application._id);
      setApplication(data.data);
      const jobResponse = await jobApi.getJobById(jobId);
      setJob(jobResponse.data.data);
      setMessage(
        jobResponse.data.data.status === "completed"
          ? "Work approved. The job is now completed and ready for rating."
          : "Work approved. This student's assignment is completed and ready for rating."
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to approve the work.");
    } finally {
      setSubmitting(false);
    }
  };

  const dashboardPath = user?.role === "business" ? "/business/dashboard" : "/student/dashboard";

  if (loading) {
    return (
      <div className="container-app flex justify-center py-24">
        <Spinner size={30} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container-app py-16">
        <p className="text-signal-dark">{error || "Active job not found."}</p>
        <Button to={dashboardPath} variant="outline" className="mt-5">
          Back to dashboard
        </Button>
      </div>
    );
  }

  const completionStatus = application?.workCompletionStatus || "in_progress";
  const isStudent = user?.role === "student";
  const isBusiness = user?.role === "business";
  const completed = job.status === "completed" || application?.status === "completed";
  const expired = job.status === "expired";

  return (
    <section className="container-app py-14">
      <div className="mx-auto max-w-4xl">
        <Link to={dashboardPath} className="font-mono text-xs text-muted hover:text-ink">
          ← Back to dashboard
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{completed ? "Completed job" : expired ? "Expired job" : "Active job"}</p>
            <h1 className="mt-2 text-3xl font-bold">{job.title}</h1>
            <p className="mt-1 text-sm text-muted">{job.job} · {job.address}</p>
          </div>
          <Badge tone={completed ? "signal" : "teal"}>{completed ? "Completed" : "Active"}</Badge>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-teal/30 bg-teal/10 p-4 text-sm text-ink">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-6 rounded-2xl border border-signal/30 bg-signal/10 p-4 text-sm text-signal-dark">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5">
            <p className="eyebrow">Date from</p>
            <p className="mt-2 font-semibold text-ink">{formatDate(job.startDateTime)}</p>
          </div>
          <div className="card p-5">
            <p className="eyebrow">Date to</p>
            <p className="mt-2 font-semibold text-ink">{formatDate(job.endDateTime)}</p>
          </div>
          <div className="card p-5">
            <p className="eyebrow">Working hours</p>
            <p className="mt-2 font-semibold text-ink">{job.workingHours || "Not specified"}</p>
          </div>
          <div className="card p-5">
            <p className="eyebrow">Payment</p>
            <p className="mt-2 font-semibold text-ink">₹{job.price}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="card p-6">
            <p className="eyebrow">Job details</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{job.description}</p>
            {job.specialInstructions && (
              <>
                <p className="mt-5 text-sm font-semibold text-ink">Special instructions</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{job.specialInstructions}</p>
              </>
            )}
          </div>

          <div className="card p-6">
            <p className="eyebrow">Job progress</p>
            <div className="mt-5 space-y-4">
              {[
                ["Application", "Completed", true],
                ["Agreement", "Completed", true],
                ["Work", completed ? "Approved" : expired ? "Expired" : completionStatus === "completion_requested" ? "Awaiting approval" : "Active", completed || completionStatus === "completion_requested"],
                ["Rating & experience", completed ? "Ready" : "Locked", completed],
              ].map(([label, status, done], index) => (
                <div key={label} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done ? "bg-teal text-paper" : "border border-line text-muted"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <div className="flex flex-1 items-center justify-between gap-3">
                    <span className="text-sm font-medium text-ink">{label}</span>
                    <span className={`font-mono text-[11px] uppercase tracking-wide ${done ? "text-teal" : "text-muted"}`}>
                      {status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-line bg-charcoal-elevated p-4">
              <p className="text-sm font-semibold text-ink">Next step</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {isStudent && !completed && !expired && completionStatus === "in_progress" && "When you finish the offline work, tell the business that the work is complete before the job end time."}
                {isStudent && !completed && completionStatus === "completion_requested" && "Your completion request was sent. Wait for the business to approve the job."}
                {isBusiness && !completed && completionStatus === "completion_requested" && "The student marked this job as completed. Approve it below to officially complete the job."}
                {isBusiness && !completed && !application && "Wait for the student to mark this job as completed. You will receive a notification when they do."}
                {expired && !completed && "This job has expired because its end date and time have passed. Completion can no longer be submitted."}
                {completed && "The business has approved the work. The job is now completed and the business can give a rating and experience."}
              </p>
            </div>

            {isStudent && !completed && !expired && completionStatus === "in_progress" && (
              <Button onClick={requestCompletion} disabled={submitting} variant="signal" className="mt-5 w-full">
                {submitting ? "Sending..." : "I've Completed My Work"}
              </Button>
            )}

            {isStudent && !completed && !expired && completionStatus === "completion_requested" && (
              <div className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm text-ink">
                ⏳ Waiting for business approval.
              </div>
            )}

            {isBusiness && !completed && !expired && completionStatus === "completion_requested" && (
              <Button onClick={approveCompletion} disabled={submitting} variant="signal" className="mt-5 w-full">
                {submitting ? "Approving..." : "Approve Completed Work"}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button to={dashboardPath} variant="signal">
            Back to dashboard
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ActiveJobPage;
