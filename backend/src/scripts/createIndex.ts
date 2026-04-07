import esClient from "../config/elasticsearch";
 
async function createProductIndex() {
  const exists = await esClient.indices.exists({ index: "products" });
 
  if (exists) {
    console.log("✓ Index already exists, skipping.");
    return;
  }
 
  await esClient.indices.create({
  index: "products",
  body: {
    mappings: {
      properties: {
        name: {
          type: "text",
          fields: {
            keyword: { type: "keyword" },
          },
        },
        description: { type: "text" },
        category: { type: "keyword" },
        subCategory: { type: "keyword" },
        price: { type: "float" },
        createdAt: { type: "date" },
        status: { type: "keyword" },
        suggest: {
          type: "completion",
        },
      },
    },
  },
});
 
  console.log("✓ Products index created successfully.");
}
 
createProductIndex().catch(console.error);
