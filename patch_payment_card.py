with open("src/components/payment/PaymentSettlementCard.jsx", "r") as f:
    text = f.read()

# 1. Clean import
text = text.replace('import * as studentApi from "../../api/student.api";\n', '')

# 2. Remove inline state and handler
old_chunk = '''  // Quick inline UPI configuration for students right on this card
  const [editingStudentUpi, setEditingStudentUpi] = useState(false);
  const [inlineUpiValue, setInlineUpiValue] = useState("");
  const [savingInlineUpi, setSavingInlineUpi] = useState(false);

  // Authoritative server-side values only
  const cleanAmount = Number(paymentRecord?.agreedPaymentAmount || 0).toFixed(2);
  const studentName = paymentRecord?.student?.name || "Student";
  const studentUpi = (paymentRecord?.student?.upiId || "").trim();
  const hasValidUpi = Boolean(studentUpi && studentUpi.includes("@"));

  // Standard NPCI UPI URI Specification (Only generated if student has a valid UPI ID)
  const sanitizedTitle = (jobTitle || "NearPin Task").slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, "");
  const upiUri = hasValidUpi
    ? `upi://pay?pa=${encodeURIComponent(studentUpi)}&pn=${encodeURIComponent(studentName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(sanitizedTitle)}`
    : "";

  const isBusinessConfirmed = Boolean(paymentRecord?.businessConfirmation?.confirmed);
  const isStudentConfirmed = Boolean(paymentRecord?.studentConfirmation?.confirmed);
  const isFullySettled = Boolean(paymentRecord?.isFullyConfirmed);
  const isDisputed = Boolean(paymentRecord?.isDisputed);

  const handleSaveInlineUpi = async (e) => {
    e.preventDefault();
    const val = inlineUpiValue.trim().toLowerCase();
    if (!val || !val.includes("@") || val.length < 5) {
      setError("Please enter a valid UPI ID format (e.g. yourname@oksbi or mobile@paytm).");
      return;
    }
    setSavingInlineUpi(true);
    setError(null);
    try {
      await studentApi.updateProfile({ upiId: val });
      setEditingStudentUpi(false);
      onPaymentUpdated?.({
        ...paymentRecord,
        student: {
          ...(paymentRecord?.student || {}),
          upiId: val,
        },
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to save UPI ID.");
    } finally {
      setSavingInlineUpi(false);
    }
  };'''

new_chunk = '''  // Authoritative server-side values only (UPI is collected upfront at registration or agreement signing)
  const cleanAmount = Number(paymentRecord?.agreedPaymentAmount || 0).toFixed(2);
  const studentName = paymentRecord?.student?.name || "Student";
  const studentUpi = (paymentRecord?.student?.upiId || "").trim();
  const hasValidUpi = Boolean(studentUpi && studentUpi.includes("@"));

  // Standard NPCI UPI URI Specification
  const sanitizedTitle = (jobTitle || "NearPin Task").slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, "");
  const upiUri = hasValidUpi
    ? `upi://pay?pa=${encodeURIComponent(studentUpi)}&pn=${encodeURIComponent(studentName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(sanitizedTitle)}`
    : "";

  const isBusinessConfirmed = Boolean(paymentRecord?.businessConfirmation?.confirmed);
  const isStudentConfirmed = Boolean(paymentRecord?.studentConfirmation?.confirmed);
  const isFullySettled = Boolean(paymentRecord?.isFullyConfirmed);
  const isDisputed = Boolean(paymentRecord?.isDisputed);'''

assert old_chunk in text, "old_chunk not found"
text = text.replace(old_chunk, new_chunk)

# 3. Replace QR / Mobile app intent section
old_display = '''            {selectedMethod === "cash" && !isBusinessConfirmed ? (
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
              // Student View: QR Code if valid UPI ID is present, or prompt to add it
              hasValidUpi ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 font-mono">
                    Show this QR to Business
                  </p>
                  <div className="relative rounded-2xl bg-white p-3 shadow-inner">
                    <QRCodeSVG value={upiUri} size={160} level="M" includeMargin={false} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink">Scan with any UPI App</p>
                  <div className="mt-2 flex items-center justify-center gap-2">
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
                    !
                  </div>
                  <p className="text-xs font-semibold text-amber-300">You haven&apos;t added a UPI ID yet</p>
                  <p className="text-[11px] text-muted mt-1 max-w-xs">
                    Enter your real UPI ID (e.g. <span className="font-mono text-ink">name@oksbi</span> or <span className="font-mono text-ink">phone@paytm</span>) to instantly generate your payment QR code.
                  </p>

                  {editingStudentUpi ? (
                    <form onSubmit={handleSaveInlineUpi} className="mt-3 w-full max-w-xs space-y-2">
                      <input
                        type="text"
                        value={inlineUpiValue}
                        onChange={(e) => setInlineUpiValue(e.target.value)}
                        placeholder="yourname@okaxis"
                        className="w-full rounded-xl border border-line bg-charcoal px-3 py-2 text-xs font-mono text-ink focus:border-teal focus:outline-none text-center"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingStudentUpi(false)}
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
                        setInlineUpiValue("");
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
              // Business View: Shows student's verified UPI or warning if student has not added it
              hasValidUpi ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 font-mono">
                    Student UPI Information
                  </p>
                  <div className="my-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-ink text-sm">{studentName}</p>
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
                  <p className="mt-2 text-xs text-muted">
                    Scan the dynamic QR code on the student&apos;s phone screen, or transfer to the UPI ID above.
                  </p>
                </>
              ) : (
                <div className="my-6 flex flex-col items-center justify-center text-center p-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xl font-bold mb-2">
                    !
                  </div>
                  <p className="text-xs font-semibold text-amber-300">Student hasn&apos;t added a UPI ID</p>
                  <p className="text-[11px] text-muted mt-1 max-w-xs">
                    The student has not configured a UPI ID. Please settle this payment in Cash or ask the student to update their profile.
                  </p>
                </div>
              )
            )}'''

new_display = '''            {selectedMethod === "cash" && !isBusinessConfirmed ? (
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

assert old_display in text, "old_display not found"
text = text.replace(old_display, new_display)

with open("src/components/payment/PaymentSettlementCard.jsx", "w") as f:
    f.write(text)

print("PaymentSettlementCard updated with hardened mobile/desktop flow and verification guard")
