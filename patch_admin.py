import re

with open("src/pages/admin/AdminDashboardPage.jsx", "r") as f:
    content = f.read()

# 1. Add disputes tab to TABS
tab_old = '{ id: "messages", label: "Support Inquiries", icon: "📬" },'
tab_new = '{ id: "disputes", label: "Payment Disputes", icon: "⚖️" },\n  { id: "messages", label: "Support Inquiries", icon: "📬" },'
content = content.replace(tab_old, tab_new)

# 2. Add import for paymentApi
if 'import * as paymentApi' not in content:
    content = 'import * as paymentApi from "../../api/payment.api";\n' + content

# 3. Add disputes state
state_anchor = 'const [messagesLoading, setMessagesLoading] = useState(false);'
state_new = '''const [messagesLoading, setMessagesLoading] = useState(false);

  // Payment Disputes state
  const [disputes, setDisputes] = useState([]);
  const [disputesLoading, setDisputesLoading] = useState(false);'''
content = content.replace(state_anchor, state_new)

# 4. Add fetchDisputes
fetch_anchor = 'const fetchMessages = useCallback(async () => {'
fetch_new = '''const fetchDisputes = useCallback(async () => {
    setDisputesLoading(true);
    try {
      const res = await paymentApi.getDisputedPayments();
      setDisputes(res.data || []);
    } catch {
      showToast("Failed to load payment disputes.");
    } finally {
      setDisputesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "disputes") {
      fetchDisputes();
    }
  }, [activeTab, fetchDisputes]);

  const fetchMessages = useCallback(async () => {'''
content = content.replace(fetch_anchor, fetch_new)

# 5. Add dispute badge in tab bar
badge_anchor = '{tab.id === "messages" && messages.filter((m) => !m.isRead).length > 0 && ('
badge_new = '''{tab.id === "disputes" && disputes.length > 0 && (
                  <span className="ml-1 rounded-full bg-signal px-2 py-0.5 text-[10px] font-bold text-canvas">
                    {disputes.length}
                  </span>
                )}
                {tab.id === "messages" && messages.filter((m) => !m.isRead).length > 0 && ('''
content = content.replace(badge_anchor, badge_new)

# 6. Add dispute view tab content before overview
overview_anchor = '{activeTab === "overview" && ('
dispute_view = '''{activeTab === "disputes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink">Disputed Payment Settlements</h2>
                <p className="text-xs text-muted">
                  Transactions where either the student reported non-receipt or the business reported an issue.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchDisputes} disabled={disputesLoading}>
                {disputesLoading ? "Refreshing..." : "Refresh Disputes"}
              </Button>
            </div>

            {disputesLoading ? (
              <div className="flex justify-center p-12 text-sm text-muted">Loading disputes...</div>
            ) : disputes.length === 0 ? (
              <div className="card border border-line bg-paper p-12 text-center">
                <span className="text-3xl">✓</span>
                <h3 className="mt-2 text-base font-bold text-ink">Zero Active Disputes</h3>
                <p className="mt-1 text-xs text-muted">All student-business settlements are clear.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((d) => (
                  <div key={d._id} className="card border border-signal/40 bg-paper p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-signal uppercase tracking-wider">
                          Disputed on {new Date(d.disputedAt || d.updatedAt).toLocaleDateString()}
                        </span>
                        <h3 className="text-base font-bold text-ink">{d.job?.title || "Shift Assignment"}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted block uppercase">Amount</span>
                        <span className="text-lg font-bold font-mono text-emerald-400">₹{d.agreedPaymentAmount}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-signal/10 border border-signal/20 p-3 text-xs text-signal-light">
                      <p className="font-bold text-ink">Dispute Reason:</p>
                      <p className="mt-0.5">{d.disputeReason}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 text-xs pt-1">
                      <div className="rounded-lg bg-charcoal p-3 border border-line">
                        <p className="font-bold text-ink">Student</p>
                        <p className="text-muted">{d.student?.name} ({d.student?.email})</p>
                        <p className="font-mono text-ink mt-1">UPI: {d.student?.upiId || "Not set"}</p>
                        <p className="mt-1 text-[11px] text-muted">
                          Receipt Status: {d.studentConfirmation?.confirmed ? "Confirmed ✓" : "Unconfirmed ✗"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-charcoal p-3 border border-line">
                        <p className="font-bold text-ink">Business</p>
                        <p className="text-muted">{d.business?.businessName || d.business?.name} ({d.business?.email})</p>
                        <p className="font-mono text-ink mt-1">Method: {d.paymentMethod} {d.upiReference ? `(UTR: ${d.upiReference})` : ""}</p>
                        <p className="mt-1 text-[11px] text-muted">
                          Dispatch Status: {d.businessConfirmation?.confirmed ? "Confirmed ✓" : "Unconfirmed ✗"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "overview" && ('''
content = content.replace(overview_anchor, dispute_view)

with open("src/pages/admin/AdminDashboardPage.jsx", "w") as f:
    f.write(content)
print("AdminDashboardPage successfully patched with Disputes tab!")
