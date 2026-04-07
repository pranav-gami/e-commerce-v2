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
  try {
    const from = (page - 1) * limit;

    const must: any[] = [];
    const filter: any[] = [];

    if (query && query.trim()) {
      must.push({
        multi_match: {
          query: query.trim(),
          fields: ["name^10", "description^1"], // Boost title 10x higher than description
          fuzziness: query.trim().length > 3 ? "AUTO" : 0, // Less fuzzy for short queries
          tie_breaker: 0.3,
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    filter.push({ term: { status: "ACTIVE" } });

    if (category) filter.push({ term: { category } });
    if (subCategory) filter.push({ term: { subCategory } });

    if (priceMin !== undefined || priceMax !== undefined) {
      const range: any = {};
      if (priceMin !== undefined) range.gte = priceMin;
      if (priceMax !== undefined) range.lte = priceMax;
      filter.push({ range: { price: range } });
    }

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

    const data = result.body;

    const hits = data.hits.hits;
    const total =
      typeof data.hits.total === "number"
        ? data.hits.total
        : data.hits.total?.value ?? 0;

    const aggs = (data as any).aggregations || (data as any).aggs || {};
    const totalPages = Math.ceil(total / limit);

    return {
      products: hits.map((h: any) => h._source),
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
        categories: (aggs?.categories?.buckets || []).map((b: any) => ({ key: b.key, doc_count: b.doc_count })),
        subCategories: (aggs?.subCategories?.buckets || []).map((b: any) => ({ key: b.key, doc_count: b.doc_count })),
        priceRange: aggs?.price_stats || {},
      },
    };
  } catch (error) {
    console.error('Search error:', error);
    // Return empty results on error
    return {
      products: [],
      total: 0,
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      facets: {
        categories: [],
        subCategories: [],
        priceRange: {},
      },
    };
  }
};

export const autocompleteProducts = async (query: string) => {
  const result = await esClient.search({
    index: "products",
    body: {
      suggest: {
        product_suggest: {
          prefix: query,
          completion: {
            field: "suggest",
            size: 6,
            skip_duplicates: true,
            // Remove aggressive fuzzy for more accurate prefix suggestions
            // fuzzy: { fuzziness: 1 },
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

  const data = result.body;

  const suggestions =
    (data.suggest as any)?.product_suggest?.[0]?.options ?? [];

  return suggestions.map((s: any) => s._source);
};
