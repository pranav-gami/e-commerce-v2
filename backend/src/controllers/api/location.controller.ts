// ============================================================
//  location.controller.ts
//  Note: getPostalCodes removed — postal codes now fetched
//        from postalpincode.in API on frontend (India)
//        or entered manually (other countries)
// ============================================================

import { Request, Response } from "express";
import {
  getAllCountries,
  getStatesByCountry,
  getCitiesByState,
} from "../../services/api/location.service";

// ── GET /users/location/countries ─────────────────────────
export const getCountries = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const countries = await getAllCountries();
    res
      .status(200)
      .json({ success: true, count: countries.length, data: countries });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch countries" });
  }
};

// ── GET /users/location/states/:countryId ──────────────────
export const getStates = async (req: Request, res: Response): Promise<void> => {
  try {
    const countryId = parseInt(req.params.countryId);
    if (isNaN(countryId)) {
      res.status(400).json({ success: false, message: "Invalid country ID" });
      return;
    }
    const states = await getStatesByCountry(countryId);
    res.status(200).json({ success: true, count: states.length, data: states });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch states" });
  }
};

// ── GET /users/location/cities/:stateId ───────────────────
export const getCities = async (req: Request, res: Response): Promise<void> => {
  try {
    const stateId = parseInt(req.params.stateId);
    if (isNaN(stateId)) {
      res.status(400).json({ success: false, message: "Invalid state ID" });
      return;
    }
    const cities = await getCitiesByState(stateId);
    res.status(200).json({ success: true, count: cities.length, data: cities });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch cities" });
  }
};
