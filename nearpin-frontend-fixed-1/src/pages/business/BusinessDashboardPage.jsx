import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as jobApi from "../../api/job.api";
import * as applicationApi from "../../api/application.api";
import * as ratingApi from "../../api/rating.api";
import * as studentApi from "../../api/student.api";
import axiosClient from "../../api/axiosClient";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";

const STATUS_TONE = {
  draft: "neutral",
  published: "gold",
  active: "teal",
  completed: "signal",
  cancelled: "neutral",
  expired: "neutral",
};

const BusinessDashboardPage = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [completionRequests, setCompletionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState(null);
  const [applicants, setApplicants] = useState({});
  const [approvingId, setApprovingId] = useState(null);
  const [ratingForms, setRatingForms] = useState({});
  const [ratingSubmittingId, setRatingSubmittingId] = useState(null);
  const [ratingMessage, setRatingMessage] = useState("");
  const [studentProfile, setStudentProfile] = useState(null);
  const [studentProfileLoading, setStudentProfileLoading] = useState(false);
  const [studentProfileError, setStudentProfileError] = useState("");
  const [loadError, setLoadError] = useState("");

  const loadCompletionRequests = async () => {
    try {
      const { data } = await applicationApi.getCompletionRequests();
      setCompletionRequests(data.data || []);
    } catch (err) {
      setCompletionRequests([]);
      setLoadError(err.response?.data?.message || "Unable to load completion requests.");
    }
  };

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    Promise.all([
      jobApi.getMyJobs().then(({ data }) => setJobs(data.data || [])).catch((err) => {
        setJobs([]);
        setLoadError(err.response?.data?.message || "Unable to load your jobs.");
      }),
      axiosClient.get("/businesses/analytics").then(({ data }) => setAnalytics(data.data)).catch((err) => {
        setLoadError(err.response?.data?.message || "Unable to load dashboard analytics.");
      }),
      loadCompletionRequests(),
    ]).finally(() => setLoading(false));
  }, []);

  const toggleApplicants = async (jobId) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
      return;
    }
    setExpandedJob(jobId);
    if (!applicants[jobId]) {
      try {
        const { data } = await applicationApi.getApplicantsForJob(jobId);
        setApplicants((prev) => ({ ...prev, [jobId]: data.data || [] }));
      } catch (err) {
        setExpandedJob(null);
        setLoadError(err.response?.data?.message || "Unable to load applicants.");
      }
    }
  };

  const openStudentProfile = async (studentId) => {
    if (!studentId) return;
    setStudentProfileLoading(true);
    setStudentProfileError("");
    try {
      const [{ data: profileResponse }, { data: ratingsResponse }] = await Promise.all([
        studentApi.getStudentById(studentId),
        ratingApi.getStudentRatings(studentId).catch(() => ({ data: { data: [] } })),
      ]);
      setStudentProfile({
        ...profileResponse.data,
        ratings: ratingsResponse.data || [],
      });
    } catch (err) {
      setStudentProfileError(err.response?.data?.message || "Unable to load student profile.");
    } finally {
      setStudentProfileLoading(false);
    }
  };

  const closeStudentProfile = () => {
    setStudentProfile(null);
    setStudentProfileError("");
  };

  const respond = async (applicationId, jobId, decision) => {
    try {
      await applicationApi.respondToApplication(applicationId, decision);
      setApplicants((prev) => ({
        ...prev,
        [jobId]: (prev[jobId] || []).map((a) => (a._id === applicationId ? { ...a, status: decision } : a)),
      }));
      const { data } = await jobApi.getMyJobs();
      setJobs(data.data || []);
    } catch (err) {
      setRatingMessage(err.response?.data?.message || "Unable to update the application.");
    }
  };

  const approveCompletion = async (application) => {
    setApprovingId(application._id);
    setRatingMessage("");
    try {
      const { data } = await applicationApi.approveWorkCompletion(application._id);
      setCompletionRequests((prev) => prev.filter((item) => item._id !== application._id));
      const { data: jobsResponse } = await jobApi.getMyJobs();
      setJobs(jobsResponse.data || []);
      const { data: analyticsResponse } = await axiosClient.get("/businesses/analytics");
      setAnalytics(analyticsResponse.data.data);
      setRatingForms((prev) => ({
        ...prev,
        [application._id]: { stars: 0, review: "", student: data.data.student },
      }));
    } catch (err) {
      setRatingMessage(err.response?.data?.message || "Unable to approve the work.");
    } finally {
      setApprovingId(null);
    }
  };

  const isBeforeStartDate = (dateValue) => {
    if (!dateValue) return false;
    const start = new Date(dateValue);
    const now = new Date();
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return today < startDay;
  };

  const updateRating = (applicationId, key, value) => {
    setRatingForms((prev) => ({
      ...prev,
      [applicationId]: { ...prev[applicationId], [key]: value },
    }));
  };

  const submitRating = async (application) => {
    const form = ratingForms[application._id];
    if (!form?.stars) return;
    setRatingSubmittingId(application._id);
    setRatingMessage("");
    try {
      await ratingApi.rateStudent(application._id, {
        stars: form.stars,
        review: form.review,
      });
      setRatingForms((prev) => {
        const next = { ...prev };
        delete next[application._id];
        return next;
      });
      setRatingMessage("Rating and experience submitted successfully.");
    } catch (err) {
      setRatingMessage(err.response?.data?.message || "Unable to submit the rating.");
    } finally {
      setRatingSubmittingId(null);
    }
  };

  const handleCancel = async (jobId) => {
    await jobApi.cancelJob(jobId);
    setJobs((prev) => prev.map((j) => (j._id === jobId ? { ...j, status: "cancelled" } : j)));
  };

  const handlePublish = async (jobId) => {
    await jobApi.publishJob(jobId);
    setJobs((prev) => prev.map((j) => (j._id === jobId ? { ...j, status: "published" } : j)));
  };

  return (
    <section className="container-app py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">BUSINESS DASHBOARD</p>
          <h1 className="mt-2 text-3xl font-bold">{user?.ownerName}</h1>
        </div>
        <Button to="/business/jobs/create" variant="signal">
          + Post a job
        </Button>
      </div>

      {loadError && <p className="mt-5 rounded-xl border border-signal/30 bg-signal/10 p-4 text-sm text-signal-dark">{loadError}</p>}

      {analytics && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Total", analytics.total],
            ["Draft", analytics.draft],
            ["Published", analytics.published],
            ["Active", analytics.active],
            ["Completed", analytics.completed],
            ["Cancelled", analytics.cancelled],
          ].map(([label, value]) => (
            <div key={label} className="card p-4">
              <p className="font-display text-xl font-bold text-ink">{value}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">{label}</p>
            </div>
          ))}
        </div>
      )}

      {completionRequests.length > 0 && (
        <div className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Action required</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-ink">Pending Work Approvals</h2>
            </div>
            <Badge tone="gold">{completionRequests.length} pending</Badge>
          </div>

          <div className="mt-5 space-y-3">
            {completionRequests.map((application) => (
              <div key={application._id} className="card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link to={`/jobs/${application.job?._id}`} className="font-display font-semibold text-ink hover:text-signal">
                      {application.job?.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted">Student: {application.student?.name}</p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted">
                      Payment: ₹{application.job?.price}
                    </p>
                    <p className="mt-2 text-sm text-ink">The student has marked this job as completed.</p>
                  </div>
                  <Button
                    onClick={() => approveCompletion(application)}
                    disabled={approvingId === application._id}
                    variant="signal"
                  >
                    {approvingId === application._id ? "Approving..." : "Approve Completed Work"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(ratingForms).length > 0 && (
        <div className="mt-8 rounded-2xl border border-teal/30 bg-teal/10 p-6">
          <p className="eyebrow">Job approved</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-ink">Rate your experience</h2>
          <p className="mt-1 text-sm text-muted">The work has been approved. Give the student a star rating and share your experience.</p>

          {Object.entries(ratingForms).map(([applicationId, form]) => {
            const application = completionRequests.find((item) => item._id === applicationId) || {
              _id: applicationId,
              student: form.student,
            };
            return (
              <div key={applicationId} className="mt-5 rounded-xl border border-line bg-charcoal-elevated p-5">
                <p className="text-sm font-semibold text-ink">{application.student?.name || "Student"}</p>
                <div className="mt-4 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateRating(applicationId, "stars", star)}
                      aria-label={`Give ${star} star${star > 1 ? "s" : ""}`}
                      className={`text-3xl leading-none transition ${star <= form.stars ? "text-gold" : "text-muted hover:text-gold"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={form.review}
                  onChange={(e) => updateRating(applicationId, "review", e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Share your experience with the student..."
                  className="mt-4 w-full rounded-xl border border-line bg-paper p-3 text-sm text-ink outline-none focus:border-teal"
                />
                <Button
                  onClick={() => submitRating(application)}
                  disabled={!form.stars || ratingSubmittingId === applicationId}
                  variant="signal"
                  className="mt-4"
                >
                  {ratingSubmittingId === applicationId ? "Submitting..." : "Submit Rating & Experience"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {ratingMessage && <p className="mt-5 rounded-xl border border-line bg-charcoal-elevated p-4 text-sm text-ink">{ratingMessage}</p>}

      <h2 className="mt-12 font-display text-xl font-semibold text-ink">Your jobs</h2>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : jobs.length === 0 ? (
        <p className="mt-6 rounded-xl2 border border-dashed border-line py-16 text-center text-sm text-muted">
          You haven’t posted any jobs yet.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {jobs.map((job) => (
            <div key={job._id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link to={`/jobs/${job._id}`} className="font-display font-semibold text-ink hover:text-signal">
                    {job.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {job.category} · {job.acceptedStudentsCount || 0}/{job.requiredStudents} accepted
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={STATUS_TONE[job.status] || "neutral"}>{job.status}</Badge>
                  {job.status === "active" && (
                    <Link
                      to={`/active-jobs/${job._id}`}
                      className="rounded-full border border-teal px-3 py-1 font-mono text-[11px] text-teal hover:bg-teal/10"
                    >
                      View active job
                    </Link>
                  )}
                  {job.status === "draft" && (
                    <button onClick={() => handlePublish(job._id)} className="font-mono text-xs text-teal hover:text-teal-light">
                      Publish
                    </button>
                  )}
                  {["draft", "published"].includes(job.status) && (
                    <button onClick={() => handleCancel(job._id)} className="font-mono text-xs text-signal-dark hover:opacity-70">
                      Cancel
                    </button>
                  )}
                  <button onClick={() => toggleApplicants(job._id)} className="font-mono text-xs text-ink hover:text-signal">
                    {expandedJob === job._id ? "Hide applicants" : "View applicants"}
                  </button>
                </div>
              </div>

              {expandedJob === job._id && (
                <div className="mt-4 border-t border-line pt-4">
                  {!applicants[job._id] ? (
                    <Spinner size={18} />
                  ) : applicants[job._id].length === 0 ? (
                    <p className="text-sm text-muted">No applicants yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {applicants[job._id].map((app) => (
                        <div key={app._id} className="flex items-center justify-between rounded-lg bg-teal/10 px-4 py-2.5">
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openStudentProfile(app.student?._id)}
                              className="text-left text-sm font-medium text-ink underline decoration-line underline-offset-4 transition hover:text-signal hover:decoration-signal"
                            >
                              {app.student?.name || "Student"}
                            </button>
                            <p className="font-mono text-[11px] text-muted">
                              ★ {app.student?.averageRating?.toFixed?.(1) ?? "—"} · {app.status}
                            </p>
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-teal">
                              Click name to view profile
                            </p>
                          </div>
                          {app.status === "accepted" && (
                            <div className="flex flex-wrap justify-end gap-2">
                              <Link
                                to={`/agreements/application/${app._id}`}
                                className="rounded-full border border-teal px-3 py-1 font-mono text-[11px] text-teal hover:bg-teal/10"
                              >
                                View agreement
                              </Link>
                              {isBeforeStartDate(job.startDateTime) && (
                                <button
                                  type="button"
                                  onClick={() => respond(app._id, job._id, "removed")}
                                  className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-muted hover:border-signal hover:text-signal-dark"
                                >
                                  Remove student
                                </button>
                              )}
                            </div>
                          )}
                          {app.status === "applied" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => respond(app._id, job._id, "accepted")}
                                className="rounded-full bg-teal px-3 py-1 font-mono text-[11px] text-paper hover:bg-teal-dark"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => respond(app._id, job._id, "rejected")}
                                className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-muted hover:border-signal hover:text-signal-dark"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(studentProfileLoading || studentProfileError || studentProfile) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeStudentProfile}>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-charcoal-elevated p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Student profile"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Applicant profile</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
                  {studentProfile?.name || "Student profile"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeStudentProfile}
                className="rounded-full border border-line px-3 py-1.5 font-mono text-xs text-muted hover:border-signal hover:text-signal-dark"
                aria-label="Close student profile"
              >
                Close
              </button>
            </div>

            {studentProfileLoading ? (
              <div className="flex justify-center py-16"><Spinner size={28} /></div>
            ) : studentProfileError ? (
              <p className="mt-6 rounded-xl border border-signal/30 bg-signal/10 p-4 text-sm text-ink">{studentProfileError}</p>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-line bg-paper p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-muted">Rating</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      ★ {studentProfile?.averageRating?.toFixed?.(1) ?? "0.0"} ({studentProfile?.totalRatings ?? 0} ratings)
                    </p>
                  </div>
                  <div className="rounded-xl border border-line bg-paper p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-muted">Completed jobs</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{studentProfile?.completedJobsCount ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-paper p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-muted">Location</p>
                    <p className="mt-1 text-sm text-ink">{studentProfile?.location || "Not provided"}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-line bg-paper p-4">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted">About</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">
                    {studentProfile?.about || "The student has not added an about section yet."}
                  </p>
                </div>

                {(studentProfile?.phone || studentProfile?.email) && (
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {studentProfile?.phone && (
                      <div className="rounded-xl border border-line bg-paper p-4">
                        <p className="font-mono text-[10px] uppercase tracking-wide text-muted">Phone</p>
                        <p className="mt-1 text-sm text-ink">{studentProfile.phone}</p>
                      </div>
                    )}
                    {studentProfile?.email && (
                      <div className="rounded-xl border border-line bg-paper p-4">
                        <p className="font-mono text-[10px] uppercase tracking-wide text-muted">Email</p>
                        <p className="mt-1 break-all text-sm text-ink">{studentProfile.email}</p>
                      </div>
                    )}
                  </div>
                )}

                {studentProfile?.ratings?.length > 0 && (
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display font-semibold text-ink">Recent experience</h3>
                      <span className="font-mono text-[10px] uppercase tracking-wide text-muted">{studentProfile.ratings.length} review{studentProfile.ratings.length === 1 ? "" : "s"}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {studentProfile.ratings.slice(0, 5).map((rating) => (
                        <div key={rating._id} className="rounded-xl border border-line bg-paper p-4">
                          <p className="font-mono text-sm text-gold">{"★".repeat(rating.stars || 0)}{"☆".repeat(Math.max(0, 5 - (rating.stars || 0)))}</p>
                          <p className="mt-2 text-sm leading-6 text-ink">{rating.review || "No written experience provided."}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default BusinessDashboardPage;
