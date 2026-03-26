import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createReadStream } from "fs";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// ─── ✅ Update these with real IDs once you have them ─────────────────────────
// For now using placeholder IDs — script will create fake users/orders if needed
const USER_IDS = [12, 13, 14, 15, 16];
const ORDER_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
  42, 43, 44, 45, 46, 47, 48, 49, 50,
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(raw) {
  const cleaned = (raw || "0").replace(/[₹,\s]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDiscount(raw) {
  const cleaned = (raw || "0").replace("%", "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseCategoryPath(raw) {
  const parts = (raw || "")
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    categoryName: parts[0] || "Uncategorized",
    subCategoryName: parts[parts.length - 1] || "General",
  };
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    let isFirstLine = true;
    const rl = readline.createInterface({
      input: createReadStream(filePath, { encoding: "utf-8" }),
      crlfDelay: Infinity,
    });
    rl.on("line", (line) => {
      if (isFirstLine) {
        isFirstLine = false;
        return;
      }
      if (line.trim()) rows.push(parseCSVLine(line));
    });
    rl.on("close", () => resolve(rows));
    rl.on("error", reject);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = path.join(__dirname, "public", "upload", "productData.csv");

  if (!fs.existsSync(csvPath)) {
    console.error("❌  File not found:", csvPath);
    process.exit(1);
  }

  console.log("📂  Reading CSV:", csvPath);
  const rows = await readCSV(csvPath);
  console.log(`📦  Found ${rows.length} rows\n`);

  const categoryCache = new Map();
  const subCategoryCache = new Map();

  // Track used (userId, productId, orderId) combos to avoid unique constraint errors
  const reviewCombos = new Set();

  let productsCreated = 0;
  let reviewsCreated = 0;
  let productErrors = 0;
  let reviewErrors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // CSV columns:
    // 0:name | 1:category | 2:price | 3:discount | 4:rating
    // 5:description | 6:title (comma-separated) | 7:body (comma-separated) | 8:image
    const name = (row[0] || "").trim();
    const categoryRaw = (row[1] || "").trim();
    const priceRaw = (row[2] || "0").trim();
    const discountRaw = (row[3] || "0").trim();
    const ratingRaw = (row[4] || "4").trim();
    const description = (row[5] || "").trim();
    const titlesRaw = (row[6] || "").trim();
    const bodiesRaw = (row[7] || "").trim();
    const image = (row[8] || "").trim();

    if (!name || !categoryRaw) continue;

    const price = parsePrice(priceRaw);
    const discount = parseDiscount(discountRaw);
    const baseRating = parseFloat(ratingRaw) || 4;
    const { categoryName, subCategoryName } = parseCategoryPath(categoryRaw);

    let productId;

    try {
      // 1. Upsert Category
      let category = categoryCache.get(categoryName);
      if (!category) {
        category = await prisma.category.upsert({
          where: { slug: slugify(categoryName) },
          update: {},
          create: { name: categoryName, slug: slugify(categoryName) },
        });
        categoryCache.set(categoryName, category);
      }

      // 2. Upsert SubCategory
      const subKey = `${category.id}:${subCategoryName}`;
      let subCategory = subCategoryCache.get(subKey);
      if (!subCategory) {
        subCategory = await prisma.subCategory.upsert({
          where: {
            name_categoryId: { name: subCategoryName, categoryId: category.id },
          },
          update: {},
          create: { name: subCategoryName, categoryId: category.id },
        });
        subCategoryCache.set(subKey, subCategory);
      }

      // 3. Upsert Product
      const product = await prisma.product.upsert({
        where: { slug }, // ← requires a @unique slug field on Product model
        update: {}, // ← don't overwrite existing data
        create: {
          name: name.substring(0, 500),
          slug,
          description: description || null,
          price,
          discount,
          stock: 50,
          image: image || "https://placehold.co/300x300?text=No+Image",
          images: image ? [image] : [],
          isFeatured: false,
          status: "ACTIVE",
          subCategoryId: subCategory.id,
        },
      });

      productId = product.id;
      productsCreated++;
      if (productsCreated % 100 === 0)
        console.log(`✅  Products: ${productsCreated}`);
    } catch (err) {
      productErrors++;
      console.error(`❌  Product row ${i + 2}: ${err.message.split("\n")[0]}`);
      continue; // skip reviews if product failed
    }

    // 4. Seed Reviews from title/body CSV columns
    // Each product has comma-separated titles and bodies — pair them up
    const titles = titlesRaw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && !t.startsWith("http"));
    const bodies = bodiesRaw
      .split(",")
      .map((b) => b.trim())
      .filter((b) => b && !b.startsWith("http"));
    const count = Math.min(titles.length, bodies.length, 4); // max 4 reviews per product

    for (let r = 0; r < count; r++) {
      const title = titles[r] || null;
      const body = bodies[r] || null;
      const rating = Math.min(
        5,
        Math.max(1, Math.round(baseRating + (Math.random() * 1 - 0.5))),
      );

      // Pick unique combo of userId + orderId for this product
      let userId, orderId, comboKey;
      let attempts = 0;
      do {
        userId = randomFrom(USER_IDS);
        orderId = randomFrom(ORDER_IDS);
        comboKey = `${userId}:${productId}:${orderId}`;
        attempts++;
      } while (reviewCombos.has(comboKey) && attempts < 20);

      if (reviewCombos.has(comboKey)) continue; // skip if no unique combo found
      reviewCombos.add(comboKey);

      try {
        await prisma.review.upsert({
          where: {
            userId_productId_orderId: { userId, productId, orderId }, // ← your unique constraint
          },
          update: { rating, title, body, verified: true, status: "PUBLISHED" },
          create: {
            userId,
            productId,
            orderId,
            rating,
            title,
            body,
            verified: true,
            status: "PUBLISHED",
          },
        });
        reviewsCreated++;
      } catch (err) {
        reviewErrors++;
      }
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`✅  Products created : ${productsCreated}`);
  console.log(`❌  Product errors   : ${productErrors}`);
  console.log(`⭐  Reviews created  : ${reviewsCreated}`);
  console.log(`❌  Review errors    : ${reviewErrors}`);
  console.log(`📁  Categories       : ${categoryCache.size}`);
  console.log(`📂  SubCategories    : ${subCategoryCache.size}`);
  console.log("─────────────────────────────────────────\n");
  console.log("💡  Once you have real userIds and orderIds,");
  console.log("    update USER_IDS and ORDER_IDS at the top of this file");
  console.log("    and re-run to get accurate review data.\n");
}

main()
  .catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
