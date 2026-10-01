import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as agreementApi from "../api/agreement.api";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import { isValidUpi, normalizeUpi } from "../utils/upi";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AgreementPage = () => {
  const { applicationId } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    agreementApi
      .getAgreementByApplication(applicationId)
      .then(({ data }) => setAgreement(data.data))
      .catch((err) => setError(err.response?.data?.message || "Unable to load the agreement."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [applicationId]);

  const isBusiness = user?._id === agreement?.business || user?.id === agreement?.business;
  const signature = isBusiness ? agreement?.businessSignature : agreement?.studentSignature;

  // Student UPI guarantee before signing
  const [activeStudentUpi, setActiveStudentUpi] = useState(user?.upiId || "");
  const [studentUpiInput, setStudentUpiInput] = useState(user?.upiId || "");
  const [editingStudentUpi, setEditingStudentUpi] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);

  useEffect(() => {
    if (user?.upiId) {
      setActiveStudentUpi(user.upiId);
      setStudentUpiInput(user.upiId);
    }
  }, [user?.upiId]);

  const studentHasValidUpi = isValidUpi(activeStudentUpi);

  const sign = async () => {
    if (!hasAgreed) return;
    if (!isBusiness && !studentHasValidUpi) {
      setError("Please save a valid UPI ID below before signing the agreement.");
      setEditingStudentUpi(true);
      return;
    }
    setSigning(true);
    setError("");
    try {
      const { data } = await agreementApi.signAgreement(
        agreement._id,
        user?.businessName || user?.name || "User"
      );
      setAgreement(data.data);
      if (data.data.isFullyAccepted) {
        navigate(`/active-jobs/${data.data.job}`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign the agreement.");
    } finally {
      setSigning(false);
    }
  };

  const handleUpdateStudentUpi = async (e) => {
    e.preventDefault();
    const val = normalizeUpi(studentUpiInput);
    if (!isValidUpi(val)) {
      setError("Please enter a valid UPI ID (e.g. yourname@oksbi or phone@paytm).");
      return;
    }
    setSavingUpi(true);
    setError("");
    try {
      const { updateProfile } = await import("../api/student.api");
      await updateProfile({ upiId: val });
      setActiveStudentUpi(val);
      await refreshUser?.();
      setEditingStudentUpi(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update UPI ID.");
    } finally {
      setSavingUpi(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container-app flex justify-center py-24">
        <Spinner size={30} />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="container-app py-16">
        <p className="text-signal-dark">{error || "Agreement not found."}</p>
      </div>
    );
  }

  return (
    <>
      {/* Print-specific style rules */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #111827 !important;
          }
          header, nav, footer, .no-print {
            display: none !important;
          }
          .printable-agreement {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #111827 !important;
            background: #ffffff !important;
          }
          .printable-agreement .card {
            background-color: #ffffff !important;
            border: 1px solid #d1d5db !important;
            color: #111827 !important;
            box-shadow: none !important;
          }
          .printable-agreement * {
            color: #111827 !important;
            text-shadow: none !important;
          }
          .printable-agreement .text-muted,
          .printable-agreement .eyebrow {
            color: #4b5563 !important;
          }
          .print-header {
            display: block !important;
            border-bottom: 2px solid #111827;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
        }
        @media screen {
          .print-header {
            display: none;
          }
        }
      `}</style>

      <section className="container-app py-14">
        <div className="printable-agreement mx-auto max-w-3xl">
          {/* Top navigation - hidden on print */}
          <div className="no-print flex items-center justify-between">
            <Link
              to={isBusiness ? "/business/dashboard" : "/student/dashboard"}
              className="font-mono text-xs text-muted hover:text-ink transition"
            >
              ← Back to dashboard
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border border-line bg-charcoal-elevated px-3 py-1.5 font-mono text-xs text-ink transition hover:border-teal/50 hover:bg-teal/10 hover:text-teal"
              title="Print agreement or save as PDF"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <span>Download / Print PDF</span>
            </button>
          </div>

          {/* Official Letterhead Header for Print */}
          <div className="print-header">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tight">NEARPIN DIGITAL WORK AGREEMENT</h2>
                <p className="text-xs text-muted">Direct Student Micro-Job Platform • Neutral Facilitator</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-mono">Date: {new Date().toLocaleDateString()}</p>
                <p className="font-mono">Status: {agreement.isFullyAccepted ? "COMPLETED / SIGNED" : "AWAITING SIGNATURES"}</p>
              </div>
            </div>
          </div>

          {/* Document Header */}
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">DIGITAL WORK AGREEMENT</p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-ink">{agreement.jobTitle}</h1>
              <p className="mt-1 font-mono text-xs text-muted">
                Agreement ID: <span className="text-ink font-semibold">{agreement.agreementId}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={agreement.isFullyAccepted ? "teal" : "gold"}>
                {agreement.isFullyAccepted ? "Agreement completed" : "Awaiting signature"}
              </Badge>
            </div>
          </div>

          {error && (
            <p className="no-print mt-5 rounded-lg bg-signal-light px-4 py-3 text-sm text-signal-dark">
              {error}
            </p>
          )}

          <div className="mt-8 space-y-5">
            {/* Job Details Card */}
            <div className="card p-6">
              <p className="eyebrow">Job details</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-ink">
                {agreement.jobTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">{agreement.jobDescription}</p>
              <p className="mt-4 text-sm text-ink">
                <span className="font-semibold">Reporting Location:</span> {agreement.jobLocation}
              </p>
            </div>

            {/* Schedule & Payment Grid */}
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="card p-5">
                <p className="eyebrow">Date from</p>
                <p className="mt-2 font-semibold text-ink">
                  {formatDate(agreement.jobStartDateTime)}
                </p>
                {agreement.jobStartDateTime && (
                  <p className="mt-1 font-mono text-xs text-muted">
                    {formatTime(agreement.jobStartDateTime)}
                  </p>
                )}
              </div>
              <div className="card p-5">
                <p className="eyebrow">Date to</p>
                <p className="mt-2 font-semibold text-ink">
                  {formatDate(agreement.jobEndDateTime)}
                </p>
                {agreement.jobEndDateTime && (
                  <p className="mt-1 font-mono text-xs text-muted">
                    {formatTime(agreement.jobEndDateTime)}
                  </p>
                )}
              </div>
              <div className="card p-5">
                <p className="eyebrow">Direct Payout</p>
                <p className="mt-2 text-xl font-bold text-teal">
                  ₹{agreement.agreedPaymentAmount}
                </p>
                <p className="mt-1 text-[11px] text-muted">100% direct to student upon completion</p>
              </div>
            </div>

            {/* Working Hours Card */}
            <div className="card p-6">
              <p className="eyebrow">Working hours</p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {agreement.workingHours || "As specified in shift schedule"}
              </p>
              <p className="mt-2 text-xs text-muted">
                These are the working hours specified by the business owner when the job was posted.
              </p>
            </div>

            {/* Terms & Conditions Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Terms & conditions (9 Platform Clauses)</p>
                <span className="font-mono text-[11px] text-muted">Statutory Agreement</span>
              </div>
              <div className="mt-4 space-y-2 whitespace-pre-line text-xs sm:text-sm leading-6 text-muted">
                {agreement.termsAndConditions}
              </div>
            </div>

            {/* Signatures Card */}
            <div className="card p-6">
              <p className="eyebrow">Signatures & Execution</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-charcoal-elevated/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Business Owner
                  </p>
                  <p className="mt-2 font-medium text-ink">{agreement.businessName}</p>
                  <p className="mt-2 text-xs text-muted">
                    {agreement.businessSignature?.fullName ? (
                      <span className="font-mono text-teal">
                        ✓ Signed by {agreement.businessSignature.fullName} on{" "}
                        {formatDate(agreement.businessSignature.agreedAt)}
                      </span>
                    ) : (
                      <span className="font-mono text-amber-500">⏳ Pending Signature</span>
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-charcoal-elevated/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Student Helper
                  </p>
                  <p className="mt-2 font-medium text-ink">{agreement.studentName}</p>
                  <p className="mt-2 text-xs text-muted">
                    {agreement.studentSignature?.fullName ? (
                      <span className="font-mono text-teal">
                        ✓ Signed by {agreement.studentSignature.fullName} on{" "}
                        {formatDate(agreement.studentSignature.agreedAt)}
                      </span>
                    ) : (
                      <span className="font-mono text-amber-500">⏳ Pending Signature</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Signing Interaction Section (with required acknowledgment checkbox) */}
              {!signature && !agreement.isFullyAccepted && (
                <div className="no-print mt-6 rounded-2xl border border-teal/30 bg-teal/5 p-5 sm:p-6">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink">
                    Signatory Agreement & Acknowledgment
                  </h3>
                  
                  {/* Student UPI Verification before signing */}
                  {!isBusiness && (
                    <div className="mt-4 rounded-xl border border-line bg-charcoal p-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">Your Payout UPI ID:</span>
                        <button
                          type="button"
                          onClick={() => setEditingStudentUpi(!editingStudentUpi)}
                          className="font-mono text-teal hover:underline text-[11px]"
                        >
                          {editingStudentUpi ? "Cancel" : "Change"}
                        </button>
                      </div>
                      {editingStudentUpi ? (
                        <form onSubmit={handleUpdateStudentUpi} className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={studentUpiInput}
                            onChange={(e) => setStudentUpiInput(e.target.value)}
                            placeholder="e.g. name@oksbi or phone@paytm"
                            className="flex-1 rounded-lg border border-line bg-charcoal-elevated px-3 py-1.5 font-mono text-xs text-ink focus:border-teal focus:outline-none"
                            autoFocus
                          />
                          <Button type="submit" variant="signal" size="sm" disabled={savingUpi} className="!py-1 !text-xs font-bold">
                            {savingUpi ? "Saving..." : "Save UPI"}
                          </Button>
                        </form>
                      ) : (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`font-mono text-xs ${studentHasValidUpi ? "text-emerald-400 font-semibold" : "text-amber-400"}`}>
                            {activeStudentUpi || "No UPI configured (Required)"}
                          </span>
                          {studentHasValidUpi && <span className="text-[10px] text-muted">✓ Will be used for direct payout QR code</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explicit Checkbox */}
                  <label className="mt-4 flex items-start gap-3.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasAgreed}
                      onChange={(e) => setHasAgreed(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-line bg-charcoal text-teal focus:ring-teal/30"
                    />
                    <span className="text-xs sm:text-sm leading-relaxed text-ink">
                      I have read and agree to the 9 platform terms, shift schedule, and the{" "}
                      <strong className="text-teal font-semibold">
                        ₹{agreement.agreedPaymentAmount}
                      </strong>{" "}
                      direct payout. I understand that NearPin is a neutral facilitator and payout is
                      settled directly upon work completion.
                    </span>
                  </label>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Button
                      variant="signal"
                      disabled={signing || !hasAgreed}
                      onClick={sign}
                      className={!hasAgreed ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {signing ? <Spinner size={16} /> : "I Agree & Sign Agreement"}
                    </Button>
                    {!hasAgreed && (
                      <span className="font-mono text-xs text-muted">
                        ← Check the acknowledgment box above to activate signature
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Waiting for other party state */}
              {signature && !agreement.isFullyAccepted && (
                <div className="no-print mt-5 flex items-center justify-between rounded-xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-ink">
                  <span>✓ You have signed. Waiting for the other party to complete signature.</span>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="font-mono text-xs text-teal underline hover:text-teal-light"
                  >
                    Print interim copy
                  </button>
                </div>
              )}

              {/* Fully completed state */}
              {agreement.isFullyAccepted && (
                <div className="no-print mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-teal/40 bg-teal/10 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      ✓ Both parties have signed. This agreement is now active and binding.
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Proceed to the active shift dashboard for check-in and completion tracking.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="rounded-lg border border-line bg-charcoal px-3 py-1.5 font-mono text-xs text-ink hover:border-teal/50"
                    >
                      Print PDF
                    </button>
                    <Link
                      to={`/active-jobs/${agreement.job}`}
                      className="rounded-lg bg-teal px-3.5 py-1.5 font-display text-xs font-bold text-charcoal hover:bg-teal-light transition"
                    >
                      Go to Active Job →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AgreementPage;
