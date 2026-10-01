import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import * as paymentApi from "../../api/payment.api";
import * as studentApi from "../../api/student.api";
import { useAuth } from "../../context/AuthContext";
import { isValidUpi, normalizeUpi } from "../../utils/upi";

export default function PaymentSettlementCard({
  paymentRecord,
  isBusiness,
  isStudent,
  jobTitle,
  onPaymentUpdated,
  onRefresh,
  onOpenReview,
}) {
  const { refreshUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Payment method selection & UTR input for business
  const [selectedMethod, setSelectedMethod] = useState(paymentRecord?.paymentMethod || "upi");
  const [utrInput, setUtrInput] = useState(paymentRecord?.upiReference || "");

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Inline UPI addition state for student when UPI is missing
  const [editingStudentUpi, setEditingStudentUpi] = useState(false);
  const [inlineUpiInput, setInlineUpiInput] = useState("");
  const [savingInlineUpi, setSavingInlineUpi] = useState(false);
  const [inlineUpiError, setInlineUpiError] = useState("");

  // Authoritative server-side values only
  const cleanAmount = Number(paymentRecord?.agreedPaymentAmount || 0).toFixed(2);
  const studentName = paymentRecord?.student?.name || "Student";
  const rawStudentUpi = paymentRecord?.student?.upiId;
  const hasValidUpi = isValidUpi(rawStudentUpi);
  const studentUpi = hasValidUpi ? normalizeUpi(rawStudentUpi) : "";

  // Standard NPCI UPI URI Specification (Only generated when hasValidUpi is true; pa uses raw @)
  const sanitizedTitle = (jobTitle || "NearPin Task").slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, "");
  const upiUri = hasValidUpi
    ? `upi://pay?pa=${studentUpi}&pn=${encodeURIComponent(studentName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(sanitizedTitle)}`
    : "";

  const isBusinessConfirmed = Boolean(paymentRecord?.businessConfirmation?.confirmed);
  const isStudentConfirmed = Boolean(paymentRecord?.studentConfirmation?.confirmed);
  const isFullySettled = Boolean(paymentRecord?.isFullyConfirmed);
  const isDisputed = Boolean(paymentRecord?.isDisputed);

  const handleSaveInlineUpi = async (e) => {
    e.preventDefault();
    setInlineUpiError("");
    const normalized = normalizeUpi(inlineUpiInput);
    if (!isValidUpi(normalized)) {
      setInlineUpiError("Please enter a valid UPI ID (e.g. yourname@oksbi or phone@paytm).");
      return;
    }
    setSavingInlineUpi(true);
    try {
      await studentApi.updateProfile({ upiId: normalized });
      await refreshUser?.();
      setEditingStudentUpi(false);
      if (onRefresh) {
        await onRefresh();
      } else if (paymentRecord?._id) {
        const fresh = await paymentApi.getPaymentConfirmation(paymentRecord.agreement);
        if (fresh.data.data) onPaymentUpdated?.(fresh.data.data);
      }
    } catch (err) {
      setInlineUpiError(err?.response?.data?.message || "Failed to save UPI ID.");
    } finally {
      setSavingInlineUpi(false);
    }
  };

  const handleCopyUpi = () => {
    if (!studentUpi) return;
    navigator.clipboard?.writeText(studentUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleConfirmAsBusiness = async () => {
    if (!paymentRecord?._id) return;
    setError(null);

    if (selectedMethod === "upi") {
      const cleanUtr = utrInput.trim();
      if (!cleanUtr || !/^\d{12}$/.test(cleanUtr)) {
        setError("Please enter a valid 12-digit numeric UPI/UTR reference number before confirming.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        paymentMethod: selectedMethod,
        ...(selectedMethod === "upi" ? { upiReference: utrInput.trim() } : {}),
      };
      const res = await paymentApi.confirmPayment(paymentRecord._id, payload);
      onPaymentUpdated?.(res.data);
      if (res.data.isFullyConfirmed && onOpenReview) {
        onOpenReview();
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to confirm payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAsStudent = async () => {
    if (!paymentRecord?._id) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await paymentApi.confirmPayment(paymentRecord._id);
      onPaymentUpdated?.(res.data);
      if (res.data.isFullyConfirmed && onOpenReview) {
        onOpenReview();
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to confirm receipt.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim() || disputeReason.trim().length < 5) {
      setError("Please provide a dispute explanation (at least 5 characters).");
      return;
    }
    setSubmittingDispute(true);
    setError(null);
    try {
      const res = await paymentApi.disputePayment(paymentRecord._id, { reason: disputeReason.trim() });
      setShowDisputeModal(false);
      onPaymentUpdated?.(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to submit dispute.");
    } finally {
      setSubmittingDispute(false);
    }
  };

  return (
    <div className="card overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-charcoal via-charcoal to-charcoal-elevated shadow-xl">
      {/* Top Banner Header */}
      <div className="border-b border-line/60 bg-emerald-500/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-lg">
            ₹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-ink text-base">Direct Payment & Settlement</h3>
              {isDisputed ? (
                <Badge variant="signal" className="!bg-red-500/20 !text-red-400 !border-red-500/40">
                  ⚠ Disputed • Under Admin Review
                </Badge>
              ) : isFullySettled ? (
                <Badge variant="signal" className="!bg-emerald-500/20 !text-emerald-400 !border-emerald-500/30">
                  ✓ Settled & Completed
                </Badge>
              ) : isBusinessConfirmed ? (
                <Badge variant="outline" className="!border-amber-500/40 !text-amber-300">
                  Paid by Business • Awaiting Student Receipt
                </Badge>
              ) : (
                <Badge variant="outline" className="!border-teal/40 !text-teal">
                  Ready for Payment
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              Direct peer-to-peer settlement with zero platform commissions.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-muted block uppercase tracking-wider font-mono">Agreed Payout</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">₹{cleanAmount}</span>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {isDisputed && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-300 space-y-1">
            <p className="font-semibold text-sm text-red-200">Payment Dispute Raised</p>
            <p>Reason: &quot;{paymentRecord?.disputeReason}&quot;</p>
            <p className="text-muted text-[11px]">
              Platform administrators have been notified and are reviewing this transaction.
            </p>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-6 md:grid-cols-12 items-start">
          {/* Left Column: Payment Method & QR Display */}
          <div className="md:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-line/80 bg-paper/5 p-5 text-center">
            {/* Mode Selector for Business or Mode Indicator for Student */}
            {!isFullySettled && isBusiness && !isBusinessConfirmed && (
              <div className="mb-4 flex w-full rounded-xl bg-charcoal p-1 border border-line/60">
                <button
                  type="button"
                  onClick={() => setSelectedMethod("upi")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                    selectedMethod === "upi" ? "bg-emerald-500 text-charcoal shadow" : "text-muted hover:text-ink"
                  }`}
                >
                  Pay via UPI
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod("cash")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                    selectedMethod === "cash" ? "bg-emerald-500 text-charcoal shadow" : "text-muted hover:text-ink"
                  }`}
                >
                  Pay in Cash
                </button>
              </div>
            )}

            {/* If Payment is settled or Business confirmed, show record method */}
            {(isBusinessConfirmed || isFullySettled) && (
              <div className="mb-3 w-full text-left bg-charcoal/50 rounded-xl p-3 border border-line/50 text-xs">
                <p className="text-muted">Recorded Method:</p>
                <p className="font-semibold text-ink uppercase tracking-wide">
                  {paymentRecord?.paymentMethod === "cash" ? "Cash on Hand" : "UPI Direct"}
                </p>
                {paymentRecord?.paymentMethod === "upi" && paymentRecord?.upiReference && (
                  <p className="mt-1 font-mono text-[11px] text-teal">
                    UTR: {paymentRecord.upiReference}
                  </p>
                )}
              </div>
            )}

            {selectedMethod === "cash" && !isBusinessConfirmed ? (
              <div className="my-6 flex flex-col items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 font-bold text-2xl">
                  💵
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">Cash Payment</p>
                <p className="mt-1 text-xs text-muted max-w-xs">
                  Hand over physical cash of ₹{cleanAmount} directly to {studentName}.
                </p>
              </div>
            ) : isStudent ? (
              // Student View
              hasValidUpi ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 font-mono">
                    Show this QR to Business
                  </p>
                  <div className="relative my-2 rounded-2xl bg-white p-3 shadow-inner">
                    <QRCodeSVG value={upiUri} size={160} level="M" includeMargin={false} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink">Scan with any UPI App</p>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className="rounded bg-line/60 px-2 py-0.5 font-mono text-xs text-ink/80">
                      {studentUpi}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="text-xs text-teal hover:underline font-mono"
                    >
                      {copiedUpi ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-muted">
                    <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span>
                  </div>
                </>
              ) : (
                <div className="my-3 flex w-full flex-col items-center justify-center text-center p-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-lg font-bold mb-2">
                    ⚠️
                  </div>
                  <p className="text-xs font-semibold text-amber-300">You haven&apos;t added a UPI ID yet</p>
                  <p className="text-[11px] text-muted mt-1 max-w-xs">
                    Add your real bank UPI ID to instantly generate your direct payout QR code.
                  </p>

                  {editingStudentUpi ? (
                    <form onSubmit={handleSaveInlineUpi} className="mt-3 w-full max-w-xs space-y-2">
                      <input
                        type="text"
                        value={inlineUpiInput}
                        onChange={(e) => {
                          setInlineUpiInput(e.target.value);
                          setInlineUpiError("");
                        }}
                        placeholder="e.g. yourname@okhdfcbank"
                        className="w-full rounded-xl border border-line bg-charcoal px-3 py-2 text-xs font-mono text-ink focus:border-teal focus:outline-none text-center"
                        autoFocus
                      />
                      {inlineUpiError && (
                        <p className="text-[10px] text-signal-dark font-medium">{inlineUpiError}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingStudentUpi(false);
                            setInlineUpiError("");
                          }}
                          className="flex-1 !py-1 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="signal"
                          size="sm"
                          disabled={savingInlineUpi}
                          className="flex-1 !py-1 text-xs !bg-emerald-500 hover:!bg-emerald-400 text-charcoal font-bold"
                        >
                          {savingInlineUpi ? "Saving..." : "Save & Generate QR"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button
                      type="button"
                      variant="signal"
                      size="sm"
                      onClick={() => {
                        setInlineUpiInput("");
                        setInlineUpiError("");
                        setEditingStudentUpi(true);
                      }}
                      className="mt-3 !py-1.5 text-xs font-bold !bg-emerald-500 hover:!bg-emerald-400 text-charcoal"
                    >
                      + Add UPI ID Now
                    </Button>
                  )}
                </div>
              )
            ) : (
              // Business View
              hasValidUpi ? (
                <div className="w-full flex flex-col items-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 font-mono">
                    Direct Student Payout
                  </p>

                  {/* Mobile Direct App Intent Button (Visible on mobile/tablets) */}
                  <div className="w-full md:hidden my-2">
                    <a
                      href={upiUri}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-3 text-sm font-bold text-charcoal shadow-lg hover:brightness-110 active:scale-95 transition transform"
                    >
                      <span>⚡ Pay ₹{cleanAmount} with UPI App</span>
                    </a>
                    <p className="text-[11px] text-muted mt-2 text-center">
                      Opens Google Pay, PhonePe, Paytm, or BHIM directly
                    </p>
                  </div>

                  {/* Desktop QR Code Display (Hidden on small mobile screens to prevent clutter) */}
                  <div className="hidden md:flex flex-col items-center my-2">
                    <div className="rounded-2xl bg-white p-3 shadow-inner">
                      <QRCodeSVG value={upiUri} size={150} level="M" includeMargin={false} />
                    </div>
                    <span className="mt-2 text-xs text-muted">
                      Scan with any UPI app on your phone
                    </span>
                  </div>

                  {/* Student UPI handle badge & copy button */}
                  <div className="mt-3 flex items-center justify-center gap-2 w-full">
                    <span className="rounded bg-line/60 px-2.5 py-1 font-mono text-xs text-ink/90 font-medium">
                      {studentUpi}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="text-xs text-teal hover:underline font-mono font-medium"
                    >
                      {copiedUpi ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {/* Critical Name Verification Warning Banner to prevent typos */}
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-left w-full">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold text-sm">⚠️</span>
                      <p className="text-[11px] leading-relaxed text-amber-200">
                        <strong>Check receiver name:</strong> Verify that the name shown in your UPI app matches{" "}
                        <span className="underline font-bold text-white">{studentName}</span> before entering your UPI PIN.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="my-6 flex flex-col items-center justify-center text-center p-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xl font-bold mb-2">
                    ⚠️
                  </div>
                  <p className="text-xs font-semibold text-amber-300">
                    Student hasn&apos;t added a UPI ID yet. You can pay in Cash, or ask the student to add their UPI ID.
                  </p>
                  <p className="text-[11px] text-muted mt-2 max-w-xs">
                    Direct UPI QR codes and transfer links are disabled until the student enters a valid UPI handle.
                  </p>
                </div>
              )
            )}
          </div>

          {/* Right Column: Mutual Confirmation Status & Action Controls */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-ink uppercase tracking-wide">
                Confirmation Protocol
              </h4>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Both parties record their independent statement on NearPin to close out the engagement and build trust metrics.
              </p>

              {/* Status List */}
              <div className="mt-4 space-y-3">
                {/* Business Confirmation Step */}
                <div
                  className={`flex items-start gap-3 rounded-xl border p-3 ${
                    isBusinessConfirmed
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                      : "border-line bg-charcoal-elevated text-muted"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isBusinessConfirmed ? "bg-emerald-500 text-charcoal" : "border border-line"
                    }`}
                  >
                    {isBusinessConfirmed ? "✓" : "1"}
                  </span>
                  <div className="flex-1 text-xs">
                    <p className="font-medium text-ink">
                      Business Statement: Payment Dispatched
                    </p>
                    <p className="mt-0.5 text-muted">
                      {isBusinessConfirmed
                        ? paymentRecord?.businessConfirmation?.confirmedAt
                          ? `Confirmed on ${new Date(paymentRecord.businessConfirmation.confirmedAt).toLocaleDateString()}`
                          : "Confirmed"
                        : "Business marks payment made via UPI or Cash"}
                    </p>
                  </div>
                </div>

                {/* Student Confirmation Step */}
                <div
                  className={`flex items-start gap-3 rounded-xl border p-3 ${
                    isStudentConfirmed
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                      : "border-line bg-charcoal-elevated text-muted"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isStudentConfirmed ? "bg-emerald-500 text-charcoal" : "border border-line"
                    }`}
                  >
                    {isStudentConfirmed ? "✓" : "2"}
                  </span>
                  <div className="flex-1 text-xs">
                    <p className="font-medium text-ink">
                      Student Statement: Payment Received
                    </p>
                    <p className="mt-0.5 text-muted">
                      {isStudentConfirmed
                        ? paymentRecord?.studentConfirmation?.confirmedAt
                          ? `Confirmed on ${new Date(paymentRecord.studentConfirmation.confirmedAt).toLocaleDateString()}`
                          : "Confirmed"
                        : "Student verifies funds in their UPI/Bank account"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Depending on User Role */}
            <div className="border-t border-line/60 pt-4 space-y-3">
              {isFullySettled ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs">
                      ✓
                    </span>
                    Payment is 100% Settled & Reconciled!
                  </div>
                  {onOpenReview && (
                    <Button variant="signal" onClick={onOpenReview} size="sm">
                      Leave Rating & Review ★
                    </Button>
                  )}
                </div>
              ) : isBusiness ? (
                // Business Controls
                <div className="space-y-3">
                  {!isBusinessConfirmed ? (
                    <div className="space-y-3">
                      {selectedMethod === "upi" && (
                        <div>
                          <label className="block text-xs font-medium text-ink mb-1">
                            12-Digit UPI / UTR Transaction Reference Number <span className="text-signal">*</span>
                          </label>
                          <input
                            type="text"
                            value={utrInput}
                            onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, "").slice(0, 12))}
                            placeholder="e.g. 328109842104"
                            maxLength={12}
                            className="w-full rounded-xl border border-line bg-charcoal px-3 py-2 text-xs font-mono text-ink placeholder-muted focus:border-emerald-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-muted mt-1">
                            Find this 12-digit number in Google Pay, PhonePe, or Paytm transaction details.
                          </p>
                        </div>
                      )}

                      <Button
                        variant="signal"
                        onClick={handleConfirmAsBusiness}
                        disabled={submitting || isDisputed || (selectedMethod === "upi" && !hasValidUpi)}
                        className={`w-full justify-center font-bold py-3 text-sm ${
                          selectedMethod === "upi" && !hasValidUpi
                            ? "opacity-50 cursor-not-allowed !bg-line !text-muted"
                            : "!bg-emerald-500 hover:!bg-emerald-400 !text-charcoal"
                        }`}
                      >
                        {submitting
                          ? "Confirming..."
                          : selectedMethod === "upi" && !hasValidUpi
                          ? "UPI Payment Disabled (Student has no UPI ID)"
                          : `✓ I Paid ₹${cleanAmount}`}
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                      ✓ You have recorded your payment confirmation. Awaiting {studentName} to confirm receipt on their phone.
                    </div>
                  )}
                </div>
              ) : isStudent ? (
                // Student Controls
                <div className="space-y-3">
                  {!isStudentConfirmed ? (
                    <div className="space-y-2">
                      {isBusinessConfirmed && (
                        <p className="text-xs text-emerald-400 font-medium">
                          ⚡ Business marked this payment as completed! Check your bank / UPI app now.
                        </p>
                      )}
                      <Button
                        variant="signal"
                        onClick={handleConfirmAsStudent}
                        disabled={submitting || isDisputed}
                        className="w-full justify-center !bg-emerald-500 hover:!bg-emerald-400 !text-charcoal font-semibold"
                      >
                        {submitting ? "Confirming..." : `I Confirm Receipt of ₹${cleanAmount}`}
                      </Button>
                      <p className="text-[11px] text-muted text-center">
                        Only tap this after you see ₹{cleanAmount} deposited in your bank account.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                      ✓ You confirmed receiving ₹{cleanAmount}. Thank you for completing this assignment!
                    </div>
                  )}
                </div>
              ) : null}

              {/* Dispute Button */}
              {!isFullySettled && !isDisputed && (
                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(true)}
                    className="text-[11px] text-muted hover:text-signal transition underline"
                  >
                    Report payment dispute or non-receipt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-charcoal p-6 shadow-2xl">
            <h3 className="text-base font-bold text-ink">Dispute Payment Settlement</h3>
            <p className="mt-1 text-xs text-muted">
              Submit a formal dispute if payment was not received or if details are inaccurate. A platform administrator will intervene.
            </p>

            <form onSubmit={handleDisputeSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Reason for dispute
                </label>
                <textarea
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="e.g. Business marked payment as completed but funds were not credited to my bank account."
                  className="w-full rounded-xl border border-line bg-charcoal-elevated p-3 text-xs text-ink focus:border-signal focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDisputeModal(false)}
                  disabled={submittingDispute}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="signal"
                  size="sm"
                  disabled={submittingDispute}
                  className="!bg-red-600 hover:!bg-red-500"
                >
                  {submittingDispute ? "Submitting..." : "Submit Dispute"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
