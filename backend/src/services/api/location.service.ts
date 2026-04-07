import {prisma} from '../../config/prisma'; 

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
