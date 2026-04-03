import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import addressService from "../../services/api/address.service";
import { addAddressSchema } from "../../validation/address.validation";
import ApiError from "../../utils/ApiError";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

export const getMyAddresses = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    const addresses = await addressService.getAll(req.user.id);
    return sendResponse(res, 200, "Addresses fetched successfully", {
      addresses,
    });
  },
);

export const getCheckoutAddresses = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    const data = await addressService.getCheckoutOptions(req.user.id);
    return sendResponse(res, 200, "Checkout addresses fetched successfully", data);
  },
);

export const addAddress = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");

    const { error, value } = addAddressSchema.validate(req.body);
    if (error) throw new ApiError(400, error.details[0].message);

    const address = await addressService.create(req.user.id, value);
    return sendResponse(res, 201, "Address added successfully", { address });
  },
);

export const updateAddress = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");

    const addressId = Number(req.params.id);
    const { label, fullName, phone, address, postalCode, countryId, stateId, cityId, isDefault } =
      req.body;

    const updated = await addressService.update(addressId, req.user.id, {
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

    return sendResponse(res, 200, "Address updated successfully", {
      address: updated,
    });
  },
);

export const deleteAddress = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");

    const addressId = Number(req.params.id);
    await addressService.delete(addressId, req.user.id);
    return sendResponse(res, 200, "Address deleted successfully", null);
  },
);

export const setDefaultAddress = catchAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");

    const addressId = Number(req.params.id);
    const address = await addressService.setDefault(addressId, req.user.id);
    return sendResponse(res, 200, "Default address updated", { address });
  },
);