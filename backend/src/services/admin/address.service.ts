import prisma from "../../config/prisma";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface CreateAddressInput {
  label?: string;
  fullName: string;
  phone: string;
  address: string;
  postalCode: string;
  countryId: number;
  stateId: number;
  cityId: number;
  isDefault?: boolean;
}

export interface UpdateAddressInput extends Partial<CreateAddressInput> {}

const addressWithGeo = {
  country: { select: { id: true, name: true } },
  state: { select: { id: true, name: true } },
  city: { select: { id: true, name: true } },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function clearDefault(userId: number) {
  await prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });
}

async function promoteLatestAsDefault(userId: number, excludeId: number) {
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
}

async function isUsedInOrder(addressId: number): Promise<boolean> {
  const count = await prisma.order.count({ where: { addressId } });
  return count > 0;
}

// ─────────────────────────────────────────────
// USER — ADDRESS SERVICE
// ─────────────────────────────────────────────

export const addressService = {
  async getAll(userId: number) {
    return prisma.address.findMany({
      where: { userId },
      include: addressWithGeo,
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },

  async create(userId: number, data: CreateAddressInput) {
    const count = await prisma.address.count({ where: { userId } });
    const isFirst = count === 0;

    const shouldBeDefault = isFirst || data.isDefault === true;

    if (shouldBeDefault) await clearDefault(userId);

    return prisma.address.create({
      data: {
        userId,
        label: data.label,
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        postalCode: data.postalCode,
        countryId: data.countryId,
        stateId: data.stateId,
        cityId: data.cityId,
        isDefault: shouldBeDefault,
      },
      include: addressWithGeo,
    });
  },

  async update(id: number, userId: number, data: UpdateAddressInput) {
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) throw { status: 404, message: "Address not found" };
    if (existing.userId !== userId)
      throw { status: 403, message: "Not your address" };

    if (data.isDefault === true) await clearDefault(userId);

    return prisma.address.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: addressWithGeo,
    });
  },

  async delete(id: number, userId: number) {
    const existing = await prisma.address.findUnique({ where: { id } });

    if (!existing) throw { status: 404, message: "Address not found" };

    if (existing.userId !== userId)
      throw { status: 403, message: "Not your address" };

    const orders = await prisma.order.findMany({
      where: { addressId: id },
      select: {
        status: true,
        payment: { select: { status: true } },
      },
    });

    const hasActiveOrders = orders.some((order) => {
      const isCancelled = order.status === "CANCELLED";
      const isDelivered = order.status === "DELIVERED";
      const isRefunded = order.payment?.status === "REFUNDED";

      return !(isCancelled || isDelivered || isRefunded);
    });

    if (hasActiveOrders) {
      throw {
        status: 400,
        message:
          "Cannot delete address with active orders (pending/shipped etc.)",
      };
    }

    await prisma.address.delete({ where: { id } });

    if (existing.isDefault) {
      await promoteLatestAsDefault(userId, id);
    }
  },

  async setDefault(id: number, userId: number) {
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) throw { status: 404, message: "Address not found" };
    if (existing.userId !== userId)
      throw { status: 403, message: "Not your address" };

    await clearDefault(userId);
    return prisma.address.update({
      where: { id },
      data: { isDefault: true, updatedAt: new Date() },
      include: addressWithGeo,
    });
  },

  async getCheckoutOptions(userId: number) {
    const addresses = await prisma.address.findMany({
      where: { userId },
      include: addressWithGeo,
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    const defaultAddress =
      addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

    return { defaultAddressId: defaultAddress?.id ?? null, addresses };
  },
};

// ─────────────────────────────────────────────
// ADMIN — ADDRESS SERVICE
// ─────────────────────────────────────────────

export const adminAddressService = {
  async getAll(params: {
    userId?: number;
    page: number;
    limit: number;
    search?: string;
  }) {
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
  },

  async getByUser(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) throw { status: 404, message: "User not found" };

    const addresses = await prisma.address.findMany({
      where: { userId },
      include: addressWithGeo,
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return { user, addresses };
  },

  async update(id: number, data: UpdateAddressInput) {
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) throw { status: 404, message: "Address not found" };

    if (data.isDefault === true) await clearDefault(existing.userId);

    return prisma.address.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: addressWithGeo,
    });
  },

  async delete(id: number) {
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) throw { status: 404, message: "Address not found" };
    if (await isUsedInOrder(id))
      throw {
        status: 400,
        message: "Cannot delete an address that has been used in an order",
      };

    await prisma.address.delete({ where: { id } });

    if (existing.isDefault) await promoteLatestAsDefault(existing.userId, id);
  },
};
