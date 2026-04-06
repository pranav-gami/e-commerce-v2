import { Router } from "express";
import {
  getCountries,
  getStates,
  getCities,
} from "../../controllers/api/location.controller";

const router = Router();

router.get("/countries", getCountries);
router.get("/states/:countryId", getStates);
router.get("/cities/:stateId", getCities);

export default router;
