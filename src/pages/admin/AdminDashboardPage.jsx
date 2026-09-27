import React, { useState, useEffect, useCallback } from "react";
import * as adminApi from "../../api/admin.api";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import Badge from "../../components/ui/Badge";

const TABS = [
  { id: "verifications", label: "Aadhaar Verifications", icon: "🪪" },
  { id: "users", label: "User Directory", icon: "👥" },
  { id: "jobs", label: "Job Moderation", icon: "💼" },
  { id: "messages", label: "Support Inquiries", icon: "📬" },
  { id: "overview", label: "Platform Overview", icon: "📊" },
];

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("verifications");
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Verifications & Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [selectedAadhaar, setSelectedAadhaar] = useState(null);
  const [rejectionModalUser, setRejectionModalUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Suspend modal state
  const [suspensionModalUser, setSuspensionModalUser] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState("");

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [jobSearch, setJobSearch] = useState("");

  // Support messages state
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const res = await adminApi.getDashboardMetrics();
      if (res.data) setMetrics(res.data);
    } catch (err) {
      console.error("Failed to load metrics", err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = {};
      if (userRoleFilter !== "all") params.role = userRoleFilter;
      if (userSearch) params.search = userSearch;
      const res = await adminApi.getUsers(params);
      if (res.data?.users) setUsers(res.data.users);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setUsersLoading(false);
    }
  }, [userRoleFilter, userSearch]);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const params = {};
      if (jobStatusFilter !== "all") params.status = jobStatusFilter;
      if (jobSearch) params.search = jobSearch;
      const res = await adminApi.getJobs(params);
      if (res.data?.jobs) setJobs(res.data.jobs);
    } catch (err) {
      console.error("Failed to load jobs", err);
    } finally {
      setJobsLoading(false);
    }
  }, [jobStatusFilter, jobSearch]);

  const fetchMessages = useCallback(async () => {
    setMessagesLoading(true);
    try {
      const res = await adminApi.getContactMessages();
      if (res.data) setMessages(res.data);
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (activeTab === "verifications" || activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "jobs") {
      fetchJobs();
    } else if (activeTab === "messages") {
      fetchMessages();
    }
  }, [activeTab, fetchUsers, fetchJobs, fetchMessages]);

  // Handlers
  const handleVerifyStudent = async (studentId, status, reason = "") => {
    try {
      await adminApi.verifyStudent(studentId, { status, reason });
      showToast(status === "verified" ? "Student ID verified successfully!" : "Student verification rejected.");
      setRejectionModalUser(null);
      setRejectionReason("");
      setSelectedAadhaar(null);
      fetchUsers();
      fetchMetrics();
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed.");
    }
  };

  const handleSuspendUser = async () => {
    if (!suspensionModalUser || !suspensionReason.trim()) return;
    try {
      await adminApi.suspendUser(suspensionModalUser._id, { reason: suspensionReason });
      showToast(`Account for ${suspensionModalUser.name} has been suspended.`);
      setSuspensionModalUser(null);
      setSuspensionReason("");
      fetchUsers();
      fetchMetrics();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to suspend account.");
    }
  };

  const handleUnsuspendUser = async (u) => {
    try {
      await adminApi.unsuspendUser(u._id);
      showToast(`Account for ${u.name} has been reinstated.`);
      fetchUsers();
      fetchMetrics();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reinstate account.");
    }
  };

  const handleDeleteJob = async (jobId, title) => {
    if (!window.confirm(`Are you sure you want to permanently take down "${title}"?`)) return;
    try {
      await adminApi.deleteJob(jobId);
      showToast("Job listing was successfully removed.");
      fetchJobs();
      fetchMetrics();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete job.");
    }
  };

  const handleMarkMessageRead = async (messageId) => {
    try {
      await adminApi.markContactMessageRead(messageId);
      showToast("Message marked as resolved.");
      fetchMessages();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update message.");
    }
  };

  const pendingStudents = users.filter((u) => u.role === "student" && u.verificationStatus === "pending");

  return (
    <div className="min-h-screen bg-canvas pb-24 pt-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-teal/30 bg-paper px-5 py-3 shadow-2xl animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-teal animate-ping" />
          <p className="font-mono text-xs text-ink">{toastMessage}</p>
        </div>
      )}

      <div className="container-app space-y-8">
        {/* Page Top Bar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper/60 p-6 backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal/15 text-signal font-mono text-xs font-bold">
                AD
              </span>
              <span className="eyebrow text-signal">NearPin Master Administration</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink md:text-3xl">Admin Control Center</h1>
            <p className="mt-1 text-xs text-muted">
              Signed in as <span className="font-mono text-ink">{user?.email || "Admin"}</span> • Platform Security & Moderation
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchMetrics();
                fetchUsers();
                fetchJobs();
                fetchMessages();
                showToast("Data refreshed.");
              }}
            >
              🔄 Refresh Data
            </Button>
            <div className="hidden h-8 w-px bg-line sm:block" />
            <div className="flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3.5 py-1 text-xs font-mono text-teal-light">
              <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
              <span>System Live</span>
            </div>
          </div>
        </div>

        {/* Platform KPI Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <div className="card border border-line bg-paper p-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">Total Students</span>
            <p className="mt-2 text-2xl font-bold font-mono text-ink">
              {loadingMetrics ? "..." : metrics?.totalStudents ?? 0}
            </p>
            <span className="mt-1 block text-[10px] text-muted">Registered in portal</span>
          </div>

          <div className="card border border-line bg-paper p-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">Pending Aadhaar</span>
            <p className="mt-2 text-2xl font-bold font-mono text-signal">
              {loadingMetrics ? "..." : metrics?.pendingVerifications ?? 0}
            </p>
            <span className="mt-1 block text-[10px] text-signal/80 font-mono">Needs review</span>
          </div>

          <div className="card border border-line bg-paper p-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">Verified Students</span>
            <p className="mt-2 text-2xl font-bold font-mono text-teal-light">
              {loadingMetrics ? "..." : metrics?.verifiedStudents ?? 0}
            </p>
            <span className="mt-1 block text-[10px] text-muted">Aadhaar approved</span>
          </div>

          <div className="card border border-line bg-paper p-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">Businesses</span>
            <p className="mt-2 text-2xl font-bold font-mono text-ink">
              {loadingMetrics ? "..." : metrics?.totalBusinesses ?? 0}
            </p>
            <span className="mt-1 block text-[10px] text-muted">Registered shops</span>
          </div>

          <div className="card border border-line bg-paper p-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">Active Shifts</span>
            <p className="mt-2 text-2xl font-bold font-mono text-gold">
              {loadingMetrics ? "..." : metrics?.activeJobs ?? 0}
            </p>
            <span className="mt-1 block text-[10px] text-muted">In progress now</span>
          </div>

          <div className="card border border-line bg-paper p-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">Completed Jobs</span>
            <p className="mt-2 text-2xl font-bold font-mono text-ink">
              {loadingMetrics ? "..." : metrics?.completedJobs ?? 0}
            </p>
            <span className="mt-1 block text-[10px] text-muted">Paid & rated</span>
          </div>

          <div className="card border border-line bg-paper p-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">Suspended</span>
            <p className="mt-2 text-2xl font-bold font-mono text-rose-400">
              {loadingMetrics ? "..." : metrics?.suspendedAccounts ?? 0}
            </p>
            <span className="mt-1 block text-[10px] text-muted">Banned accounts</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-line overflow-x-auto pb-px">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 whitespace-nowrap px-5 py-3 text-sm font-medium transition ${
                  isActive ? "text-signal font-semibold" : "text-muted hover:text-ink"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === "verifications" && (metrics?.pendingVerifications ?? 0) > 0 && (
                  <span className="ml-1 rounded-full bg-signal px-2 py-0.5 text-[10px] font-bold text-canvas">
                    {metrics.pendingVerifications}
                  </span>
                )}
                {tab.id === "messages" && messages.filter((m) => !m.isRead).length > 0 && (
                  <span className="ml-1 rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold text-canvas">
                    {messages.filter((m) => !m.isRead).length}
                  </span>
                )}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-signal" />}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Aadhaar Verifications */}
        {activeTab === "verifications" && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-ink">Student Aadhaar Verification Queue</h2>
                <p className="text-xs text-muted">
                  Review student uploaded Aadhaar documents to confirm identity and age (18–26) before they can accept shifts.
                </p>
              </div>
              <div className="font-mono text-xs text-muted">
                Showing {pendingStudents.length} pending review(s)
              </div>
            </div>

            {usersLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Spinner size={32} />
              </div>
            ) : pendingStudents.length === 0 ? (
              <div className="card flex min-h-[260px] flex-col items-center justify-center p-8 text-center border-dashed">
                <span className="text-4xl">🎉</span>
                <h3 className="mt-3 text-base font-bold text-ink">Queue is Empty</h3>
                <p className="mt-1 max-w-sm text-xs text-muted">
                  All uploaded student identity documents have been reviewed and processed.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingStudents.map((s) => (
                  <div key={s._id} className="card border border-line bg-paper p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-ink">{s.name}</h3>
                          <Badge tone="signal">Pending Review</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          🏫 {s.collegeName || "College not provided"} • ID: <span className="font-mono">{s.collegeIdCard || "N/A"}</span>
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-faint">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-y border-line/60 py-3">
                      <div>
                        <span className="text-muted block text-[11px]">Email</span>
                        <span className="font-mono text-ink break-all">{s.email}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[11px]">Phone</span>
                        <span className="font-mono text-ink">{s.phone}</span>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-muted block text-[11px]">Campus Location</span>
                        <span className="text-ink">{s.location || "Bengaluru"}</span>
                      </div>
                    </div>

                    {/* Aadhaar Document Preview trigger */}
                    <div className="flex items-center justify-between rounded-lg border border-line/80 bg-canvas/60 p-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">📄</span>
                        <div>
                          <p className="text-xs font-medium text-ink">Aadhaar Card Document</p>
                          <p className="text-[10px] text-muted">Identity & Age Verification</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedAadhaar(s)}
                        className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-mono text-teal-light hover:border-teal transition"
                      >
                        Inspect Image 🔍
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="signal"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleVerifyStudent(s._id, "verified")}
                      >
                        ✓ Approve & Verify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 !border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                        onClick={() => setRejectionModalUser(s)}
                      >
                        ✕ Reject With Reason
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: User Directory */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-ink">Platform User Directory</h2>
                <p className="text-xs text-muted">
                  Manage registered students and business owners, monitor account integrity, and suspend violators.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink placeholder:text-faint focus:border-signal focus:outline-none"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink focus:border-signal focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="business">Businesses</option>
                </select>
              </div>
            </div>

            {usersLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Spinner size={32} />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-line bg-paper">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-canvas/40 font-mono text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Location / Org</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-white/[0.02] transition">
                        <td className="px-4 py-3 font-medium text-ink">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal/10 font-bold text-signal text-xs">
                              {u.name?.charAt(0) || "U"}
                            </span>
                            <div>
                              <p className="font-semibold">{u.name}</p>
                              {u.ownerName && <p className="text-[10px] text-muted">Owner: {u.ownerName}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <Badge tone={u.role === "student" ? "teal" : "gold"}>
                            {u.role}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 font-mono text-muted">
                          <p className="text-ink">{u.email}</p>
                          <p className="text-[11px]">{u.phone}</p>
                        </td>

                        <td className="px-4 py-3 text-muted">
                          <p className="text-ink">{u.businessName || u.collegeName || "—"}</p>
                          <p className="text-[11px]">{u.location || "Bengaluru"}</p>
                        </td>

                        <td className="px-4 py-3">
                          {u.isSuspended ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-mono text-rose-400">
                              ⛔ Suspended
                            </span>
                          ) : u.verificationStatus === "verified" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2.5 py-0.5 text-[10px] font-mono text-teal-light">
                              ✓ Verified
                            </span>
                          ) : u.verificationStatus === "pending" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-signal/15 px-2.5 py-0.5 text-[10px] font-mono text-signal">
                              ⏳ Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-mono text-faint">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {u.isSuspended ? (
                            <button
                              onClick={() => handleUnsuspendUser(u)}
                              className="rounded border border-teal/40 bg-teal/10 px-2.5 py-1 font-mono text-[11px] text-teal-light hover:bg-teal/20 transition"
                            >
                              Re-activate
                            </button>
                          ) : (
                            <button
                              onClick={() => setSuspensionModalUser(u)}
                              className="rounded border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 font-mono text-[11px] text-rose-400 hover:bg-rose-500/20 transition"
                            >
                              Suspend
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Job Moderation */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-ink">Job Moderation & Takedowns</h2>
                <p className="text-xs text-muted">
                  Inspect shifts posted by local businesses. Remove listings that violate safety, wage minimums, or fair task policies.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter jobs or shops..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink placeholder:text-faint focus:border-signal focus:outline-none"
                />
                <select
                  value={jobStatusFilter}
                  onChange={(e) => setJobStatusFilter(e.target.value)}
                  className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink focus:border-signal focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Shifts</option>
                  <option value="published">Published / Open</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {jobsLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Spinner size={32} />
              </div>
            ) : jobs.length === 0 ? (
              <div className="card flex min-h-[220px] flex-col items-center justify-center p-8 text-center border-dashed">
                <p className="text-sm text-muted">No jobs matching criteria.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {jobs.map((j) => (
                  <div key={j._id} className="card border border-line bg-paper p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-teal-light font-bold">₹{j.hourlyRate}/hr</span>
                          <span className="text-muted">•</span>
                          <span className="font-mono text-xs text-muted">Total: ₹{j.totalPay}</span>
                        </div>
                        <h3 className="mt-1 text-base font-bold text-ink">{j.title}</h3>
                        <p className="text-xs text-muted">🏪 {j.businessName}</p>
                      </div>
                      <Badge tone={j.status === "active" ? "signal" : j.status === "completed" ? "teal" : "neutral"}>
                        {j.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-y border-line/60 py-2.5">
                      <div>
                        <span className="text-muted block text-[11px]">Category</span>
                        <span className="text-ink">{j.category}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[11px]">Workers Filled</span>
                        <span className="font-mono text-ink">{j.filledWorkers} / {j.requiredWorkers} filled</span>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-muted block text-[11px]">Location</span>
                        <span className="text-ink">{j.location}</span>
                      </div>
                    </div>

                    {j.reportsCount > 0 && (
                      <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                        ⚠️ <strong>Flagged:</strong> {j.reportsCount} worker report(s) filed against this listing.
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="!border-rose-500/40 text-rose-400 hover:bg-rose-500/15"
                        onClick={() => handleDeleteJob(j._id, j.title)}
                      >
                        🗑️ Take Down Job
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Support Inquiries */}
        {activeTab === "messages" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink">Public Contact & Support Messages</h2>
                <p className="text-xs text-muted">
                  Messages submitted by visitors, students, and businesses from the /contact form.
                </p>
              </div>
            </div>

            {messagesLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Spinner size={32} />
              </div>
            ) : messages.length === 0 ? (
              <div className="card flex min-h-[220px] flex-col items-center justify-center p-8 text-center border-dashed">
                <p className="text-sm text-muted">No support messages found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div
                    key={m._id}
                    className={`card border p-5 transition ${
                      m.isRead ? "border-line bg-paper/60 opacity-80" : "border-teal/40 bg-paper"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-ink">{m.subject}</h3>
                          {!m.isRead && (
                            <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-mono font-bold text-canvas">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          From: <span className="font-semibold text-ink">{m.name}</span> (
                          <span className="font-mono">{m.email}</span>)
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-faint">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-3 rounded-lg border border-line/60 bg-canvas/40 p-3 text-xs leading-relaxed text-ink">
                      {m.message}
                    </p>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      {!m.isRead ? (
                        <button
                          onClick={() => handleMarkMessageRead(m._id)}
                          className="rounded-lg border border-teal/40 bg-teal/10 px-3 py-1.5 font-mono text-xs text-teal-light hover:bg-teal/20 transition"
                        >
                          ✓ Mark as Resolved
                        </button>
                      ) : (
                        <span className="font-mono text-xs text-muted">✓ Resolved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Platform Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-ink">Platform Architecture & Health</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="card border border-line bg-paper p-5 space-y-3">
                <span className="eyebrow text-teal">Security Policy</span>
                <h3 className="text-base font-bold text-ink">Student Aadhaar Verification</h3>
                <p className="text-xs leading-relaxed text-muted">
                  Students cannot apply to any shift until Aadhaar verification is confirmed by an administrator. Age is verified to stay strictly within 18–26.
                </p>
                <div className="pt-2">
                  <Badge tone="teal">Enforced by Server Guard</Badge>
                </div>
              </div>

              <div className="card border border-line bg-paper p-5 space-y-3">
                <span className="eyebrow text-signal">Direct Payment Policy</span>
                <h3 className="text-base font-bold text-ink">0% Commission Model</h3>
                <p className="text-xs leading-relaxed text-muted">
                  NearPin does not hold escrow or take cuts from student wages. Businesses pay students directly via UPI upon shift completion and sign-off.
                </p>
                <div className="pt-2">
                  <Badge tone="signal">UPI P2P Direct</Badge>
                </div>
              </div>

              <div className="card border border-line bg-paper p-5 space-y-3">
                <span className="eyebrow text-gold">Radius Constraint</span>
                <h3 className="text-base font-bold text-ink">5-Kilometer Geo Radius</h3>
                <p className="text-xs leading-relaxed text-muted">
                  All shifts are geo-indexed via MongoDB 2dsphere points. Students only receive notifications for jobs within 5km of their college or hostel.
                </p>
                <div className="pt-2">
                  <Badge tone="gold">MongoDB 2dsphere</Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Aadhaar Document Preview */}
      {selectedAadhaar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-line bg-paper p-6 shadow-2xl animate-fade-in space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">Aadhaar Card Preview</h3>
                <p className="text-xs text-muted">
                  Student: <span className="font-semibold text-ink">{selectedAadhaar.name}</span> • {selectedAadhaar.collegeName}
                </p>
              </div>
              <button
                onClick={() => setSelectedAadhaar(null)}
                className="rounded-full border border-line p-1 text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-canvas">
              <img
                src={selectedAadhaar.aadhaarUrl}
                alt="Aadhaar Card Document"
                className="h-64 w-full object-cover"
              />
            </div>

            <div className="rounded-lg bg-canvas/60 p-3 text-xs text-muted space-y-1">
              <p>📌 <strong>Admin Checklist:</strong></p>
              <p>1. Name matches official college registration name.</p>
              <p>2. Date of birth confirms student is between 18 and 26 years old.</p>
              <p>3. Document numbers and photo are clearly legible.</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedAadhaar(null)}>
                Close
              </Button>
              <Button
                variant="signal"
                size="sm"
                onClick={() => handleVerifyStudent(selectedAadhaar._id, "verified")}
              >
                ✓ Approve Aadhaar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Rejection Reason */}
      {rejectionModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-6 shadow-2xl animate-fade-in space-y-4">
            <h3 className="text-lg font-bold text-ink">Reject Student Verification</h3>
            <p className="text-xs text-muted">
              Please specify the rejection reason for <span className="font-semibold text-ink">{rejectionModalUser.name}</span>. The student will receive this notification and can re-upload their document.
            </p>

            <div>
              <label className="block text-xs font-mono text-muted mb-1">Reason for Rejection</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Uploaded image was blurry, name on document did not match registration..."
                className="w-full rounded-xl border border-line bg-canvas p-3 text-xs text-ink focus:border-signal focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setRejectionModalUser(null)}>
                Cancel
              </Button>
              <Button
                variant="signal"
                size="sm"
                className="!bg-rose-500 hover:!bg-rose-600"
                onClick={() => handleVerifyStudent(rejectionModalUser._id, "rejected", rejectionReason)}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Suspend User */}
      {suspensionModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-6 shadow-2xl animate-fade-in space-y-4">
            <h3 className="text-lg font-bold text-ink">Suspend Account</h3>
            <p className="text-xs text-muted">
              You are suspending <span className="font-semibold text-ink">{suspensionModalUser.name}</span> ({suspensionModalUser.role}). Suspended users will be immediately locked out of posting or accepting jobs.
            </p>

            <div>
              <label className="block text-xs font-mono text-muted mb-1">Reason for Suspension</label>
              <textarea
                rows={3}
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="e.g. Failure to pay worker, fraudulent job postings, inappropriate conduct..."
                className="w-full rounded-xl border border-line bg-canvas p-3 text-xs text-ink focus:border-signal focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setSuspensionModalUser(null)}>
                Cancel
              </Button>
              <Button
                variant="signal"
                size="sm"
                className="!bg-rose-600 hover:!bg-rose-700"
                disabled={!suspensionReason.trim()}
                onClick={handleSuspendUser}
              >
                Confirm Suspension
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
