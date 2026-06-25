const path = require("path");

const uploadRoot = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads");

const uploadPath = (...segments) => path.join(uploadRoot, ...segments);

module.exports = {
  uploadRoot,
  uploadPath,
};
