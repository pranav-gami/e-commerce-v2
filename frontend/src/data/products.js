import api, { BACKEND_URL } from "../utils/api";

const mapProduct = (product) => ({
  ...product,
  image: product.image ? `${BACKEND_URL}${product.image}` : null,
  images: product.images?.map((img) => `${BACKEND_URL}${img}`) || [],
});

export const fetchProducts = async (params = {}) => {
  // If there's a text search query, use Elasticsearch
  if (params.search && params.search.trim()) {
    const query = new URLSearchParams();
    query.set("q", params.search.trim());
    if (params.categoryId) query.set("category", params.categoryId);
    if (params.subCategoryId) query.set("subCategory", params.subCategoryId);
    if (params.page) query.set("page", params.page);
    if (params.limit) query.set("limit", params.limit);

    const res = await api.get(`/products/search?${query.toString()}`);
    const { products, total } = res.data.data;

    return {
      products: products.map(mapProduct),
      pagination: {
        total,
        page: params.page || 1,
        limit: params.limit || 40,
        totalPages: Math.ceil(total / (params.limit || 40)),
        hasNextPage:
          (params.page || 1) < Math.ceil(total / (params.limit || 40)),
        hasPrevPage: (params.page || 1) > 1,
      },
    };
  }

  // No search query — keep using PostgreSQL (browsing by category etc.)
  const query = new URLSearchParams();
  if (params.categoryId)
    String(params.categoryId)
      .split(",")
      .forEach((id) => id.trim() && query.append("categoryId", id.trim()));
  if (params.subCategoryId)
    String(params.subCategoryId)
      .split(",")
      .forEach((id) => id.trim() && query.append("subCategoryId", id.trim()));
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);

  const res = await api.get(`/products?${query.toString()}`);
  const { products, pagination } = res.data.data;

  return {
    products: products.map(mapProduct),
    pagination,
  };
};

export const fetchProductById = async (id) => {
  const res = await api.get(`/products/${id}`);
  const product = res.data.data;
  return mapProduct(product);
};
