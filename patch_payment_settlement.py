with open("src/components/payment/PaymentSettlementCard.jsx", "r") as f:
    text = f.read()

# 1. Update imports
old_top = '''import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import * as paymentApi from "../../api/payment.api";'''

new_top = '''import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import * as paymentApi from "../../api/payment.api";
import * as studentApi from "../../api/student.api";
import { useAuth } from "../../context/AuthContext";
import { isValidUpi, normalizeUpi } from "../../utils/upi";'''

assert old_top in text
text = text.replace(old_top, new_top)

# 2. Update props and state
old_props = '''export default function PaymentSettlementCard({
  paymentRecord,
  isBusiness,
  isStudent,
  studentUser: _studentUser,
  businessUser: _businessUser,
  amount: _clientAmount,
  jobTitle,
  onPaymentUpdated,
  onOpenReview,
}) {
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

  // Authoritative server-side values only (UPI is collected upfront at registration or agreement signing)
  const cleanAmount = Number(paymentRecord?.agreedPaymentAmount || 0).toFixed(2);
  const studentName = paymentRecord?.student?.name || "Student";
  const studentUpi = (paymentRecord?.student?.upiId || "").trim();
  const hasValidUpi = Boolean(studentUpi && studentUpi.includes("@"));

  // Standard NPCI UPI URI Specification
  const sanitizedTitle = (jobTitle || "NearPin Task").slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, "");
  const upiUri = hasValidUpi
    ? `upi://pay?pa=${encodeURIComponent(studentUpi)}&pn=${encodeURIComponent(studentName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(sanitizedTitle)}`
    : "";'''

new_props = '''export default function PaymentSettlementCard({
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
    : "";'''

assert old_props in text
text = text.replace(old_props, new_props)

# 3. Add handleSaveInlineUpi handler
old_handlers = '''  const handleCopyUpi = () => {
    if (!studentUpi) return;
    navigator.clipboard?.writeText(studentUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };'''

new_handlers = '''  const handleSaveInlineUpi = async (e) => {
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
  };'''

assert old_handlers in text
text = text.replace(old_handlers, new_handlers)

# 4. Replace Left column payment display
old_left_col = '''            {selectedMethod === "cash" && !isBusinessConfirmed ? (
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
              // Student View: Shows dynamic QR Code on student's phone screen for business to scan
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
              // Business View: Shows "Pay with UPI App" button on mobile, QR code on desktop, plus verification reminder
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
            )}'''

new_left_col = '''            {selectedMethod === "cash" && !isBusinessConfirmed ? (
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
            )}'''

assert old_left_col in text
text = text.replace(old_left_col, new_left_col)

# 5. Disable "I Paid" button for business when selectedMethod === 'upi' and !hasValidUpi
old_btn = '''                      <Button
                        variant="signal"
                        onClick={handleConfirmAsBusiness}
                        disabled={submitting || isDisputed}
                        className="w-full justify-center !bg-emerald-500 hover:!bg-emerald-400 !text-charcoal font-bold py-3 text-sm"
                      >
                        {submitting ? "Confirming..." : `✓ I Paid ₹${cleanAmount}`}
                      </Button>'''

new_btn = '''                      <Button
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
                      </Button>'''

assert old_btn in text
text = text.replace(old_btn, new_btn)

with open("src/components/payment/PaymentSettlementCard.jsx", "w") as f:
    f.write(text)

print("Updated PaymentSettlementCard.jsx with Part C requirements")
