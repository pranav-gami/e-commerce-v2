import bcrypt from "bcrypt";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import generateToken from "../../utils/generateToken";

export const adminLogin = async (data: any) => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "Admin does not exist");
  if (user.role !== "ADMIN") throw new ApiError(403, "Access denied");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ApiError(400, "Wrong Password");

  const token = generateToken(user);
  return { data: { user, token } };
};

export const getCurrentAdmin = async (userId: number) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      postalCode: true,
      country: {
        select: {
          id: true,
          name: true,
          isoCode: true,
          phoneCode: true,
          flag: true,
        },
      },
      state: { select: { id: true, name: true, isoCode: true } },
      city: { select: { id: true, name: true } },
    },
  });
};

export const getDashboardStats = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    newUsersThisMonth,
    totalAccounts,
    totalCategories,
    totalSubCategories,
    recentCategories,
    recentUsers,
    totalOrders,
    cancelledOrders,
    orderStatusCounts,
    recentOrders,
    successfulPayments,
    allCategories,
    totalProducts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({
      where: { role: "USER", createdAt: { gte: startOfMonth } },
    }),
    prisma.user.count(),
    prisma.category.count(),
    prisma.subCategory.count(),
    prisma.category.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { subCategories: true },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.payment.findMany({
      where: { status: "SUCCESS", createdAt: { gte: sevenDaysAgo } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.category.findMany({
      include: {
        subCategories: {
          include: {
            products: {
              include: { orderItems: { select: { quantity: true } } },
            },
          },
        },
      },
    }),
    prisma.product.count(),
  ]);

  const totalRevenue = successfulPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  const avgOrderValue =
    successfulPayments.length > 0
      ? Math.round(totalRevenue / successfulPayments.length)
      : 0;

  const statusMap: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };

  orderStatusCounts.forEach((s) => {
    statusMap[s.status] = s._count.status;
  });

  const revenueLabels: string[] = [];
  const revenueData: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    revenueLabels.push(d.toLocaleDateString("en-IN", { weekday: "short" }));
    const dayTotal = successfulPayments
      .filter((p) => {
        const pd = new Date(p.createdAt);
        return (
          pd.getDate() === d.getDate() &&
          pd.getMonth() === d.getMonth() &&
          pd.getFullYear() === d.getFullYear()
        );
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);
    revenueData.push(Math.round(dayTotal));
  }

  const topCategories = allCategories
    .map((cat) => {
      let sold = 0;
      cat.subCategories.forEach((sub) =>
        sub.products.forEach((prod) =>
          prod.orderItems.forEach((item) => (sold += item.quantity)),
        ),
      );
      return { name: cat.name, sold };
    })
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const recentOrdersFormatted = recentOrders.map((o) => ({
    id: o.id,
    userName: o.user?.name || "Unknown",
    status: o.status,
    total: Number((o as any).total ?? (o as any).amount ?? 0),
    createdAt: o.createdAt,
  }));

  return {
    totalUsers,
    newUsersThisMonth,
    totalAccounts,
    totalCategories,
    totalSubCategories,
    recentCategories,
    recentUsers,
    totalOrders,
    cancelledOrders,
    totalRevenue: Math.round(totalRevenue),
    avgOrderValue,
    totalProducts,
    orderStatus: statusMap,
    revenueChart: { labels: revenueLabels, data: revenueData },
    topCategories,
    recentOrdersFormatted,
  };
};

export const getUserById = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      role: true,
      createdAt: true,
      postalCode: true,
      country: {
        select: {
          id: true,
          name: true,
          isoCode: true,
          phoneCode: true,
          flag: true,
        },
      },
      state: { select: { id: true, name: true, isoCode: true } },
      city: { select: { id: true, name: true } },
    },
  });
};

export const updateAdminProfile = async (userId: number, data: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name ?? user.name,
      phone: data.phone ?? user.phone,
      address: data.address ?? user.address,
      postalCode: data.postalCode ?? user.postalCode,
      countryId: data.countryId ? Number(data.countryId) : user.countryId,
      stateId: data.stateId ? Number(data.stateId) : user.stateId,
      cityId: data.cityId ? Number(data.cityId) : user.cityId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      postalCode: true,
      country: {
        select: {
          id: true,
          name: true,
          isoCode: true,
          phoneCode: true,
          flag: true,
        },
      },
      state: { select: { id: true, name: true, isoCode: true } },
      city: { select: { id: true, name: true } },
    },
  });

  return updatedUser;
};

export const deleteUser = async (id: number) => {
  return await prisma.user.delete({ where: { id } });
};

export const getUserList = async ({
  start,
  length,
  search,
}: {
  start: number;
  length: number;
  search: string;
}) => {
  const where = search
    ? {
      role: "USER" as const,
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }
    : { role: "USER" as const };

  const [users, total, filtered] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: start,
      take: length,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
        postalCode: true,
        country: {
          select: { id: true, name: true, flag: true, phoneCode: true },
        },
        state: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
      },
    }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where }),
  ]);

  return { users, total, filtered };
};

export const updateUser = async (
  id: number,
  data: {
    name: string;
    phone: string;
    address: string;
    countryId: number;
    stateId: number;
    cityId: number;
    postalCode: string;
  },
) => {
  if (!data.name) throw new ApiError(400, "Name is required");
  if (!data.phone) throw new ApiError(400, "Phone is required");
  if (!data.address) throw new ApiError(400, "Address is required");
  if (!data.countryId) throw new ApiError(400, "Country is required");
  if (!data.stateId) throw new ApiError(400, "State is required");
  if (!data.cityId) throw new ApiError(400, "City is required");
  if (!data.postalCode) throw new ApiError(400, "Postal code is required");

  return await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      address: data.address,
      postalCode: data.postalCode,
      countryId: Number(data.countryId),
      stateId: Number(data.stateId),
      cityId: Number(data.cityId),
    },
  });
};

export const bulkDeleteUsers = async (ids: number[]) => {
  return prisma.user.deleteMany({ where: { id: { in: ids } } });
};
