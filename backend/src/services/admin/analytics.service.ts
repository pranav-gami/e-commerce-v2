import prisma from "../../config/prisma";

//  Helper: get the "start date" based on the range query param
function getStartDate(range: string): Date {
  const now = new Date();
  if (range === "30d") return new Date(now.setDate(now.getDate() - 30));
  if (range === "90d") return new Date(now.setDate(now.getDate() - 90));
  // default: 7d
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

//  Main analytics function 
export const getAnalyticsData = async (range: string = "7d") => {
  const startDate = getStartDate(range);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    newUsersThisMonth,
    totalOrders,
    cancelledOrders,
    orderStatusCounts,
    recentOrders,
    allPayments,
    allCategories,
    allProducts,
  ] = await Promise.all([
    // 1. Total users
    prisma.user.count({ where: { role: "USER" } }),

    // 2. New users this month
    prisma.user.count({
      where: { role: "USER", createdAt: { gte: startOfMonth } },
    }),

    // 3. Total orders
    prisma.order.count(),

    // 4. Cancelled orders
    prisma.order.count({ where: { status: "CANCELLED" } }),

    // 5. Orders grouped by status (for the doughnut chart)
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // 6. Last 6 recent orders with user info
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),

    // 7. All successful payments (for revenue chart)
    prisma.payment.findMany({
      where: {
        status: "SUCCESS",
        createdAt: { gte: startDate },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    // 8. Top categories with their products' order items
    prisma.category.findMany({
      include: {
        subCategories: {
          include: {
            products: {
              include: {
                orderItems: { select: { quantity: true } },
              },
            },
          },
        },
      },
    }),

    // 9. Products count
    prisma.product.count(),
  ]);

  //Calculate total revenue
  const totalRevenue = allPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  // Group payments by day (for 7d) or by week (for 30d/90d)
  const revenueChartData = buildRevenueChart(allPayments, range, startDate);

  //Build order status data for doughnut chart 
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

  //Build top categories by total items sold
  const categoryData = allCategories
    .map((cat) => {
      let totalSold = 0;
      cat.subCategories.forEach((sub) => {
        sub.products.forEach((product) => {
          product.orderItems.forEach((item) => {
            totalSold += item.quantity;
          });
        });
      });
      return { name: cat.name, sold: totalSold };
    })
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  //Average order value
  const avgOrderValue =
    allPayments.length > 0 ? Math.round(totalRevenue / allPayments.length) : 0;

  return {
    totalRevenue: Math.round(totalRevenue),
    totalOrders,
    totalUsers,
    cancelledOrders,
    newUsersThisMonth,
    avgOrderValue,
    totalProducts: allProducts,
    revenueChart: revenueChartData,
    orderStatus: statusMap,
    topCategories: categoryData,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      userName: o.user?.name || "Unknown",
      userEmail: o.user?.email || "",
      status: o.status,
      total: Number(o.total),
      createdAt: o.createdAt,
    })),
  };
};

//  Builds { labels, data } for the revenue line chart
function buildRevenueChart(
  payments: { amount: any; createdAt: Date }[],
  range: string,
  startDate: Date,
) {
  const labels: string[] = [];
  const data: number[] = [];

  if (range === "7d") {
    // Last 7 days, one point per day
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-IN", { weekday: "short" });
      labels.push(label);

      const dayRevenue = payments
        .filter((p) => {
          const pd = new Date(p.createdAt);
          return (
            pd.getDate() === d.getDate() &&
            pd.getMonth() === d.getMonth() &&
            pd.getFullYear() === d.getFullYear()
          );
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      data.push(Math.round(dayRevenue));
    }
  } else if (range === "30d") {
    // Last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7 - 6);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      labels.push(`Wk ${4 - i}`);

      const weekRevenue = payments
        .filter((p) => {
          const pd = new Date(p.createdAt);
          return pd >= weekStart && pd <= weekEnd;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      data.push(Math.round(weekRevenue));
    }
  } else {
    // 90d → last 3 months
    for (let i = 2; i >= 0; i--) {
      const d = new Date();
      const monthDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      labels.push(monthDate.toLocaleDateString("en-IN", { month: "short" }));

      const monthRevenue = payments
        .filter((p) => {
          const pd = new Date(p.createdAt);
          return (
            pd.getMonth() === monthDate.getMonth() &&
            pd.getFullYear() === monthDate.getFullYear()
          );
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      data.push(Math.round(monthRevenue));
    }
  }

  return { labels, data };
}
