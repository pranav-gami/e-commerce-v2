import { Request, Response } from "express";
import { adminAddressService } from "../../services/admin/address.service";

export const getAllAddresses = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;

    const data = await adminAddressService.getAll({
      userId,
      page,
      limit,
      search,
    });
    res.status(200).json({ success: true, ...data });
  } catch (err: any) {
    res
      .status(err.status ?? 500)
      .json({ success: false, message: err.message });
  }
};

export const getAddressesByUser = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const data = await adminAddressService.getByUser(userId);
    res.status(200).json({ success: true, ...data });
  } catch (err: any) {
    res
      .status(err.status ?? 500)
      .json({ success: false, message: err.message });
  }
};

export const adminUpdateAddress = async (req: Request, res: Response) => {
  try {
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

    res.status(200).json({
      success: true,
      message: "Address updated by admin",
      address: updated,
    });
  } catch (err: any) {
    res
      .status(err.status ?? 500)
      .json({ success: false, message: err.message });
  }
};

export const adminDeleteAddress = async (req: Request, res: Response) => {
  try {
    const addressId = Number(req.params.id);
    await adminAddressService.delete(addressId);
    res
      .status(200)
      .json({ success: true, message: "Address deleted by admin" });
  } catch (err: any) {
    res
      .status(err.status ?? 500)
      .json({ success: false, message: err.message });
  }
};
