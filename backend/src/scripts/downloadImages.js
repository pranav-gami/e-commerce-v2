import {prisma} from "../../config/prisma";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products", "images");

// Make sure folder exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(UPLOAD_DIR, filename);

    // ✅ Skip only if file exists AND is valid (> 1KB)
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
      return resolve(`/uploads/products/images/${filename}`);
    }

    // Delete corrupted file if exists
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`🗑️  Deleted corrupted file: ${filename}`);
    }

    const client = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(filepath);

    client
      .get(url, (res) => {
        // ✅ Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(filepath);
          return downloadImage(res.headers.location, filename)
            .then(resolve)
            .catch(reject);
        }

        // ✅ Handle non-200 responses
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(filepath);
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }

        res.pipe(file);
        file.on("finish", () => {
          file.close();
          // ✅ Verify file is not empty after download
          const size = fs.statSync(filepath).size;
          if (size < 1000) {
            fs.unlinkSync(filepath);
            return reject(
              new Error(`Downloaded file too small (${size} bytes)`),
            );
          }
          resolve(`/uploads/products/images/${filename}`);
        });
      })
      .on("error", (err) => {
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        reject(err);
      });
  });
}

async function main() {
  // ✅ Fetch both: Amazon URLs + already downloaded but broken local files
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { image: { startsWith: "http" } }, // still Amazon URL
        { image: { startsWith: "/uploads/products/images/" } }, // already downloaded
      ],
    },
    select: { id: true, image: true, images: true },
  });

  console.log(`Found ${products.length} products to check`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    try {
      // ✅ If local path, check if file is broken
      if (product.image.startsWith("/uploads")) {
        const filename = path.basename(product.image);
        const filepath = path.join(UPLOAD_DIR, filename);
        const isHealthy =
          fs.existsSync(filepath) && fs.statSync(filepath).size > 1000;

        if (isHealthy) {
          skipped++;
          continue; // ✅ file is fine, skip
        }

        console.log(
          `🔧 Broken local file, need original URL for product ${product.id}`,
        );
        errors++;
        continue; // can't re-download without original URL
      }

      // ✅ Amazon URL — download it
      const filename = `product-${product.id}.jpg`; // always save as jpg

      await downloadImage(product.image, filename);

      await prisma.product.update({
        where: { id: product.id },
        data: {
          image: `/uploads/products/images/${filename}`,
          images: [`/uploads/products/images/${filename}`],
        },
      });

      updated++;
      if (updated % 50 === 0) console.log(`✅ Updated: ${updated}`);
    } catch (err) {
      errors++;
      console.error(`❌ Failed for product ${product.id}: ${err.message}`);
    }
  }

  console.log(`\n✅ Downloaded & updated : ${updated}`);
  console.log(`⏭️  Skipped (healthy)    : ${skipped}`);
  console.log(`❌ Errors               : ${errors}`);
}

main().finally(() => prisma.$disconnect());
