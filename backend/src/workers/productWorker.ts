import { Worker } from "bullmq";
import { redisConnection } from "../config/queue";
import esClient from "../config/elasticsearch";
import prisma from "../config/prisma";

interface JobData {
  action: "upsert" | "delete";
  productId: number;
}

const worker = new Worker<JobData>(
  "product-sync",
  async (job) => {
    const { action, productId } = job.data;

    if (action === "delete") {
      await esClient.delete({
        index: "products",
        id: String(productId),
      });
      console.log(`✓ Deleted product ${productId} from Elasticsearch`);
      return;
    }

    // Fetch fresh product from DB with category names
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        subCategory: {
          include: { category: true },
        },
      },
    });

    if (!product) {
      console.warn(`⚠ Product ${productId} not found in DB, skipping.`);
      return;
    }

    await esClient.index({
      index: "products",
      id: String(product.id),
      document: {
        id: product.id,
        name: product.name,
        description: product.description ?? "",
        price: product.price,
        discount: product.discount ?? 0,
        stock: product.stock,
        isFeatured: product.isFeatured,
        status: product.status,
        subCategory: product.subCategory.name,
        category: product.subCategory.category.name,
        createdAt: product.createdAt,
        image: product.image ?? "",
        images: product.images ?? [],
        suggest: {
          input: [
            product.name,
            product.subCategory.name,
            product.subCategory.category.name,
          ],
        },
      },
    });

    console.log(`✓ Indexed product ${productId} (${product.name})`);
  },
  { connection: redisConnection },
);

worker.on("failed", (job, err) => {
  console.error(`✗ Job ${job?.id} failed:`, err.message);
});

worker.on("ready", () => {
  console.log("⚡ Product sync worker is running...");
});
