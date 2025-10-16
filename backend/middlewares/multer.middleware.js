import multer from "multer";
import path from "path";

const uploadPath =
  process.env.NODE_ENV === "production" ? "/tmp" : "./public/temp";

// Multer Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// file filter for multer
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
});
