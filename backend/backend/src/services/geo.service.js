const User = require("../models/User");
const { USER_ROLES, DEFAULT_SEARCH_RADIUS_KM } = require("../config/constants");

/**
 * Finds verified, active students within `radiusKm` of the given
 * [longitude, latitude] point using MongoDB's $near / 2dsphere index.
 * Optionally filters by gender preference.
 */
const findNearbyStudents = async ({ coordinates, radiusKm = DEFAULT_SEARCH_RADIUS_KM, genderPreference }) => {
  const query = {
    role: USER_ROLES.STUDENT,
    verificationStatus: "verified",
    isActive: true,
    isSuspended: false,
    geoLocation: {
      $near: {
        $geometry: { type: "Point", coordinates },
        $maxDistance: radiusKm * 1000, // meters
      },
    },
  };

  if (genderPreference && genderPreference !== "any") {
    query.gender = genderPreference;
  }

  return User.find(query).select("-password -refreshToken");
};

/**
 * Finds jobs near a student's location, e.g. for the "Nearby Jobs" feed.
 */
const findNearbyJobs = async ({ coordinates, radiusKm = DEFAULT_SEARCH_RADIUS_KM, extraMatch = {} }) => {
  const Job = require("../models/Job");
  return Job.find({
    ...extraMatch,
    geoLocation: {
      $near: {
        $geometry: { type: "Point", coordinates },
        $maxDistance: radiusKm * 1000,
      },
    },
  }).populate("business", "businessName ownerName profilePicture");
};

module.exports = { findNearbyStudents, findNearbyJobs };
