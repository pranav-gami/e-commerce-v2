import esClient from "../config/elasticsearch";
import {prisma} from "../config/prisma";

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

  // Create index with mapping if it doesn't exist
  try {
    await esClient.indices.create({
      index: "products",
      body: {
        mappings: {
          properties: {
            id: { type: "integer" },
            name: { type: "text", analyzer: "standard" },
            description: { type: "text", analyzer: "standard" },
            price: { type: "float" },
            discount: { type: "float" },
            stock: { type: "integer" },
            isFeatured: { type: "boolean" },
            status: { type: "keyword" },
            subCategory: { type: "keyword" },
            category: { type: "keyword" },
            createdAt: { type: "date" },
            image: { type: "text" },
            suggest: {
              type: "completion",
              analyzer: "simple",
              search_analyzer: "simple",
            },
          },
        },
      },
    });
    console.log("Index 'products' created with mapping.");
  } catch (error: any) {
    if (error.meta?.body?.error?.type === "resource_already_exists_exception") {
      console.log("Index 'products' already exists.");
    } else {
      console.error("Error creating index:", error);
      return;
    }
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
      subCategory: p.subCategory?.name ?? "",
      category: p.subCategory?.category?.name ?? "",
      createdAt: p.createdAt,
      image: p.image ?? "",
      suggest: {
        input: [
          ...p.name.split(/\s+/).filter(Boolean), // Split name into words
          p.subCategory?.name ?? "",
          p.subCategory?.category?.name ?? "",
        ].filter(Boolean),
      },
    },
  ]);

  const result = await esClient.bulk({ body });

  const response = result.body;

  const failed = response.items.filter((i: any) => i.index?.error);

  console.log(
    `✓ Synced ${products.length - failed.length}/${products.length} products.`,
  );

  if (failed.length) {
    console.error("✗ Failed items:", failed);
  } else {
    console.log("✅ All products indexed successfully");
  }
}

bulkSync().catch(console.error);
