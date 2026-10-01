import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import * as paymentApi from "../../api/payment.api";

export default function PaymentSettlementCard({
  paymentRecord,
  isBusiness,
  isStudent,
  studentUser,
  businessUser,
  amount,
  jobTitle,
  onPaymentUpdated,
  onOpenReview,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Determine student's UPI ID (from student profile, or fallback to phone@upi)
  const studentPhone = studentUser?.phone || "";
  const studentName = studentUser?.name || "Student";
  const rawUpi = studentUser?.upiId || (studentPhone ? `${studentPhone}@upi` : "student@nearpin");
  
  // Clean UPI ID string
  const cleanUpi = rawUpi.trim().toLowerCase();
  const cleanAmount = Number(amount || paymentRecord?.agreedPaymentAmount || 0).toFixed(2);
  
  // Standard NPCI UPI URI Specification
  const sanitizedTitle = (jobTitle || "NearPin Task").slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, "");
  const upiUri = `upi://pay?pa=${cleanUpi}&pn=${encodeURIComponent(studentName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(sanitizedTitle)}`;

  const isBusinessConfirmed = Boolean(paymentRecord?.businessConfirmation?.confirmed);
  const isStudentConfirmed = Boolean(paymentRecord?.studentConfirmation?.confirmed);
  const isFullySettled = Boolean(paymentRecord?.isFullyConfirmed);

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(cleanUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleConfirmAsBusiness = async () => {
    if (!paymentRecord?._id) return;
    if (paymentRecord._id === "demo-pay-101" || String(paymentRecord._id).startsWith("demo")) {
      const updated = {
        ...paymentRecord,
        businessConfirmation: { confirmed: true, confirmedAt: new Date().toISOString() },
      };
      updated.isFullyConfirmed = Boolean(updated.studentConfirmation?.confirmed);
      onPaymentUpdated?.(updated);
      if (updated.isFullyConfirmed && onOpenReview) onOpenReview();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await paymentApi.confirmPayment(paymentRecord._id);
      onPaymentUpdated(res.data);
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
    if (paymentRecord._id === "demo-pay-101" || String(paymentRecord._id).startsWith("demo")) {
      const updated = {
        ...paymentRecord,
        studentConfirmation: { confirmed: true, confirmedAt: new Date().toISOString() },
      };
      updated.isFullyConfirmed = Boolean(updated.businessConfirmation?.confirmed);
      onPaymentUpdated?.(updated);
      if (updated.isFullyConfirmed && onOpenReview) onOpenReview();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await paymentApi.confirmPayment(paymentRecord._id);
      onPaymentUpdated(res.data);
      if (res.data.isFullyConfirmed && onOpenReview) {
        onOpenReview();
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to confirm receipt.");
    } finally {
      setSubmitting(false);
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
              {isFullySettled ? (
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
              Direct P2P settlement with zero platform commissions. Scan & pay via UPI or Cash.
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

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-6 md:grid-cols-12 items-center">
          {/* Left Column: QR Code Display for Student Screen or Scanning Guide for Business */}
          <div className="md:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-line/80 bg-paper/5 p-5 text-center">
            {isStudent ? (
              // Student View: Shows dynamic QR Code to present to business
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 font-mono">
                  Show this QR to Business
                </p>
                <div className="relative rounded-2xl bg-white p-3 shadow-inner">
                  <QRCodeSVG
                    value={upiUri}
                    size={160}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">Scan with any UPI App</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="rounded bg-line/60 px-2 py-0.5 font-mono text-xs text-ink/80">
                    {cleanUpi}
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
              // Business View: Details on how to pay
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 font-mono">
                  Student UPI & Payment Details
                </p>
                <div className="my-2 flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <p className="font-semibold text-ink text-sm">{studentName}</p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="rounded bg-line/60 px-2 py-0.5 font-mono text-xs text-ink/80">
                    {cleanUpi}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="text-xs text-teal hover:underline font-mono"
                  >
                    {copiedUpi ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Ask the student to open NearPin on their phone to scan their dynamic QR code directly, or pay to their UPI ID above.
                </p>
              </>
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
                <div className={`flex items-start gap-3 rounded-xl border p-3 ${
                  isBusinessConfirmed
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                    : "border-line bg-charcoal-elevated text-muted"
                }`}>
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isBusinessConfirmed ? "bg-emerald-500 text-charcoal" : "border border-line"
                  }`}>
                    {isBusinessConfirmed ? "✓" : "1"}
                  </span>
                  <div className="flex-1 text-xs">
                    <p className="font-medium text-ink">
                      Business Statement: Payment Dispatched
                    </p>
                    <p className="mt-0.5 text-muted">
                      {isBusinessConfirmed
                        ? `Confirmed on ${new Date(paymentRecord?.businessConfirmation?.confirmedAt || Date.now()).toLocaleDateString()}`
                        : "Business marks payment made via UPI or Cash"}
                    </p>
                  </div>
                </div>

                {/* Student Confirmation Step */}
                <div className={`flex items-start gap-3 rounded-xl border p-3 ${
                  isStudentConfirmed
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                    : "border-line bg-charcoal-elevated text-muted"
                }`}>
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isStudentConfirmed ? "bg-emerald-500 text-charcoal" : "border border-line"
                  }`}>
                    {isStudentConfirmed ? "✓" : "2"}
                  </span>
                  <div className="flex-1 text-xs">
                    <p className="font-medium text-ink">
                      Student Statement: Payment Received
                    </p>
                    <p className="mt-0.5 text-muted">
                      {isStudentConfirmed
                        ? `Confirmed on ${new Date(paymentRecord?.studentConfirmation?.confirmedAt || Date.now()).toLocaleDateString()}`
                        : "Student verifies funds in their UPI/Bank account"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Depending on User Role */}
            <div className="border-t border-line/60 pt-4">
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
                      <Button
                        variant="signal"
                        onClick={handleConfirmAsBusiness}
                        disabled={submitting}
                        className="w-full justify-center !bg-emerald-500 hover:!bg-emerald-400 !text-charcoal font-bold py-3 text-sm"
                      >
                        {submitting ? "Confirming..." : `✓ I Paid ₹${cleanAmount}`}
                      </Button>
                      <p className="text-[11px] text-muted text-center">
                        Scan the student's QR code with your phone (Google Pay / PhonePe / Paytm) or pay cash, then tap above.
                      </p>
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
                        disabled={submitting}
                        className="w-full justify-center !bg-emerald-500 hover:!bg-emerald-400 !text-charcoal font-semibold"
                      >
                        {submitting ? "Confirming..." : `I Confirm Receipt of ₹${cleanAmount}`}
                      </Button>
                      <p className="text-[11px] text-muted text-center">
                        Only tap this after you see ₹{cleanAmount} deposited in your UPI app.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                      ✓ You confirmed receiving ₹{cleanAmount}. Thank you for completing this assignment!
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
