// ============================================================
//  location.service.ts
//  All DB queries for location data
//  Note: PostalCode model removed — postal codes now stored
//        as plain strings on User model
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Get all countries ──────────────────────────────────────
export const getAllCountries = async () => {
  return await prisma.country.findMany({
    select: {
      id: true,
      name: true,
      isoCode: true,
      phoneCode: true,
      flag: true,
      currency: true,
    },
    orderBy: { name: "asc" },
  });
};

// ── Get states by country ID ───────────────────────────────
export const getStatesByCountry = async (countryId: number) => {
  return await prisma.state.findMany({
    where: { countryId },
    select: {
      id: true,
      name: true,
      isoCode: true,
    },
    orderBy: { name: "asc" },
  });
};

// ── Get cities by state ID ─────────────────────────────────
export const getCitiesByState = async (stateId: number) => {
  return await prisma.city.findMany({
    where: { stateId },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });
};

// ── Postal codes are no longer in DB ──────────────────────
// For India: fetched live from postalpincode.in API on frontend
// For other countries: user types manually
// ──────────────────────────────────────────────────────────
