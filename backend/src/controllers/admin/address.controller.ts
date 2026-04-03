import { Request, Response } from "express";
import adminAddressService from "../../services/admin/address.service";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

export const getAllAddresses = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;

    const data = await adminAddressService.getAll({ userId, page, limit, search });
    return sendResponse(res, 200, "Addresses fetched successfully", data);
  },
);

export const getAddressesByUser = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const data = await adminAddressService.getByUser(userId);
    return sendResponse(res, 200, "User addresses fetched successfully", data);
  },
);

export const adminUpdateAddress = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const addressId = Number(req.params.id);
    const { label, fullName, phone, address, postalCode, countryId, stateId, cityId, isDefault } =
      req.body;

    const updated = await adminAddressService.update(addressId, {
      label,
      fullName,
      phone,
      address,
      postalCode,
      countryId: countryId ? Number(countryId) : undefined,
      stateId: stateId ? Number(stateId) : undefined,
      cityId: cityId ? Number(cityId) : undefined,
      isDefault,
    });

    return sendResponse(res, 200, "Address updated by admin", { address: updated });
  },
);

export const adminDeleteAddress = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const addressId = Number(req.params.id);
    await adminAddressService.delete(addressId);
    return sendResponse(res, 200, "Address deleted by admin", null);
  },
);