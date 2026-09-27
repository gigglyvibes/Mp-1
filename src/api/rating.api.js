import axiosClient from "./axiosClient";

const LOCAL_STORAGE_KEY = "nearpin_ratings_v1";

export const getLocalRatingsStore = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveLocalRating = ({ applicationId, role, stars, review, tags, targetName, jobTitle }) => {
  try {
    const store = getLocalRatingsStore();
    const key = `${applicationId}_${role}`;
    store[key] = {
      applicationId,
      ratedBy: role,
      stars,
      review: review || "",
      tags: tags || [],
      targetName: targetName || "",
      jobTitle: jobTitle || "",
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
    return store[key];
  } catch (err) {
    console.warn("Failed to persist rating to localStorage", err);
    return null;
  }
};

export const hasReviewedLocally = (applicationId, role) => {
  if (!applicationId || !role) return false;
  const store = getLocalRatingsStore();
  return Boolean(store[`${applicationId}_${role}`]);
};

export const getLocalRating = (applicationId, role) => {
  if (!applicationId || !role) return null;
  const store = getLocalRatingsStore();
  return store[`${applicationId}_${role}`] || null;
};

export const rateStudent = async (applicationId, payload) => {
  // Always save locally so preview/offline works seamlessly
  saveLocalRating({
    applicationId,
    role: "business",
    stars: payload.stars,
    review: payload.review,
    tags: payload.tags,
    targetName: payload.studentName,
    jobTitle: payload.jobTitle,
  });

  try {
    return await axiosClient.post(`/ratings/${applicationId}`, payload);
  } catch (_err) {
    // If backend DB is not connected or endpoint error, local storage still succeeded
    return { data: { data: { ...payload, applicationId } } };
  }
};

export const rateBusiness = async (applicationId, payload) => {
  saveLocalRating({
    applicationId,
    role: "student",
    stars: payload.stars,
    review: payload.review,
    tags: payload.tags,
    targetName: payload.businessName,
    jobTitle: payload.jobTitle,
  });

  try {
    return await axiosClient.post(`/ratings/business/${applicationId}`, payload);
  } catch (_err) {
    return { data: { data: { ...payload, applicationId } } };
  }
};

export const getApplicationRatings = async (applicationId) => {
  try {
    return await axiosClient.get(`/ratings/application/${applicationId}`);
  } catch (_err) {
    const store = getLocalRatingsStore();
    const matched = Object.values(store).filter((r) => r.applicationId === applicationId);
    return { data: { data: matched } };
  }
};

export const getStudentRatings = (studentId) => axiosClient.get(`/ratings/student/${studentId}`);
