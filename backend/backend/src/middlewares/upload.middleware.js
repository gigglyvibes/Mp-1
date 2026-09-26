const multer = require("multer");
const ApiError = require("../utils/ApiError");

/**
 * Multer configured with in-memory storage; buffers are streamed to
 * Cloudinary by upload.service.js. Restricts to common image/PDF types.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const hasValidSignature = (file) => {
  const b = file.buffer;
  if (!b || b.length < 4) return false;
  if (file.mimetype === "application/pdf") return b.subarray(0, 4).toString("ascii") === "%PDF";
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (file.mimetype === "image/png") return b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (file.mimetype === "image/webp") return b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
};

const validatedFileFilter = (req, file, cb) => {
  fileFilter(req, file, (error, accepted) => {
    if (error || !accepted) return cb(error, accepted);
    if (!hasValidSignature(file)) {
      return cb(ApiError.badRequest("Uploaded file content does not match its file type."), false);
    }
    return cb(null, true);
  });
};

const upload = multer({
  storage,
  fileFilter: validatedFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});

module.exports = upload;
