import multer from "multer";
import path from "path";
import fs from "fs";

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const createStorage = (folder: string) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "../../uploads", folder);
      ensureDir(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  });

const imageFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const valid =
    allowed.test(path.extname(file.originalname).toLowerCase()) &&
    allowed.test(file.mimetype);
  valid ? cb(null, true) : cb(new Error("Only image files are allowed"));
};

export const categoryUpload = multer({
  storage: createStorage("categories"), //save to /upload/categories
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const productUpload = multer({
  storage: createStorage("products"), // saves to /uploads/products/
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
