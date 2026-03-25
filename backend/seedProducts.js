import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
console.log("Initializing seeding...", process.cwd());

const filePath = path.join(process.cwd(), "public/upload/productData.csv");

const rows = [];

const SUBCATEGORY_MAP = {
  mobiles: 23,
  cameras: 24,
  tvs: 25,
  audio: 26,
  "women's bags": 27,
  perfumes: 28,
  skincare: 29,
};

function getSubCategoryId(name) {
  return SUBCATEGORY_MAP[name?.trim().toLowerCase()] || null;
}

// 🔥 batch helper
async function chunkInsert(data, size, fn) {
  for (let i = 0; i < data.length; i += size) {
    const chunk = data.slice(i, i + size);
    await fn(chunk);
  }
}

async function main() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => rows.push(data))
      .on("end", async () => {
        try {
          const productsToInsert = [];
          const reviewsToInsert = [];

          for (const row of rows) {
            const {
              name,
              description,
              price,
              image,
              category,
              rating,
              title,
              body,
            } = row;

            if (!name || !price || !category) continue;

            const subCategoryId = getSubCategoryId(category);
            if (!subCategoryId) continue;

            productsToInsert.push({
              name,
              description: description || null,
              price: Number(price),
              stock: 100,
              image: image || "/placeholder.png",
              images: image ? [image] : [],
              subCategoryId,
              discount: 0,
              isFeatured: false,
              status: "ACTIVE",
            });
          }

          console.log(`📦 Products to insert: ${productsToInsert.length}`);

          // ─────────────────────────────
          // 1. BULK INSERT PRODUCTS
          // ─────────────────────────────
          await chunkInsert(productsToInsert, 100, async (chunk) => {
            await prisma.product.createMany({
              data: chunk,
              skipDuplicates: true,
            });
          });

          console.log("✅ Products inserted");

          // ─────────────────────────────
          // 2. FETCH INSERTED PRODUCTS (for review mapping)
          // ─────────────────────────────
          const insertedProducts = await prisma.product.findMany({
            where: {
              name: {
                in: productsToInsert.map((p) => p.name),
              },
            },
            select: { id: true, name: true },
          });

          const productMap = {};
          insertedProducts.forEach((p) => {
            productMap[p.name] = p.id;
          });

          // ─────────────────────────────
          // 3. PREPARE REVIEWS
          // ─────────────────────────────
          for (const row of rows) {
            const { name, rating, title, body } = row;

            if (!rating || !productMap[name]) continue;

            reviewsToInsert.push({
              userId: 16,
              orderId: 47,
              productId: productMap[name],
              rating: Number(rating),
              title: title || null,
              body: body || null,
              verified: false,
            });
          }

          console.log(`📝 Reviews to insert: ${reviewsToInsert.length}`);

          // ─────────────────────────────
          // 4. BULK INSERT REVIEWS
          // ─────────────────────────────
          await chunkInsert(reviewsToInsert, 100, async (chunk) => {
            await prisma.review.createMany({
              data: chunk,
              skipDuplicates: true,
            });
          });

          console.log("🎉 Seeding completed!");
          resolve();
        } catch (err) {
          console.error("❌ Error:", err);
          reject(err);
        } finally {
          await prisma.$disconnect();
        }
      });
  });
}

main();
