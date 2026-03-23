import { Prisma } from "@prisma/client";
import { ErrorRequestHandler } from "express";
import ApiError from "../utils/ApiError";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error("Error:", err);

  let status = 500;
  let message = "Internal Server Error rgdth";

  // Custom ApiError
  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
  }

  // Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      status = 409;
      message = "A record with this value already exists";
    }
    if (err.code === "P2025") {
      status = 404;
      message = "Record not found";
    }
  }

  // Multer errors
  else if (err.code === "LIMIT_FILE_SIZE") {
    status = 400;
    message = "File too large. Maximum size is 5MB";
  } else if (err.message?.includes("Only image files")) {
    status = 400;
    message = "Invalid file type. Only jpeg, jpg, png, gif, webp allowed";
  }

  res.status(status).json({ success: false, message });
};
