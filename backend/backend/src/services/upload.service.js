const cloudinary = require("../config/cloudinary");

/**
 * Uploads a buffer (from multer memoryStorage) to Cloudinary via an
 * upload stream, returning { url, publicId }.
 */
const uploadBufferToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `geo-micro-job/${folder}`, resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

const uploadMultiple = async (files, folder) => {
  const uploads = files.map((file) => uploadBufferToCloudinary(file.buffer, folder));
  return Promise.all(uploads);
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadBufferToCloudinary, uploadMultiple, deleteFromCloudinary };
