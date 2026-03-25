import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { addressService } from "../../services/admin/address.service";
import { addAddressSchema } from "../../validation/address.validation";

// ─────────────────────────────────────────────
// GET /user/addresses
// ─────────────────────────────────────────────
export const getMyAddresses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const addresses = await addressService.getAll(userId);
    res.status(200).json({ success: true, addresses });
  } catch (err: any) {
    res
      .status(err.status ?? 500)
      .json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /user/addresses/checkout
// ─────────────────────────────────────────────
export const getCheckoutAddresses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = await addressService.getCheckoutOptions(userId);
    res.status(200).json({ success: true, ...data });
  } catch (err: any) {
    res
      .status(err.status ?? 500)
      .json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /user/addresses
// ─────────────────────────────────────────────

export const addAddress = async (req: AuthRequest, res: Response) => {
  try {
    console.log(req.body);

    const userId = req.user!.id;

    const { error, value } = addAddressSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const created = await addressService.create(userId, value);

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: created,
    });
  } catch (err: any) {
    res
      .status(err.status ?? 500)
      .json({ success: false, message: err.message });
  }
};
// ─────────────────────────────────────────────
// PUT /user/addresses/:id
// ─────────────────────────────────────────────
export const updateAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const addressId = Number(req.params.id);
    const {
      label,
      fullName,
      phone,
      address,
      postalCode,
      countryId,
      stateId,
      cityId,
      isDefault,
    } = req.body;

    const updated = await addressService.update(addressId, userId, {
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

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: updated,
    });
  } catch (err: any) {
    res
      .status(err.status ?? 500)
      .json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /user/addresses/:id
// ─────────────────────────────────────────────
export const deleteAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const addressId = Number(req.params.id);

    await addressService.delete(addressId, userId);
    res
      .status(200)
      .json({ success: true, message: "Address deleted successfully" });
  } catch (err: any) {
    res
      .status(err.status ?? 500)
      .json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// PATCH /user/addresses/:id/set-default
// ─────────────────────────────────────────────
export const setDefaultAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const addressId = Number(req.params.id);

    const updated = await addressService.setDefault(addressId, userId);
    res.status(200).json({
      success: true,
      message: "Default address updated",
      address: updated,
    });
  } catch (err: any) {
    res
      .status(err.status ?? 500)
      .json({ success: false, message: err.message });
  }
};
