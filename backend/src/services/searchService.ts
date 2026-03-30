import esClient from "../config/elasticsearch";

interface SearchParams {
  query?: string;
  category?: string;
  subCategory?: string;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
}

export const searchProducts = async ({
  query,
  category,
  subCategory,
  priceMin,
  priceMax,
  page = 1,
  limit = 40,
  sortBy,
}: SearchParams) => {
  const from = (page - 1) * limit;

  const must: any[] = [];
  const filter: any[] = [];

  // Full-text search — name weighted 3x, handles typos
  if (query && query.trim()) {
    must.push({
      multi_match: {
        query: query.trim(),
        fields: ["name^3", "description"],
        fuzziness: "AUTO",
      },
    });
  } else {
    must.push({ match_all: {} });
  }

  // Always exclude INACTIVE products from search
  filter.push({ term: { status: "ACTIVE" } });

  if (category) filter.push({ term: { category } });
  if (subCategory) filter.push({ term: { subCategory } });

  if (priceMin !== undefined || priceMax !== undefined) {
    const range: any = {};
    if (priceMin !== undefined) range.gte = priceMin;
    if (priceMax !== undefined) range.lte = priceMax;
    filter.push({ range: { price: range } });
  }

  // Sorting
  let sort: any[] = ["_score"];
  if (sortBy === "price_asc") sort = [{ price: "asc" }];
  if (sortBy === "price_desc") sort = [{ price: "desc" }];
  if (sortBy === "newest") sort = [{ createdAt: "desc" }];
  if (sortBy === "name_asc") sort = [{ "name.keyword": "asc" }];
  if (sortBy === "name_desc") sort = [{ "name.keyword": "desc" }];

  const result = await esClient.search({
    index: "products",
    from,
    size: limit,
    body: {
      query: { bool: { must, filter } },
      sort,
      aggs: {
        categories: { terms: { field: "category" } },
        subCategories: { terms: { field: "subCategory" } },
        price_stats: { stats: { field: "price" } },
      },
    },
  });

  const hits = result.hits.hits;
  const total =
    typeof result.hits.total === "number"
      ? result.hits.total
      : (result.hits.total?.value ?? 0);
  const aggs = result.aggregations as any;
  const totalPages = Math.ceil(total / limit);

  return {
    products: hits.map((h) => h._source),
    total,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    facets: {
      categories: aggs?.categories?.buckets ?? [],
      subCategories: aggs?.subCategories?.buckets ?? [],
      priceRange: aggs?.price_stats ?? {},
    },
  };
};

export const autocompleteProducts = async (query: string) => {
  const result = await esClient.search({
    index: "products",
    suggest: {
      product_suggest: {
        prefix: query,
        completion: {
          field: "suggest",
          size: 6,
          skip_duplicates: true,
          fuzzy: {
            fuzziness: 1, // handles 1 typo
          },
        },
      },
    },
    _source: [
      "id",
      "name",
      "price",
      "discount",
      "image",
      "category",
      "subCategory",
    ],
    size: 0,
  });

  const suggestions =
    (result.suggest as any)?.product_suggest?.[0]?.options ?? [];

  return suggestions.map((s: any) => s._source);
};
