import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products", "images");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── Fetch HTML from URL ──────────────────────────────────
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const options = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    };

    const req = client.get(url, options, (res) => {
      // follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchHtml(res.headers.location).then(resolve).catch(reject);
      }

      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

// ─── Search Bing Images and return first image URL ────────
async function searchBingImage(productName) {
  // Use first 6 words of product name for better results
  const shortName = productName.split(" ").slice(0, 6).join(" ");
  const query = encodeURIComponent(shortName);
  const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`;

  const html = await fetchHtml(url);

  // Extract image URLs from Bing results
  // Bing stores image URLs in murl attribute
  const murlMatches =
    html.match(/murl&quot;:&quot;(https?[^&]+?)&quot;/g) || [];
  const imgMatches = html.match(/"murl":"(https?[^"]+?)"/g) || [];

  const allMatches = [...murlMatches, ...imgMatches];

  for (const match of allMatches) {
    const urlMatch = match.match(/(https?:\/\/[^"&]+)/);
    if (!urlMatch) continue;

    const imgUrl = decodeURIComponent(urlMatch[1]);

    // Skip Amazon, small icons, SVGs, base64
    if (
      imgUrl.includes("amazon.com") ||
      imgUrl.includes("amazon.in") ||
      imgUrl.includes(".svg") ||
      imgUrl.includes("data:") ||
      imgUrl.includes("icon") ||
      imgUrl.length < 20
    )
      continue;

    // Only allow common image formats
    if (
      imgUrl.match(/\.(jpg|jpeg|png|webp)(\?|$)/i) ||
      imgUrl.includes("image") ||
      imgUrl.includes("img") ||
      imgUrl.includes("photo")
    ) {
      return imgUrl;
    }
  }

  return null;
}

// ─── Download image from URL ──────────────────────────────
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(UPLOAD_DIR, filename);
    const client = url.startsWith("https") ? https : http;

    const options = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.bing.com/",
      },
    };

    const file = fs.createWriteStream(filepath);

    const req = client.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        return downloadImage(res.headers.location, filename)
          .then(resolve)
          .catch(reject);
      }

      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      res.pipe(file);
      file.on("finish", () => {
        file.close();
        const size = fs.statSync(filepath).size;
        if (size < 1000) {
          fs.unlinkSync(filepath);
          return reject(new Error(`File too small (${size} bytes)`));
        }
        resolve();
      });
    });

    req.on("error", (err) => {
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      reject(err);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      reject(new Error("Timeout"));
    });
  });
}

// ─── Sleep helper to avoid rate limiting ─────────────────
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ─── Main ─────────────────────────────────────────────────
async function main() {
  // Get all broken products
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { image: { startsWith: "http" } }, // still has Amazon URL
        { image: "https://placehold.co/300x300?text=No+Image" }, // placeholder
        { image: { startsWith: "/uploads/products/images/" } }, // local but maybe broken
      ],
    },
    select: { id: true, name: true, image: true },
  });

  // Filter only broken/placeholder ones
  const toFix = products.filter((p) => {
    if (p.image.startsWith("http")) return true; // Amazon or placeholder
    const filepath = path.join(UPLOAD_DIR, path.basename(p.image));
    return !fs.existsSync(filepath) || fs.statSync(filepath).size < 1000;
  });

  console.log(`🔧 Found ${toFix.length} products to fix\n`);

  let fixed = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < toFix.length; i++) {
    const product = toFix[i];

    try {
      console.log(
        `[${i + 1}/${toFix.length}] Searching: "${product.name.substring(0, 50)}..."`,
      );

      // Search Bing for image
      const imageUrl = await searchBingImage(product.name);

      if (!imageUrl) {
        console.warn(`⚠️  No image found for product ${product.id}`);
        notFound++;
        continue;
      }

      const filename = `product-${product.id}.jpg`;
      await downloadImage(imageUrl, filename);

      await prisma.product.update({
        where: { id: product.id },
        data: {
          image: `/uploads/products/images/${filename}`,
          images: [`/uploads/products/images/${filename}`],
        },
      });

      fixed++;
      console.log(`✅ Fixed product ${product.id}`);

      // Wait 1 second between requests to avoid Bing rate limiting
      await sleep(1000);
    } catch (err) {
      errors++;
      console.error(`❌ Failed product ${product.id}: ${err.message}`);
      await sleep(2000); // wait longer after errors
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`✅ Fixed        : ${fixed}`);
  console.log(`⚠️  Not found   : ${notFound}`);
  console.log(`❌ Errors       : ${errors}`);
  console.log("─────────────────────────────────────────\n");
}

main().finally(() => prisma.$disconnect());
