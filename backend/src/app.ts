import express from "express";
import expressLayouts from "express-ejs-layouts";
import morgan from "morgan";
import path from "path";
import { httpLogger } from "./config/httpLogger";
import routes from "./routes";
import cookieParser from "cookie-parser";
import { prisma } from "./config/prisma";
import { Request, Response, NextFunction } from "express";
import favicon from "serve-favicon";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// ✅ Fix 1: Use Render's PORT env variable
const PORT = process.env.PORT || 5000;

const app = express();

// ✅ Fix 2: Allow both local and deployed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  process.env.FRONTEND_URL, // add your deployed frontend URL in Render env vars
  process.env.BACKEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src/views"));

app.use(expressLayouts);
app.set("layout", "layouts/main");

app.use(express.static(path.join(process.cwd(), "public")));
app.use(favicon(path.join(process.cwd(), "public/assets/media/logos/log.svg")));
app.use(morgan("dev"));
app.use(httpLogger);

app.use(
  "/users/payment/webhook/razorpay",
  express.raw({ type: "application/json" }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ✅ Fix 3: Redirect root URL to admin login
app.get("/", (req: Request, res: Response) => {
  res.redirect("/admin/auth/login");
});

app.use(`/users`, routes.app);
app.use(`/admin`, routes.admin);

(async () => {
  try {
    await prisma.$connect();
    console.log("----- Database connected successfully! -----");
  } catch (error) {
    console.error(`----- Database connection error: ${error} -----`);
  }
})();

// ── 404 handler ───────────────────────────────────────────
app.use((req: Request, res: Response) => {
  if (req.headers.accept?.includes("application/json")) {
    return res.status(404).json({ success: false, message: "Route not found" });
  }
  res.status(404).render("pages/404", { layout: false });
});

// ── Global error handler ──────────────────────────────────
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[ERROR] ${status} - ${message}`);
  return res.status(status).json({ success: false, message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;