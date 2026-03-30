import esClient from "../config/elasticsearch";
import prisma from "../config/prisma";

async function bulkSync() {
  console.log("Fetching all products from DB...");

  const products = await prisma.product.findMany({
    include: {
      subCategory: {
        include: { category: true },
      },
    },
  });

  if (products.length === 0) {
    console.log("No products found.");
    return;
  }

  const body = products.flatMap((p) => [
    { index: { _index: "products", _id: String(p.id) } },
    {
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      price: p.price,
      discount: p.discount ?? 0,
      stock: p.stock,
      isFeatured: p.isFeatured,
      status: p.status,
      subCategory: p.subCategory.name,
      category: p.subCategory.category.name,
      createdAt: p.createdAt,
      image: p.image ?? "",
      images: p.images ?? [],
      suggest: {
        input: [p.name, p.subCategory.name, p.subCategory.category.name],
      },
    },
  ]);
  const result = await esClient.bulk({ body });

  const failed = result.items.filter((i: any) => i.index?.error);
  console.log(
    `✓ Synced ${products.length - failed.length}/${products.length} products.`,
  );
  if (failed.length) console.error("✗ Failed items:", failed);
}

bulkSync().catch(console.error);
