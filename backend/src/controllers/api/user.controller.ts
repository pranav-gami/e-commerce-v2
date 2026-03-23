import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import userService from "../../services/api/user.service";
import ApiError from "../../utils/ApiError";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

const register = catchAsyncHandler(async (req: Request, res: Response) => {
  const data = await userService.registerUser(req.body);
  return sendResponse(res, 201, "User registered successfully", data);
});

const sendSignupOtp = catchAsyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");
  const data = await userService.sendSignupOtp(email);
  return sendResponse(res, 200, "OTP sent successfully", data);
});

const verifySignupOtp = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    if (!email || !otp) throw new ApiError(400, "Email and OTP are required");
    const data = await userService.verifySignupOtp(email, otp);
    return sendResponse(res, 200, "Email verified successfully", data);
  },
);

const login = catchAsyncHandler(async (req: Request, res: Response) => {
  const data = await userService.loginUser(req.body);
  return sendResponse(res, 200, "User logged in successfully", data);
});

const getProfile = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "User not authenticated");
    const data = await userService.getProfile(req.user.id);
    return sendResponse(res, 200, "Profile fetched successfully", data);
  },
);

const updateProfile = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "User not authenticated");
    const data = await userService.updateProfile(req.user.id, req.body);
    return sendResponse(res, 200, "Profile updated successfully", data);
  },
);

const forgotPassword = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const data = await userService.forgotPassword(req.body.email);
    return sendResponse(res, 200, "OTP sent to email", data);
  },
);

const verifyOtp = catchAsyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const data = await userService.verifyOtp(email, otp);
  return sendResponse(res, 200, "OTP verified successfully", data);
});

const updatePassword = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    const data = await userService.updatePassword(email, otp, newPassword);
    return sendResponse(res, 200, "Password updated successfully", data);
  },
);

const resendOtp = catchAsyncHandler(async (req: Request, res: Response) => {
  const data = await userService.resendOtp(req.body.email);
  return sendResponse(res, 200, "OTP re-sent to email", data);
});

const changePassword = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    const { oldPassword, newPassword } = req.body;
    if (oldPassword === newPassword)
      throw new ApiError(
        400,
        "New password cannot be the same as the old password",
      );
    const data = await userService.changePassword(
      req.user.id,
      oldPassword,
      newPassword,
    );
    return sendResponse(res, 200, "Password changed successfully", data);
  },
);

const deleteAccount = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    const data = await userService.deleteAccount(req.user.id);
    return sendResponse(res, 200, "Account deleted successfully", data);
  },
);

const logout = catchAsyncHandler(async (req: Request, res: Response) => {
  return sendResponse(res, 200, "Logout successful", null);
});

export default {
  register,
  login,
  getProfile,
  updateProfile,
  sendSignupOtp,
  verifySignupOtp,
  forgotPassword,
  verifyOtp,
  updatePassword,
  resendOtp,
  changePassword,
  deleteAccount,
  logout,
};
