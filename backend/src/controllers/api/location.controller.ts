import { Request, Response } from "express";
import { getAllCountries, getStatesByCountry, getCitiesByState } from "../../services/api/location.service";
import ApiError from "../../utils/ApiError";
import { catchAsyncHandler, sendResponse } from "../../utils/asyncHandler";

export const getCountries = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const countries = await getAllCountries();
    return sendResponse(res, 200, "Countries fetched successfully", {
      count: countries.length,
      countries,
    });
  },
);

export const getStates = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const countryId = parseInt(req.params.countryId);
    if (isNaN(countryId)) throw new ApiError(400, "Invalid country ID");

    const states = await getStatesByCountry(countryId);
    return sendResponse(res, 200, "States fetched successfully", {
      count: states.length,
      states,
    });
  },
);

export const getCities = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const stateId = parseInt(req.params.stateId);
    if (isNaN(stateId)) throw new ApiError(400, "Invalid state ID");

    const cities = await getCitiesByState(stateId);
    return sendResponse(res, 200, "Cities fetched successfully", {
      count: cities.length,
      cities,
    });
  },
);