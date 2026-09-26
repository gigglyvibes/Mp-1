const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const ContactMessage = require("../models/ContactMessage");
const { sendContactMessageEmail } = require("../services/email.service");

/**
 * @route POST /api/v1/contact
 * Public endpoint backing the Contact page form. Persists the message and
 * best-effort emails the support inbox; email delivery failure never
 * fails the request since the message is already saved.
 */
const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  const contactMessage = await ContactMessage.create({ name, email, message });

  const supportInbox = process.env.CONTACT_INBOX_EMAIL || process.env.EMAIL_FROM;
  if (supportInbox) {
    try {
      await sendContactMessageEmail(supportInbox, { name, email, message });
    } catch (err) {
      console.error("[Contact] Failed to email support inbox:", err.message);
    }
  }

  new ApiResponse(201, { id: contactMessage._id }, "Thanks — we'll get back to you within a day.").send(res);
});

/**
 * @route GET /api/v1/admin/contact-messages?page=&limit=&status=
 * Admin-only listing of submitted contact messages.
 */
const listContactMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) {
    throw ApiError.badRequest("page must be >= 1 and limit must be between 1 and 100.");
  }

  const filter = {};
  if (status) {
    if (!["new", "read"].includes(status)) throw ApiError.badRequest("status must be 'new' or 'read'.");
    filter.status = status;
  }

  const skip = (pageNumber - 1) * limitNumber;
  const [items, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
    ContactMessage.countDocuments(filter),
  ]);

  new ApiResponse(200, { items, total, page: pageNumber, limit: limitNumber }, "Contact messages fetched.").send(res);
});

/**
 * @route PATCH /api/v1/admin/contact-messages/:id/read
 */
const markContactMessageRead = asyncHandler(async (req, res) => {
  const contactMessage = await ContactMessage.findByIdAndUpdate(req.params.id, { status: "read" }, { new: true });
  if (!contactMessage) throw ApiError.notFound("Contact message not found.");
  new ApiResponse(200, contactMessage, "Contact message marked as read.").send(res);
});

module.exports = { submitContactMessage, listContactMessages, markContactMessageRead };
