import api, { BACKEND_URL } from "../utils/api";

const mapProduct = (product) => ({
  ...product,
  image: product.image ? `${BACKEND_URL}${product.image}` : null,
  images: product.images?.map((img) => `${BACKEND_URL}${img}`) || [],
});

export const fetchProducts = async (params = {}) => {
  // ── Elasticsearch path (text search) ────────────────────────────────────
  if (params.search && params.search.trim()) {
    const query = new URLSearchParams();
    query.set("q", params.search.trim());
    if (params.categoryId) query.set("category", params.categoryId);
    if (params.subCategoryId) query.set("subCategory", params.subCategoryId);
    if (params.page) query.set("page", params.page);
    if (params.limit) query.set("limit", params.limit);
    // pass filter/sort params to search as well
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.priceMin) query.set("priceMin", params.priceMin);
    if (params.priceMax) query.set("priceMax", params.priceMax);
    if (params.minDiscount) query.set("minDiscount", params.minDiscount);
    if (params.discountOnly) query.set("discountOnly", "true");

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

  // ── PostgreSQL path (browse / filter / sort) ─────────────────────────────
  const query = new URLSearchParams();

  // Category / subcategory — support multiple ids
  if (params.categoryId) {
    String(params.categoryId)
      .split(",")
      .forEach((id) => id.trim() && query.append("categoryId", id.trim()));
  }
  if (params.subCategoryId) {
    String(params.subCategoryId)
      .split(",")
      .forEach((id) => id.trim() && query.append("subCategoryId", id.trim()));
  }

  // Pagination
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);

  // ── ALL FILTER & SORT PARAMS ─────────────────────────────────────────────
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.priceMin !== undefined && params.priceMin !== "")
    query.set("priceMin", params.priceMin);
  if (params.priceMax !== undefined && params.priceMax !== "")
    query.set("priceMax", params.priceMax);
  if (params.minDiscount !== undefined && params.minDiscount !== null)
    query.set("minDiscount", params.minDiscount);
  if (params.discountOnly) query.set("discountOnly", "true");

  const res = await api.get(`/products?${query.toString()}`);
  const { products, pagination } = res.data.data;

  return {
    products: products.map(mapProduct),
    pagination,
  };
};

/**
 * Fetch filter metadata for the current category/subcategory selection.
 * Uses a dedicated lightweight backend endpoint instead of fetching 500 products.
 */
export const fetchFilterMeta = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.categoryId) {
    String(params.categoryId)
      .split(",")
      .forEach((id) => id.trim() && query.append("categoryId", id.trim()));
  }
  if (params.subCategoryId) {
    String(params.subCategoryId)
      .split(",")
      .forEach((id) => id.trim() && query.append("subCategoryId", id.trim()));
  }

  const res = await api.get(`/products/filter-meta?${query.toString()}`);
  return res.data.data; // { minPrice, maxPrice, availableDiscounts }
};

export const fetchProductById = async (id) => {
  const res = await api.get(`/products/${id}`);
  const product = res.data.data;
  return mapProduct(product);
};
