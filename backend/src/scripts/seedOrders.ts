import { OrderStatus } from "@prisma/client";
import {prisma} from "../config/prisma";

async function main() {
    const ordersData = [
        {
            userId: 2,
            total: 120.5,
            status: OrderStatus.PENDING,
            addressId: 1,
            snapFullName: "John Doe",
            snapPhone: "1234567890",
            snapAddress: "123 Main St",
            snapPostalCode: "400001",
            snapCity: "Mumbai",
            snapState: "Maharashtra",
            snapCountry: "India",
            couponCode: undefined,
            couponDiscount: 0,
        },
        {
            userId: 3,
            total: 250.75,
            status: OrderStatus.DELIVERED,
            addressId: 1,
            snapFullName: "Jane Smith",
            snapPhone: "9876543210",
            snapAddress: "456 Market Rd",
            snapPostalCode: "110001",
            snapCity: "Delhi",
            snapState: "Delhi",
            snapCountry: "India",
            couponCode: "SAVE10",
            couponDiscount: 10,
        },
        {
            userId: 2,
            total: 99.99,
            status: OrderStatus.SHIPPED,
            addressId: 1,
            snapFullName: "John Doe",
            snapPhone: "1234567890",
            snapAddress: "123 Main St",
            snapPostalCode: "400001",
            snapCity: "Mumbai",
            snapState: "Maharashtra",
            snapCountry: "India",
            couponCode: undefined,
            couponDiscount: 0,
        },
    ];

    for (const order of ordersData) {
        await prisma.order.create({ data: order });
    }

    console.log(`✅ Seeded ${ordersData.length} dummy orders`);
}

main()
    .catch(console.error)
    .finally(async () => prisma.$disconnect());