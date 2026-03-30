import esClient from "../config/elasticsearch";

async function createProductIndex() {
  const exists = await esClient.indices.exists({ index: "products" });

  if (exists) {
    console.log("✓ Index already exists, skipping.");
    return;
  }

  await esClient.indices.create({
    index: "products",
    mappings: {
      // ← directly here, NO body: wrapper
      properties: {
        id: { type: "integer" },
        name: { type: "text", fields: { keyword: { type: "keyword" } } },
        description: { type: "text" },
        price: { type: "float" },
        discount: { type: "float" },
        stock: { type: "integer" },
        isFeatured: { type: "boolean" },
        status: { type: "keyword" },
        subCategory: { type: "keyword" },
        category: { type: "keyword" },
        createdAt: { type: "date" },
        suggest: { type: "completion" },
      },
    },
  });

  console.log("✓ Products index created successfully.");
}

createProductIndex().catch(console.error);
