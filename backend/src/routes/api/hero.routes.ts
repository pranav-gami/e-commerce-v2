import { Router } from "express";
import { getActiveSlides } from "../../controllers/admin/hero.controller";

const router = Router();

router.get("/", getActiveSlides);

export default router;
