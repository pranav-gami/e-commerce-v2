// src/routes/api/location.routes.ts
import { Router } from "express";
import {
  getCountries,
  getStates,
  getCities,
} from "../../controllers/api/location.controller";

const router = Router();

// GET /users/location/countries
router.get("/countries", getCountries);

// GET /users/location/states/:countryId
router.get("/states/:countryId", getStates);

// GET /users/location/cities/:stateId
router.get("/cities/:stateId", getCities);

// ✅ Postal codes route removed
// India: fetched from postalpincode.in on frontend
// Other countries: manual text input

export default router;
