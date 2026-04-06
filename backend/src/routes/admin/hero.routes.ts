// src/routes/admin/hero.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import * as heroController from "../../controllers/admin/hero.controller";
import { isAdmin } from "../../middleware/auth.middleware";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";

const router = Router();

const heroStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads/hero");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const heroUpload = multer({
  storage: heroStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error("Only images are allowed (jpeg, jpg, png, webp)"));
  },
});

const handleHeroUpload = (req: Request, res: Response, next: NextFunction) => {
  heroUpload.single("image")(req, res, (err: any) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

router.get("/", heroController.getHeroPage);
router.get("/list", heroController.getSlideList);
router.post("/", isAdmin, handleHeroUpload, heroController.createSlide);
router.put("/:id", isAdmin, handleHeroUpload, heroController.updateSlide);
router.delete("/:id", isAdmin, heroController.deleteSlide);
router.patch("/:id/toggle", isAdmin, heroController.toggleSlide);
router.post("/reorder", isAdmin, heroController.reorderSlides);

export default router;
