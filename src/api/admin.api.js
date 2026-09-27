import axiosClient from "./axiosClient";

const STORAGE_KEY = "nearpin_admin_mock_data_v1";

const initialMockData = {
  metrics: {
    totalStudents: 142,
    verifiedStudents: 118,
    pendingVerifications: 24,
    totalBusinesses: 58,
    totalJobs: 312,
    activeJobs: 19,
    completedJobs: 284,
    suspendedAccounts: 3,
  },
  users: [
    {
      _id: "usr-s1",
      name: "Aarav Sharma",
      email: "aarav.sharma@college.edu",
      phone: "9876543211",
      role: "student",
      collegeName: "Bangalore Institute of Technology",
      collegeIdCard: "BIT-2023-CS-041",
      verificationStatus: "pending",
      aadhaarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      location: "Koramangala, Bengaluru",
      isSuspended: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      _id: "usr-s2",
      name: "Pooja Patel",
      email: "pooja.patel@univ.edu",
      phone: "9876543212",
      role: "student",
      collegeName: "RV College of Engineering",
      collegeIdCard: "RVCE-EC-109",
      verificationStatus: "pending",
      aadhaarUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
      location: "Jayanagar, Bengaluru",
      isSuspended: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      _id: "usr-s3",
      name: "Rohan Verma",
      email: "rohan.v@mit.edu",
      phone: "9876543213",
      role: "student",
      collegeName: "BMS College of Engineering",
      collegeIdCard: "BMS-ME-052",
      verificationStatus: "verified",
      aadhaarUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80",
      location: "Basavanagudi, Bengaluru",
      isSuspended: false,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      _id: "usr-b1",
      name: "Freshmart Daily Grocery",
      ownerName: "Sunil Hegde",
      email: "sunil@freshmart.in",
      phone: "9876543214",
      role: "business",
      businessName: "Freshmart Daily Grocery Store",
      businessCategory: "Retail Store",
      location: "Indiranagar 100ft Rd, Bengaluru",
      isSuspended: false,
      activeJobsCount: 2,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      _id: "usr-b2",
      name: "Artisan Cafe & Bakery",
      ownerName: "Meera Nair",
      email: "contact@artisancafe.in",
      phone: "9876543215",
      role: "business",
      businessName: "Artisan Cafe & Bakery",
      businessCategory: "Cafe / Hospitality",
      location: "HSR Layout Sector 4, Bengaluru",
      isSuspended: false,
      activeJobsCount: 1,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
    {
      _id: "usr-b3",
      name: "QuickPack Logistics",
      ownerName: "Vikas Sethi",
      email: "vikas@quickpack.in",
      phone: "9876543216",
      role: "business",
      businessName: "QuickPack Logistics",
      businessCategory: "Warehousing & Logistics",
      location: "Whitefield, Bengaluru",
      isSuspended: true,
      suspensionReason: "Reported for delayed payments to student workers.",
      activeJobsCount: 0,
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
  ],
  jobs: [
    {
      _id: "job-101",
      title: "Weekend Store Assistant & Barcode Scanning",
      businessName: "Freshmart Daily Grocery Store",
      category: "Retail Support",
      hourlyRate: 180,
      estimatedHours: 4,
      totalPay: 720,
      location: "Indiranagar 100ft Rd, Bengaluru",
      requiredWorkers: 2,
      filledWorkers: 1,
      status: "active",
      reportsCount: 0,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      _id: "job-102",
      title: "Event Hospitality & Guest Check-in Staff",
      businessName: "Artisan Cafe & Bakery",
      category: "Event Helper",
      hourlyRate: 220,
      estimatedHours: 5,
      totalPay: 1100,
      location: "HSR Layout Sector 4, Bengaluru",
      requiredWorkers: 3,
      filledWorkers: 3,
      status: "active",
      reportsCount: 0,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      _id: "job-103",
      title: "Promotional Flyer Distribution at Tech Park",
      businessName: "QuickPack Logistics",
      category: "Marketing",
      hourlyRate: 150,
      estimatedHours: 3,
      totalPay: 450,
      location: "Electronic City Phase 1, Bengaluru",
      requiredWorkers: 4,
      filledWorkers: 0,
      status: "published",
      reportsCount: 2,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: "job-104",
      title: "Inventory Stock Counting (Night Shift)",
      businessName: "GreenBasket Supermarket",
      category: "Warehouse",
      hourlyRate: 250,
      estimatedHours: 6,
      totalPay: 1500,
      location: "Koramangala 5th Block, Bengaluru",
      requiredWorkers: 2,
      filledWorkers: 2,
      status: "completed",
      reportsCount: 0,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ],
  contactMessages: [
    {
      _id: "msg-1",
      name: "Vikram Malhotra",
      email: "vikram@techstartup.io",
      subject: "Partnership Inquiry for Campus Hiring",
      message: "Hello Nearpin Team, we are looking to hire 15 campus ambassadors for our upcoming hackathon next month. Can we schedule a brief call?",
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      _id: "msg-2",
      name: "Sneha Rao",
      email: "sneha.rao@college.edu",
      subject: "Aadhaar Card Verification Time",
      message: "Hi, I uploaded my Aadhaar card 2 days ago for student registration. How long does the verification typically take? Thank you!",
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      _id: "msg-3",
      name: "Rajesh Kumar",
      email: "rajesh@superstore.com",
      subject: "UPI Direct Payment Question",
      message: "Does the system automatically calculate the hours when a student finishes the shift? Works great so far!",
      isRead: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
};

function getMockStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockData));
    return initialMockData;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return initialMockData;
  }
}

function saveMockStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Fetch dashboard metrics
export const getDashboardMetrics = async () => {
  try {
    const res = await axiosClient.get("/admin/dashboard");
    return res.data;
  } catch {
    const store = getMockStore();
    return { success: true, data: store.metrics };
  }
};

// Fetch users with filters
export const getUsers = async (params = {}) => {
  try {
    const res = await axiosClient.get("/admin/users", { params });
    return res.data;
  } catch {
    const store = getMockStore();
    let filtered = [...store.users];
    if (params.role) {
      filtered = filtered.filter((u) => u.role === params.role);
    }
    if (params.verificationStatus) {
      filtered = filtered.filter((u) => u.verificationStatus === params.verificationStatus);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q) ||
          u.collegeName?.toLowerCase().includes(q) ||
          u.businessName?.toLowerCase().includes(q)
      );
    }
    return {
      success: true,
      data: {
        users: filtered,
        total: filtered.length,
      },
    };
  }
};

