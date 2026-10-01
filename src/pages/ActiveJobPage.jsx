import WhatsAppButton from "../components/ui/WhatsAppButton";
import { formatDateTimeReadable } from "../utils/whatsapp";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as jobApi from "../api/job.api";
import * as applicationApi from "../api/application.api";
import * as agreementApi from "../api/agreement.api";
import * as paymentApi from "../api/payment.api";
import * as ratingApi from "../api/rating.api";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import ReviewModal from "../components/reviews/ReviewModal";
import PaymentSettlementCard from "../components/payment/PaymentSettlementCard";

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
  const [agreement, setAgreement] = useState(null);
  const [paymentRecord, setPaymentRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const jobResponse = await jobApi.getJobById(jobId);
      setJob(jobResponse.data.data);

      let currentApp = null;
      if (user?.role === "student") {
        const { data } = await applicationApi.getMyApplications();
        currentApp = data.data.find((item) => item.job?._id === jobId) || null;
      } else if (user?.role === "business") {
        const { data } = await applicationApi.getCompletionRequests();
        currentApp = data.data.find((item) => item.job?._id === jobId) || null;
      }
      setApplication(currentApp);

      if (currentApp) {
        // Fetch Agreement
        try {
          const agreeRes = await agreementApi.getAgreementByApplication(currentApp._id);
          const currentAgreement = agreeRes.data.data;
          setAgreement(currentAgreement);

          // Fetch Payment Confirmation Record if available
          if (currentAgreement?._id) {
            try {
              const payRes = await paymentApi.getPaymentConfirmation(currentAgreement._id);
              if (payRes.data.data) {
                setPaymentRecord(payRes.data.data);
              }
            } catch (_pErr) {
              // Not initiated or not ready yet
            }
          }
        } catch (_aErr) {
          // Agreement not found yet
        }

        const existingLocal = ratingApi.getLocalRating(currentApp._id, user?.role);
        if (existingLocal) {
          setUserRating(existingLocal);
        }
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
      setMessage("Work approved! The job is now marked completed and payment settlement is unlocked.");

      // Initialize payment record if agreement exists
      if (agreement?._id) {
        try {
          const initRes = await paymentApi.initPaymentConfirmation(agreement._id);
          if (initRes.data.data) {
            setPaymentRecord(initRes.data.data);
          }
        } catch (initErr) {
          console.error("Init payment error:", initErr);
        }
      }
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

  const targetName = isBusiness
    ? application?.student?.name || "Student"
    : job.business?.businessName || "Business";
  const targetRole = isBusiness ? "student" : "business";

  return (
    <section className="container-app py-14">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Link to={dashboardPath} className="font-mono text-xs text-muted hover:text-ink">
            ← Back to dashboard
          </Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{completed ? "Completed job" : expired ? "Expired job" : "Active job"}</p>
              <h1 className="mt-2 text-3xl font-bold">{job.title}</h1>
              <p className="mt-1 text-sm text-muted">{job.category || job.job} · {job.address}</p>
            </div>
            <Badge tone={completed ? "signal" : "teal"}>{completed ? "Completed" : "Active"}</Badge>
          </div>
        </div>

        {message && (
          <div className="rounded-2xl border border-teal/30 bg-teal/10 p-4 text-sm text-ink">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-signal/30 bg-signal/10 p-4 text-sm text-signal-dark">
            {error}
          </div>
        )}

        {/* STEP 6: DYNAMIC UPI QR & PAYMENT SETTLEMENT CARD (When Work is Completed/Approved) */}
        {completed && (
          <PaymentSettlementCard
            paymentRecord={paymentRecord}
            isBusiness={isBusiness}
            isStudent={isStudent}
            jobTitle={job.title}
            onPaymentUpdated={(updated) => {
              setPaymentRecord(updated);
              setMessage("Payment confirmation recorded successfully!");
            }}
            onRefresh={load}
            onOpenReview={() => setShowReviewModal(true)}
          />
        )}

        {/* Highlight rating banner if job is completed */}
        {completed && (
          <div className="rounded-2xl border border-gold/40 bg-gold/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-gold font-bold">
                ⭐ Verified Experience Rating
              </span>
              <h3 className="mt-1 font-bold text-ink text-lg">
                {userRating
                  ? `You rated ${targetName}: ${"★".repeat(userRating.stars)} (${userRating.stars}/5)`
                  : `Please rate your experience with ${targetName}`}
              </h3>
              {userRating?.review && (
                <p className="mt-1 text-xs text-muted italic">&ldquo;{userRating.review}&rdquo;</p>
              )}
            </div>
            <Button
              variant={userRating ? "outline" : "signal"}
              onClick={() => setShowReviewModal(true)}
              className="shrink-0"
            >
              {userRating ? "Edit Rating ⭐" : "Leave Rating ⭐"}
            </Button>
          </div>
        )}

        {/* Direct WhatsApp & Contact Card for Coordination */}
        <div className="rounded-2xl border border-line bg-charcoal p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-teal/15 text-teal flex items-center justify-center font-bold text-lg font-mono">
              {isBusiness ? "🎓" : "🏪"}
            </div>
            <div>
              <p className="eyebrow">
                {isBusiness ? "Assigned Student Worker" : "Hiring Business Partner"}
              </p>
              <h4 className="text-base font-bold text-ink flex items-center gap-2">
                {targetName}
                <span className="text-xs font-normal text-muted font-mono">
                  ({isBusiness ? application?.student?.phone || "Phone hidden" : job.business?.phone || "Phone hidden"})
                </span>
              </h4>
              <p className="text-xs text-muted mt-0.5">
                Use WhatsApp for shift arrival timing, uniforms, or directions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isBusiness && application?.student?.phone && (
              <WhatsAppButton
                phone={application.student.phone}
                variant="button"
                label={`Message ${targetName.split(" ")[0]} on WhatsApp`}
                message={`Hi ${targetName}, I have accepted your application for the ${job.title} shift scheduled on ${formatDateTimeReadable(job.startDateTime)} on NearPin. Please let me know if you have any questions!`}
              />
            )}
            {isStudent && job.business?.phone && (
              <WhatsAppButton
                phone={job.business.phone}
                variant="button"
                label={`Message ${targetName.split(" ")[0]} on WhatsApp`}
                message={`Hi, this is ${user?.name || "the student"} from NearPin regarding the ${job.title} shift scheduled on ${formatDateTimeReadable(job.startDateTime)}. I wanted to check in regarding arrival details.`}
              />
            )}
          </div>
        </div>

        {/* Key Job Info Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
            <p className="eyebrow">Agreed Payout</p>
            <p className="mt-2 font-semibold text-emerald-400 font-mono text-xl">₹{agreement?.agreedPaymentAmount }</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Left: Job Details */}
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

          {/* Right: Job Progress & Next Step */}
          <div className="card p-6">
            <p className="eyebrow">Job progress</p>
            <div className="mt-5 space-y-4">
              {[
                ["Application", "Completed", true],
                ["Agreement", "Signed & Bound", true],
                [
                  "Work Execution",
                  completed
                    ? "Approved"
                    : expired
                    ? "Expired"
                    : completionStatus === "completion_requested"
                    ? "Under Inspection"
                    : "In Progress",
                  completed || completionStatus === "completion_requested",
                ],
                [
                  "UPI Settlement",
                  paymentRecord?.isFullyConfirmed
                    ? "Settled ✓"
                    : completed
                    ? "Awaiting Mutual Confirmation"
                    : "Locked",
                  Boolean(paymentRecord?.isFullyConfirmed),
                ],
                ["Rating & Review", completed ? (userRating ? "Rated ★" : "Ready") : "Locked", Boolean(userRating)],
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
                {isStudent && !completed && !expired && completionStatus === "in_progress" &&
                  "When you finish the work (even if finishing early!), tap the button below to notify the business for final inspection."}
                {isStudent && !completed && completionStatus === "completion_requested" &&
                  "Your completion request was sent. The business is currently inspecting the completed work."}
                {isBusiness && !completed && completionStatus === "completion_requested" &&
                  "The student has completed the tasks. Inspect the work and click 'Approve Completed Work' to unlock payment."}
                {isBusiness && !completed && completionStatus !== "completion_requested" &&
                  "Student is performing the assigned work. Once they mark it completed, you will be prompted to inspect."}
                {expired && !completed &&
                  "This job has expired because its end date and time have passed. Completion can no longer be submitted."}
                {completed && !paymentRecord?.isFullyConfirmed &&
                  "Scan the student's UPI QR code or pay via UPI/cash, then confirm below."}
                {completed && paymentRecord?.isFullyConfirmed &&
                  "Payment fully confirmed and settled! Thank you for maintaining mutual trust on NearPin."}
              </p>
            </div>

            {/* In-Progress Student Action */}
            {isStudent && !completed && !expired && completionStatus === "in_progress" && (
              <Button onClick={requestCompletion} disabled={submitting} variant="signal" className="mt-5 w-full">
                {submitting ? "Sending..." : "I've Completed My Work"}
              </Button>
            )}

            {/* Waiting for approval */}
            {isStudent && !completed && !expired && completionStatus === "completion_requested" && (
              <div className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm text-ink text-center">
                ⏳ Waiting for business owner to inspect and approve.
              </div>
            )}

            {/* In-Progress Business Approval Action */}
            {isBusiness && !completed && !expired && completionStatus === "completion_requested" && (
              <Button onClick={approveCompletion} disabled={submitting} variant="signal" className="mt-5 w-full !bg-emerald-500 hover:!bg-emerald-400 !text-charcoal font-bold">
                {submitting ? "Approving..." : "Approve Completed Work & Open Settlement"}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button to={dashboardPath} variant="signal">
            Back to dashboard
          </Button>
        </div>
      </div>

      {/* 5-Star Rating & Review Modal */}
      {application && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          jobTitle={job.title}
          targetName={targetName}
          targetRole={targetRole}
          applicationId={application._id}
          onRatingSubmitted={(result) => {
            setUserRating(result);
            setMessage("Thank you! Your rating and feedback were saved successfully.");
          }}
        />
      )}
    </section>
  );
};

export default ActiveJobPage;
