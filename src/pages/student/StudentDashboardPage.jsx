import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as applicationApi from "../../api/application.api";
import * as studentApi from "../../api/student.api";
import * as ratingApi from "../../api/rating.api";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ReviewModal from "../../components/reviews/ReviewModal";
import { isValidUpi, normalizeUpi } from "../../utils/upi";

const TABS = [
  { key: "", label: "All" },
  { key: "applied", label: "Applied" },
  { key: "accepted", label: "Accepted" },
  { key: "completed", label: "Completed" },
  { key: "withdrawn", label: "Withdrawn" },
];

const STATUS_TONE = {
  applied: "gold",
  accepted: "teal",
  rejected: "neutral",
  withdrawn: "neutral",
  removed: "neutral",
  completed: "signal",
};

const StudentDashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reviewModalTarget, setReviewModalTarget] = useState(null);

  // UPI ID Payout Settings state
  const [editingUpi, setEditingUpi] = useState(false);
  const [upiInput, setUpiInput] = useState(user?.upiId || "");
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiError, setUpiError] = useState("");

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  useEffect(() => {
    if (user?.upiId) {
      setUpiInput(user.upiId);
    }
  }, [user?.upiId]);

  const handleSaveUpi = async (e) => {
    e?.preventDefault();
    setUpiError("");
    const normalized = normalizeUpi(upiInput);
    if (!normalized || !isValidUpi(normalized)) {
      setUpiError("Enter a valid UPI ID (e.g. yourname@okhdfcbank or phone@paytm).");
      return;
    }
    setSavingUpi(true);
    try {
      await studentApi.updateProfile({ upiId: normalized });
      await refreshUser?.();
      setSuccessMessage("UPI ID saved! Your dynamic QR code will now pay directly to this ID.");
      setEditingUpi(false);
    } catch (err) {
      setUpiError(err?.response?.data?.message || "Failed to update UPI ID.");
    } finally {
      setSavingUpi(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    applicationApi
      .getMyApplications(tab || undefined)
      .then(({ data }) => setApplications(data.data))
      .catch((err) => {
        setApplications([]);
        setError(err.response?.data?.message || "Unable to load your applications.");
      })
      .finally(() => setLoading(false));
  }, [tab]);

  const withdraw = async (id) => {
    setError("");
    try {
      await applicationApi.withdrawApplication(id);
      setApplications((prev) => prev.map((a) => (a._id === id ? { ...a, status: "withdrawn" } : a)));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to withdraw this application.");
    }
  };

  const canWithdrawAccepted = (application) => {
    if (application.status !== "accepted" || !application.job?.startDateTime) return false;
    const start = new Date(application.job.startDateTime);
    const now = new Date();
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return today < startDay;
  };

  return (
    <section className="container-app py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Student dashboard</p>
          <h1 className="mt-2 text-3xl font-bold">Hey {user?.name?.split(" ")[0]} 👋</h1>
        </div>
        <Button to="/nearby" variant="signal">
          Find jobs near me
        </Button>
      </div>

      {error && (
        <p className="mt-5 rounded-lg bg-signal-light px-4 py-3 text-sm text-signal-dark">{error}</p>
      )}
      {successMessage && (
        <p className="mt-5 rounded-lg bg-teal/15 border border-teal/40 px-4 py-3 text-sm text-ink">{successMessage}</p>
      )}

      {/* Warning banner when no valid UPI ID is set */}
      {!isValidUpi(user?.upiId) && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200">
          <span className="text-amber-400 font-bold text-base leading-none">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-300">Action Required: No Valid UPI ID Configured</p>
            <p className="mt-0.5 text-muted leading-relaxed">
              You must set a valid bank UPI ID to receive direct payouts upon completing jobs. Please edit your UPI ID below.
            </p>
          </div>
        </div>
      )}

      {/* Profile & KPI Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="font-display text-2xl font-bold text-ink">{user?.averageRating?.toFixed?.(1) ?? "—"}</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted">Average rating</p>
        </div>
        <div className="card p-5">
          <p className="font-display text-2xl font-bold text-ink">{user?.completedJobsCount ?? 0}</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted">Jobs completed</p>
        </div>
        <div className="card p-5">
          <p className="font-display text-2xl font-bold capitalize text-ink">{user?.verificationStatus}</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted">Verification status</p>
        </div>

        {/* Dedicated Card: UPI ID FOR PAYOUTS */}
        <div className="card p-5 flex flex-col justify-between border-emerald-500/30">
          <div>
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-wide text-emerald-400 font-semibold">
                UPI ID for Payouts
              </p>
              <button
                type="button"
                onClick={() => {
                  setUpiError("");
                  setEditingUpi(!editingUpi);
                }}
                className="text-[11px] text-teal hover:underline font-mono"
              >
                {editingUpi ? "Cancel" : isValidUpi(user?.upiId) ? "Edit" : "Not set (Click Edit)"}
              </button>
            </div>
            {editingUpi ? (
              <form onSubmit={handleSaveUpi} className="mt-2 flex flex-col gap-2">
                <input
                  type="text"
                  value={upiInput}
                  onChange={(e) => {
                    setUpiInput(e.target.value);
                    setUpiError("");
                  }}
                  placeholder="e.g. yourname@okhdfcbank"
                  className="rounded border border-line bg-charcoal px-2 py-1 text-xs text-ink focus:border-teal focus:outline-none"
                  autoFocus
                />
                {upiError && <p className="text-[10px] text-signal-dark font-medium">{upiError}</p>}
                <Button variant="signal" size="sm" type="submit" disabled={savingUpi} className="!text-[10px] !py-1">
                  {savingUpi ? "Saving..." : "Save UPI"}
                </Button>
              </form>
            ) : (
              <p className="mt-2 font-mono text-xs font-semibold text-ink truncate">
                {isValidUpi(user?.upiId) ? (
                  <span className="text-emerald-400">{user.upiId}</span>
                ) : (
                  <span className="text-amber-400 font-normal">Not configured</span>
                )}
              </p>
            )}
          </div>
          <span className="text-[10px] text-muted mt-2">
            Used to generate your instant QR code at job completion.
          </span>
        </div>
      </div>

      <div className="mt-10 flex gap-2 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              tab === t.key ? "border-signal text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : applications.length === 0 ? (
        <p className="mt-10 rounded-xl2 border border-dashed border-line py-16 text-center text-sm text-muted">
          Nothing here yet. Browse nearby jobs to get started.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {applications.map((app) => (
            <div key={app._id} className="card flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
              <div>
                <Link to={`/jobs/${app.job._id}`} className="font-display font-semibold text-ink hover:text-signal">
                  {app.job.title}
                </Link>
                <p className="mt-1 text-xs text-muted">{app.job.address} · ₹{app.job.price}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={STATUS_TONE[app.status] || "neutral"}>{app.status}</Badge>
                {app.status === "accepted" && (
                  <Link
                    to={`/agreements/application/${app._id}`}
                    className="rounded-full border border-teal px-3 py-1 font-mono text-[11px] text-teal hover:bg-teal/10"
                  >
                    View agreement
                  </Link>
                )}
                {app.status === "accepted" && app.job?.status === "active" && (
                  <Link
                    to={`/active-jobs/${app.job._id}`}
                    className="rounded-full bg-teal px-3 py-1 font-mono text-[11px] text-paper hover:bg-teal-dark"
                  >
                    Active job & Payment
                  </Link>
                )}
                {app.status === "completed" && (
                  <Link
                    to={`/active-jobs/${app.job._id}`}
                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] text-emerald-400 hover:bg-emerald-500/20"
                  >
                    ₹ Settlement & QR
                  </Link>
                )}
                {app.status === "accepted" && app.job?.status === "expired" && (
                  <Badge tone="neutral">expired</Badge>
                )}
                {app.status === "completed" && (
                  <button
                    type="button"
                    onClick={() =>
                      setReviewModalTarget({
                        applicationId: app._id,
                        targetName: app.job?.business?.businessName || app.job?.businessName || "Business Owner",
                        targetRole: "business",
                        jobTitle: app.job?.title,
                      })
                    }
                    className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-mono text-[11px] font-semibold text-gold hover:bg-gold/20 transition"
                  >
                    {ratingApi.hasReviewedLocally(app._id, "student")
                      ? "✓ Rated Business"
                      : "⭐ Rate Business"}
                  </button>
                )}
                {app.status === "applied" && (
                  <button onClick={() => withdraw(app._id)} className="font-mono text-xs text-muted hover:text-signal-dark">
                    Withdraw
                  </button>
                )}
                {app.status === "accepted" && canWithdrawAccepted(app) && (
                  <button onClick={() => withdraw(app._id)} className="font-mono text-xs text-muted hover:text-signal-dark">
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5-Star Rating & Review Modal for Student */}
      <ReviewModal
        isOpen={Boolean(reviewModalTarget)}
        onClose={() => setReviewModalTarget(null)}
        jobTitle={reviewModalTarget?.jobTitle}
        targetName={reviewModalTarget?.targetName}
        targetRole="business"
        applicationId={reviewModalTarget?.applicationId}
        onRatingSubmitted={() => {
          setSuccessMessage("⭐ Thank you! Your review for the business has been submitted.");
          setReviewModalTarget(null);
          refreshUser().catch(() => {});
        }}
      />
    </section>
  );
};

export default StudentDashboardPage;
