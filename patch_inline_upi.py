with open("src/components/payment/PaymentSettlementCard.jsx", "r") as f:
    text = f.read()

# 1. Add studentApi import and inline edit state
old_import = 'import * as paymentApi from "../../api/payment.api";'
new_import = '''import * as paymentApi from "../../api/payment.api";
import * as studentApi from "../../api/student.api";'''
text = text.replace(old_import, new_import)

old_state = 'const [submittingDispute, setSubmittingDispute] = useState(false);'
new_state = '''const [submittingDispute, setSubmittingDispute] = useState(false);

  // Quick inline UPI configuration for students right on this card
  const [editingStudentUpi, setEditingStudentUpi] = useState(false);
  const [inlineUpiValue, setInlineUpiValue] = useState("");
  const [savingInlineUpi, setSavingInlineUpi] = useState(false);'''
text = text.replace(old_state, new_state)

# 2. Add inline save handler
old_handler = 'const handleCopyUpi = () => {'
new_handler = '''const handleSaveInlineUpi = async (e) => {
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
      // Update local record copy so QR code renders immediately!
      if (paymentRecord?.student) {
        paymentRecord.student.upiId = val;
      }
      setEditingStudentUpi(false);
      onPaymentUpdated?.({ ...paymentRecord, student: { ...(paymentRecord?.student || {}), upiId: val } });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to save UPI ID.");
    } finally {
      setSavingInlineUpi(false);
    }
  };

  const handleCopyUpi = () => {'''
text = text.replace(old_handler, new_handler)

# 3. Enhance missing UPI box for student with instant input form
old_missing_box = '''                <div className="my-4 flex flex-col items-center justify-center text-center p-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xl font-bold mb-2">
                    !
                  </div>
                  <p className="text-xs font-semibold text-amber-300">You haven&apos;t added a UPI ID yet</p>
                  <p className="text-[11px] text-muted mt-1 max-w-xs">
                    Please add your UPI ID in your Student Profile so businesses can scan and pay you directly, or receive cash.
                  </p>
                </div>'''

new_missing_box = '''                <div className="my-3 flex w-full flex-col items-center justify-center text-center p-2">
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
                </div>'''

text = text.replace(old_missing_box, new_missing_box)

with open("src/components/payment/PaymentSettlementCard.jsx", "w") as f:
    f.write(text)
print("PaymentSettlementCard inline UPI editor added successfully")
