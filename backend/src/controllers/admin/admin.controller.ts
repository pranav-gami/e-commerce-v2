import { Request, Response } from "express";
import * as adminService from "../../services/admin/admin.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";
import ApiError from "../../utils/ApiError";
import userService from "../../services/api/user.service";

export const getLogin = (req: Request, res: Response) => {
  res.render("pages/auth/login", { title: "Admin Login", layout: false });
};

export const postLogin = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { data } = await adminService.adminLogin(req.body);
    res.cookie("token", data.token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    return sendResponse(res, 200, "Admin logged-in successfully", null);
  },
);

export const getDashboard = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    const stats = await adminService.getDashboardStats();
    res.render("pages/dashboard", {
      page: "dashboard",
      title: "Dashboard",
      admin,
      stats,
    });
  },
);

export const getUsersPage = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    res.render("pages/users", { page: "users", title: "Users", admin });
  },
);

export const getProfile = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) return res.redirect("/admin/auth/login");
    const admin = await adminService.getCurrentAdmin(req.user.id);
    res.render("pages/profile", { page: "profile", title: "Profile", admin });
  },
);

export const getEditAdmin = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    res.render("pages/edit-profile", {
      page: "edit-profile",
      title: "Edit Profile",
      admin,
    });
  },
);

export const getChangePassword = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const admin = await adminService.getCurrentAdmin(req.user?.id!);
    res.render("pages/change-password", {
      page: "change-password",
      title: "Change Password",
      admin,
    });
  },
);

export const postEditAdmin = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { name } = req.body;
    await adminService.updateAdminProfile(req.user?.id!, name);
    return sendResponse(res, 200, "Profile updated successfully", null);
  },
);

export const postChangePassword = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    await userService.changePassword(req.user?.id!, oldPassword, newPassword);
    return sendResponse(res, 200, "Password changed successfully", null);
  },
);

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token");
  res.redirect("/admin/auth/login");
};

export const getUserList = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const draw = Number(req.query.draw);
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = (req.query.search as any)?.value || "";
    const { users, total, filtered } = await adminService.getUserList({
      start,
      length,
      search,
    });
    return res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data: users,
    });
  },
);

export const getUserDetails = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const [user, admin] = await Promise.all([
      adminService.getUserById(id),
      adminService.getCurrentAdmin(req.user?.id!),
    ]);
    res.render("pages/user-details", {
      page: "user-details",
      title: "User Details",
      userDetails: user,
      admin,
    });
  },
);

export const deleteUser = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await adminService.deleteUser(id);
    return sendResponse(res, 200, "User deleted successfully", null);
  },
);

export const updateUser = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { name, phone, address, countryId, stateId, cityId, postalCode } =
      req.body;
    await adminService.updateUser(id, {
      name,
      phone,
      address,
      countryId: Number(countryId),
      stateId: Number(stateId),
      cityId: Number(cityId),
      postalCode, 
    });
    return sendResponse(res, 200, "User updated successfully", null);
  },
);

export const bulkDeleteUsers = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0)
      throw new ApiError(400, "No IDs provided");
    const numericIds = ids
      .map((id: any) => parseInt(id))
      .filter((id) => !isNaN(id));
    if (numericIds.length === 0)
      throw new ApiError(400, "Invalid IDs provided");
    await adminService.bulkDeleteUsers(numericIds);
    return sendResponse(
      res,
      200,
      `${numericIds.length} users deleted successfully`,
      null,
    );
  },
);