// Verify student Aadhaar
export const verifyStudent = async (userId, { status, reason = "" }) => {
  try {
    const res = await axiosClient.patch(`/admin/users/${userId}/verify`, { status, reason });
    return res.data;
  } catch {
    const store = getMockStore();
    const idx = store.users.findIndex((u) => u._id === userId);
    if (idx !== -1) {
      store.users[idx].verificationStatus = status;
      if (status === "rejected") {
        store.users[idx].rejectionReason = reason;
      }
      if (status === "verified") {
        store.metrics.pendingVerifications = Math.max(0, store.metrics.pendingVerifications - 1);
        store.metrics.verifiedStudents += 1;
      }
      saveMockStore(store);
    }
    return { success: true, message: `Student marked as ${status}.` };
  }
};

// Suspend user
export const suspendUser = async (userId, { reason }) => {
  try {
    const res = await axiosClient.patch(`/admin/users/${userId}/suspend`, { reason });
    return res.data;
  } catch {
    const store = getMockStore();
    const idx = store.users.findIndex((u) => u._id === userId);
    if (idx !== -1) {
      store.users[idx].isSuspended = true;
      store.users[idx].suspensionReason = reason;
      store.metrics.suspendedAccounts += 1;
      saveMockStore(store);
    }
    return { success: true, message: "User suspended." };
  }
};

// Unsuspend user
export const unsuspendUser = async (userId) => {
  try {
    const res = await axiosClient.patch(`/admin/users/${userId}/unsuspend`);
    return res.data;
  } catch {
    const store = getMockStore();
    const idx = store.users.findIndex((u) => u._id === userId);
    if (idx !== -1) {
      store.users[idx].isSuspended = false;
      delete store.users[idx].suspensionReason;
      store.metrics.suspendedAccounts = Math.max(0, store.metrics.suspendedAccounts - 1);
      saveMockStore(store);
    }
    return { success: true, message: "User reinstated." };
  }
};

// Get jobs for moderation
export const getJobs = async (params = {}) => {
  try {
    const res = await axiosClient.get("/admin/jobs", { params });
    return res.data;
  } catch {
    const store = getMockStore();
    let jobs = [...store.jobs];
    if (params.search) {
      const q = params.search.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.businessName.toLowerCase().includes(q) ||
          j.category.toLowerCase().includes(q)
      );
    }
    if (params.status) {
      jobs = jobs.filter((j) => j.status === params.status);
    }
    return { success: true, data: { jobs, total: jobs.length } };
  }
};

// Delete job (take down)
export const deleteJob = async (jobId) => {
  try {
    const res = await axiosClient.delete(`/admin/jobs/${jobId}`);
    return res.data;
  } catch {
    const store = getMockStore();
    store.jobs = store.jobs.filter((j) => j._id !== jobId);
    store.metrics.totalJobs = Math.max(0, store.metrics.totalJobs - 1);
    saveMockStore(store);
    return { success: true, message: "Job listing removed." };
  }
};

// Get contact messages
export const getContactMessages = async () => {
  try {
    const res = await axiosClient.get("/admin/contact-messages");
    return res.data;
  } catch {
    const store = getMockStore();
    return { success: true, data: store.contactMessages };
  }
};

// Mark message as read
export const markContactMessageRead = async (messageId) => {
  try {
    const res = await axiosClient.patch(`/admin/contact-messages/${messageId}/read`);
    return res.data;
  } catch {
    const store = getMockStore();
    const msg = store.contactMessages.find((m) => m._id === messageId);
    if (msg) {
      msg.isRead = true;
      saveMockStore(store);
    }
    return { success: true, message: "Message marked as read." };
  }
};
