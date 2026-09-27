const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const Category = require("../models/Category");
const Job = require("../models/Job");
const jobRepository = require("../repositories/job.repository");
const { JOB_STATUS } = require("../config/constants");

/**
 * @route GET /api/v1/categories/jobs
 * Returns currently available public jobs grouped by category.
 */
router.get(
  "/jobs",
  asyncHandler(async (req, res) => {
    await jobRepository.expireOverdueJobs();

    const [categories, jobs] = await Promise.all([
      Category.find({ isActive: true }).sort({ category: 1 }).lean(),
      Job.find({ status: JOB_STATUS.PUBLISHED })
        .sort({ createdAt: -1 })
        .populate("business", "businessName")
        .lean(),
    ]);

    const grouped = categories.map((category) => ({
      category: category.category,
      slug: category.slug,
      icon: category.icon || "",
      jobs: jobs.filter((job) => job.category === category.category),
    }));

    // Keep any job whose category is not yet present in the Category collection.
    const known = new Set(categories.map((category) => category.category));
    const extra = jobs
      .filter((job) => !known.has(job.category))
      .reduce((acc, job) => {
        let group = acc.find((item) => item.category === job.category);
        if (!group) {
          group = { category: job.category, slug: job.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"), icon: "•", jobs: [] };
          acc.push(group);
        }
        group.jobs.push(job);
        return acc;
      }, []);

    new ApiResponse(200, [...grouped, ...extra], "Category-wise jobs fetched successfully.").send(res);
  })
);

/**
 * @route GET /api/v1/categories
 * Powers the Category dropdown; each category includes its dependent Job list.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true }).sort({ category: 1 });
    new ApiResponse(200, categories, "Categories fetched successfully.").send(res);
  })
);

module.exports = router;
