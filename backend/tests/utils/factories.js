const Student = require("../../src/models/Student");
const Business = require("../../src/models/Business");
const Job = require("../../src/models/Job");
const { generateAccessToken } = require("../../src/utils/generateToken");
const { JOB_STATUS } = require("../../src/config/constants");

// Central spot on the map used as the default location for students/jobs
// so "nearby" style distance math has something sane to work with.
const MG_ROAD_BANGALORE = [77.6033, 12.9752];

let counter = 0;
const nextCounter = () => ++counter;

/** A syntactically valid, unique-enough 10-digit Indian mobile number. */
const nextPhone = () => {
  const n = nextCounter();
  return `9${String(100000000 + n).padStart(9, "0")}`;
};

const createStudent = async (overrides = {}) => {
  const n = nextCounter();
  return Student.create({
    email: overrides.email || `student${n}@test.com`,
    phone: overrides.phone || nextPhone(),
    password: overrides.password || "Password123",
    role: "student",
    name: overrides.name || `Test Student ${n}`,
    age: overrides.age ?? 21,
    gender: overrides.gender || "male",
    documents: { aadhaarCard: { url: "https://example.com/aadhaar.jpg" } },
    geoLocation: { type: "Point", coordinates: overrides.coordinates || MG_ROAD_BANGALORE },
    isEmailVerified: true,
    isPhoneVerified: true,
    verificationStatus: overrides.verificationStatus || "verified",
    isActive: overrides.isActive ?? true,
    isSuspended: overrides.isSuspended ?? false,
  });
};

const createBusiness = async (overrides = {}) => {
  const n = nextCounter();
  return Business.create({
    email: overrides.email || `business${n}@test.com`,
    phone: overrides.phone || nextPhone(),
    password: overrides.password || "Password123",
    role: "business",
    businessName: overrides.businessName || `Test Business ${n}`,
    ownerName: overrides.ownerName || "Owner Name",
    geoLocation: { type: "Point", coordinates: overrides.coordinates || MG_ROAD_BANGALORE },
    isEmailVerified: true,
    isPhoneVerified: true,
    verificationStatus: overrides.verificationStatus || "verified",
    isActive: overrides.isActive ?? true,
    isSuspended: overrides.isSuspended ?? false,
  });
};

/**
 * Creates a job that starts a few days in the future by default, so tests
 * exercising "before the job start date" rules don't need extra setup.
 * Pass `startDateTime` to test rules around/after the start date.
 */
const createJob = async (business, overrides = {}) => {
  const now = Date.now();
  const startDateTime = overrides.startDateTime || new Date(now + 3 * 24 * 60 * 60 * 1000);
  const endDateTime =
    overrides.endDateTime || new Date(startDateTime.getTime() + 4 * 60 * 60 * 1000);

  return Job.create({
    business: business._id,
    title: overrides.title || "Warehouse helper",
    category: overrides.category || "Labour",
    job: overrides.job || "Loading and unloading",
    description: overrides.description || "Help load and unload boxes at the warehouse.",
    address: overrides.address || "MG Road, Bangalore",
    geoLocation: { type: "Point", coordinates: overrides.coordinates || MG_ROAD_BANGALORE },
    price: overrides.price ?? 500,
    requiredStudents: overrides.requiredStudents ?? 1,
    acceptedStudentsCount: overrides.acceptedStudentsCount ?? 0,
    startDateTime,
    endDateTime,
    contactNumber: overrides.contactNumber || nextPhone(),
    status: overrides.status || JOB_STATUS.PUBLISHED,
  });
};

const tokenFor = (user) => generateAccessToken({ id: user._id, role: user.role });

const authHeader = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` });

module.exports = {
  createStudent,
  createBusiness,
  createJob,
  tokenFor,
  authHeader,
  MG_ROAD_BANGALORE,
};
