// src/routes/api/hero.routes.ts
// Public route — returns active slides for the frontend homepage

import { Router } from "express";
import { getActiveSlides } from "../../controllers/admin/hero.controller";

const router = Router();

// GET /users/hero — no auth required
router.get("/", getActiveSlides);

export default router;
