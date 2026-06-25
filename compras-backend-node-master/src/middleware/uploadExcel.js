const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadPath } = require("../config/uploads");

const uploadDir = uploadPath();
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.includes("excel") ||
      file.originalname.endsWith(".xlsx")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Solo archivos Excel"));
    }
  }
});

module.exports = upload;
