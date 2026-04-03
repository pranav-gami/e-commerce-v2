import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";

export interface UpdateAddressInput {
  label?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  isDefault?: boolean;
}

//Helper 
const addressWithGeo = {
  country: { select: { id: true, name: true } },
  state: { select: { id: true, name: true } },
  city: { select: { id: true, name: true } },
};

const clearDefault = async (userId: number) => {
  await prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });
};

const promoteLatestAsDefault = async (userId: number, excludeId: number) => {
  const next = await prisma.address.findFirst({
    where: { userId, id: { not: excludeId } },
    orderBy: { createdAt: "desc" },
  });
  if (next) {
    await prisma.address.update({
      where: { id: next.id },
      data: { isDefault: true },
    });
  }
};

const isUsedInOrder = async (addressId: number): Promise<boolean> => {
  const count = await prisma.order.count({ where: { addressId } });
  return count > 0;
};

//user address services
const getAll = async (params: {
  userId?: number;
  page: number;
  limit: number;
  search?: string;
}) => {
  const { userId, page, limit, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (userId) where.userId = userId;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { label: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, addresses] = await Promise.all([
    prisma.address.count({ where }),
    prisma.address.findMany({
      where,
      skip,
      take: limit,
      include: {
        ...addressWithGeo,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { total, page, limit, addresses };
};

// GET ALL ADDRESSES FOR A SPECIFIC USER

const getByUser = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) throw new ApiError(404, "User not found");

  const addresses = await prisma.address.findMany({
    where: { userId },
    include: addressWithGeo,
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return { user, addresses };
};

// UPDATE ADDRESS

const update = async (id: number, data: UpdateAddressInput) => {
  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Address not found");

  if (data.isDefault === true) await clearDefault(existing.userId);

  return prisma.address.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
    include: addressWithGeo,
  });
};

// DELETE ADDRESS

const deleteAddress = async (id: number) => {
  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Address not found");

  if (await isUsedInOrder(id)) {
    throw new ApiError(
      400,
      "Cannot delete an address that has been used in an order",
    );
  }

  await prisma.address.delete({ where: { id } });

  if (existing.isDefault) {
    await promoteLatestAsDefault(existing.userId, id);
  }
};

export default {
  getAll,
  getByUser,
  update,
  delete: deleteAddress,
};