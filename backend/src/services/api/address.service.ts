import {prisma} from "../../config/prisma";
import ApiError from "../../utils/ApiError";

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

export interface UpdateAddressInput extends Partial<CreateAddressInput> { }


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


const getAll = async (userId: number) => {
    return prisma.address.findMany({
        where: { userId },
        include: addressWithGeo,
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
};

const getCheckoutOptions = async (userId: number) => {
    const addresses = await prisma.address.findMany({
        where: { userId },
        include: addressWithGeo,
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    const defaultAddress =
        addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

    return { defaultAddressId: defaultAddress?.id ?? null, addresses };
};

const create = async (userId: number, data: CreateAddressInput) => {
    const count = await prisma.address.count({ where: { userId } });
    const shouldBeDefault = count === 0 || data.isDefault === true;

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
};

const update = async (
    id: number,
    userId: number,
    data: UpdateAddressInput,
) => {
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Address not found");
    if (existing.userId !== userId) throw new ApiError(403, "Not your address");

    if (data.isDefault === true) await clearDefault(userId);

    return prisma.address.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
        include: addressWithGeo,
    });
};

const deleteAddress = async (id: number, userId: number) => {
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Address not found");
    if (existing.userId !== userId) throw new ApiError(403, "Not your address");

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
        throw new ApiError(
            400,
            "Cannot delete address with active orders (pending/shipped etc.)",
        );
    }

    await prisma.address.delete({ where: { id } });

    if (existing.isDefault) {
        await promoteLatestAsDefault(userId, id);
    }
};

const setDefault = async (id: number, userId: number) => {
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Address not found");
    if (existing.userId !== userId) throw new ApiError(403, "Not your address");

    await clearDefault(userId);

    return prisma.address.update({
        where: { id },
        data: { isDefault: true, updatedAt: new Date() },
        include: addressWithGeo,
    });
};

export default {
    getAll,
    getCheckoutOptions,
    create,
    update,
    delete: deleteAddress,
    setDefault,
};