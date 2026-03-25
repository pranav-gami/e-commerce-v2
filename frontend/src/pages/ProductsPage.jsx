import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../data/products";
import { useSearch } from "../context/SearchContext";
import { useInventory } from "../context/InventoryContext";
import ProductCard from "../components/ProductCard";
import { trackSearch } from "../utils/analytics";
import api from "../utils/api";

const LIMIT = 12;

const Pagination = ({ pagination, page, onPage }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { totalPages, hasNextPage, hasPrevPage } = pagination;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPage(page - 1)}
        disabled={!hasPrevPage}
        className="w-9 h-9 flex items-center justify-center border border-brand-border bg-white rounded text-brand-gray hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`d${i}`}
            className="w-9 h-9 flex items-center justify-center text-brand-gray text-sm"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-9 h-9 flex items-center justify-center border rounded text-sm font-bold transition-colors ${
              p === page
                ? "bg-primary text-white border-primary"
                : "bg-white border-brand-border text-brand-dark hover:border-primary hover:text-primary"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={!hasNextPage}
        className="w-9 h-9 flex items-center justify-center border border-brand-border bg-white rounded text-brand-gray hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

const ProductsPage = () => {
  const { searchQuery, setSearchQuery } = useSearch();
  const { initInventory } = useInventory();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "",
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("");
  const [discountOnly, setDiscountOnly] = useState(false);

  // sync category from URL
  useEffect(() => {
    const cat = searchParams.get("category") || "";
    setSelectedCategory(cat);
    setPage(1);
  }, [searchParams]);

  // sync search from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) setSearchQuery(urlSearch);
  }, []);

  // load categories once
  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get("/categories"),
          api.get("/products?limit=1000"),
        ]);
        const allCategories = catRes.data.data?.categories || [];
        const allProducts = prodRes.data.data?.products || [];
        const catIds = new Set();
        allProducts.forEach((p) => {
          if (p.subCategory?.category?.id)
            catIds.add(p.subCategory.category.id);
          if (p.subCategory?.categoryId) catIds.add(p.subCategory.categoryId);
        });
        setCategories(allCategories.filter((c) => catIds.has(c.id)));
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  // load subcategories when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setSelectedSubcategory("");
      return;
    }
    api
      .get(`/subcategories?categoryId=${selectedCategory}`)
      .then((res) => {
        setSubcategories(res.data.data?.subCategories || []);
        setSelectedSubcategory("");
      })
      .catch(console.error);
  }, [selectedCategory]);

  // fetch products from server — fires on page, category, subcategory, searchQuery, discountOnly
  // client-side filters (price range, sort) work on the current page results
  const loadProducts = async (p = page) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchProducts({
        page: p,
        limit: LIMIT,
        categoryId: selectedCategory || undefined,
        subCategoryId: selectedSubcategory || undefined,
        search: searchQuery.trim() || undefined,
        isFeatured: undefined,
      });
      setProducts(result.products);
      setPagination(result.pagination);
      initInventory(result.products);
    } catch (err) {
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadProducts(1);
  }, [selectedCategory, selectedSubcategory, searchQuery, discountOnly]);

  const handlePage = (p) => {
    setPage(p);
    loadProducts(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // client-side price, discount, sort filtering on current page
  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (discountOnly) result = result.filter((p) => p.discount > 0);
    if (priceRange.min !== "") {
      result = result.filter((p) => {
        const fp = p.price - (p.price * (p.discount || 0)) / 100;
        return fp >= Number(priceRange.min);
      });
    }
    if (priceRange.max !== "") {
      result = result.filter((p) => {
        const fp = p.price - (p.price * (p.discount || 0)) / 100;
        return fp <= Number(priceRange.max);
      });
    }
    if (sortBy === "price_asc") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price);
    if (sortBy === "name_asc")
      result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name_desc")
      result.sort((a, b) => b.name.localeCompare(a.name));
    return result;
  }, [products, discountOnly, priceRange, sortBy]);

  useEffect(() => {
    if (searchQuery.trim()) trackSearch(searchQuery, filteredProducts.length);
  }, [searchQuery, filteredProducts.length]);

  const handleClearFilters = () => {
    setSelectedCategory("");
    setSelectedSubcategory("");
    setPriceRange({ min: "", max: "" });
    setSortBy("");
    setDiscountOnly(false);
    setSearchQuery("");
  };

  const categoryName = selectedCategory
    ? categories.find((c) => String(c.id) === String(selectedCategory))?.name
    : "";
  const hasActiveFilters =
    selectedCategory ||
    selectedSubcategory ||
    priceRange.min ||
    priceRange.max ||
    discountOnly ||
    searchQuery;

  const FilterSection = ({ title, children }) => (
    <div className="py-4 border-b border-brand-border">
      <p className="text-xs font-extrabold text-brand-dark uppercase tracking-wider mb-3">
        {title}
      </p>
      {children}
    </div>
  );

  return (
    <div className="bg-brand-light min-h-screen">
      {/* Banner */}
      <div className="bg-brand-dark text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">
              {categoryName ||
                (searchQuery ? `"${searchQuery}"` : "All Products")}
            </h1>
            <p className="text-white/60 text-sm mt-0.5">
              {categoryName
                ? `Explore our ${categoryName} collection`
                : "Discover premium products at great prices"}
            </p>
          </div>
          {!loading && pagination && (
            <span className="bg-white/10 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
              {pagination.total} {pagination.total === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside
            className={`lg:block lg:w-64 flex-shrink-0 ${sidebarOpen ? "block fixed inset-0 z-50 bg-white w-72 overflow-y-auto p-4" : "hidden"}`}
          >
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden flex items-center gap-2 text-sm text-brand-gray mb-4"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Close Filters
              </button>
            )}

            <div className="bg-white rounded shadow-sm p-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                <h3 className="text-base font-extrabold text-brand-dark uppercase tracking-wide flex items-center gap-2">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                    <line
                      x1="12"
                      y1="18"
                      x2="12"
                      y2="18"
                      strokeLinecap="round"
                    />
                  </svg>
                  Filters
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    CLEAR ALL
                  </button>
                )}
              </div>

              <FilterSection title="Sort By">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-brand-border rounded px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-primary"
                >
                  <option value="">Recommended</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="name_asc">Name: A → Z</option>
                  <option value="name_desc">Name: Z → A</option>
                </select>
              </FilterSection>

              <FilterSection title="Category">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="cat"
                      value=""
                      checked={selectedCategory === ""}
                      onChange={() => setSelectedCategory("")}
                      className="accent-primary"
                    />
                    <span className="text-sm text-brand-dark group-hover:text-primary transition-colors">
                      All Categories
                    </span>
                  </label>
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="cat"
                        value={cat.id}
                        checked={String(selectedCategory) === String(cat.id)}
                        onChange={() => setSelectedCategory(cat.id)}
                        className="accent-primary"
                      />
                      <span className="text-sm text-brand-dark group-hover:text-primary transition-colors">
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {subcategories.length > 0 && (
                <FilterSection title="Subcategory">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="subcat"
                        value=""
                        checked={selectedSubcategory === ""}
                        onChange={() => setSelectedSubcategory("")}
                        className="accent-primary"
                      />
                      <span className="text-sm text-brand-dark group-hover:text-primary transition-colors">
                        All
                      </span>
                    </label>
                    {subcategories.map((sub) => (
                      <label
                        key={sub.id}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="subcat"
                          value={sub.id}
                          checked={
                            String(selectedSubcategory) === String(sub.id)
                          }
                          onChange={() => setSelectedSubcategory(sub.id)}
                          className="accent-primary"
                        />
                        <span className="text-sm text-brand-dark group-hover:text-primary transition-colors">
                          {sub.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </FilterSection>
              )}

              <FilterSection title="Price Range (₹)">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    min="0"
                    onChange={(e) =>
                      setPriceRange((p) => ({ ...p, min: e.target.value }))
                    }
                    className="w-1/2 border border-brand-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    min="0"
                    onChange={(e) =>
                      setPriceRange((p) => ({ ...p, max: e.target.value }))
                    }
                    className="w-1/2 border border-brand-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </FilterSection>

              <FilterSection title="Offers">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={discountOnly}
                    onChange={(e) => setDiscountOnly(e.target.checked)}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm text-brand-dark group-hover:text-primary transition-colors">
                    Discounted Only
                  </span>
                </label>
              </FilterSection>

              {hasActiveFilters && (
                <div className="pt-3">
                  <p className="text-xs font-extrabold text-brand-dark uppercase tracking-wider mb-2">
                    Active Filters
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {searchQuery && (
                      <span className="flex items-center gap-1 bg-primary-light text-primary text-xs font-semibold px-2 py-1 rounded-full">
                        "{searchQuery}"{" "}
                        <button onClick={() => setSearchQuery("")}>×</button>
                      </span>
                    )}
                    {selectedSubcategory && (
                      <span className="flex items-center gap-1 bg-primary-light text-primary text-xs font-semibold px-2 py-1 rounded-full">
                        {
                          subcategories.find(
                            (s) => String(s.id) === String(selectedSubcategory),
                          )?.name
                        }
                        <button onClick={() => setSelectedSubcategory("")}>
                          ×
                        </button>
                      </span>
                    )}
                    {discountOnly && (
                      <span className="flex items-center gap-1 bg-primary-light text-primary text-xs font-semibold px-2 py-1 rounded-full">
                        Offers Only{" "}
                        <button onClick={() => setDiscountOnly(false)}>
                          ×
                        </button>
                      </span>
                    )}
                    {(priceRange.min || priceRange.max) && (
                      <span className="flex items-center gap-1 bg-primary-light text-primary text-xs font-semibold px-2 py-1 rounded-full">
                        ₹{priceRange.min || "0"} – ₹{priceRange.max || "∞"}
                        <button
                          onClick={() => setPriceRange({ min: "", max: "" })}
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Products Area */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 border border-brand-border bg-white px-4 py-2 rounded text-sm font-semibold text-brand-dark"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="12" y1="18" x2="12" y2="18" />
                </svg>
                Filters{" "}
                {hasActiveFilters
                  ? `(${[selectedCategory, selectedSubcategory, priceRange.min, priceRange.max, discountOnly, searchQuery].filter(Boolean).length})`
                  : ""}
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(LIMIT)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded aspect-[3/4] animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-primary font-semibold text-lg">{error}</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product, i) => (
                    <div
                      key={product.id}
                      className="animate-fade-up"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  pagination={pagination}
                  page={page}
                  onPage={handlePage}
                />

                {pagination && (
                  <p className="text-center text-xs text-brand-gray mt-3">
                    Showing {(page - 1) * LIMIT + 1}–
                    {Math.min(page * LIMIT, pagination.total)} of{" "}
                    {pagination.total} products
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94969f"
                  strokeWidth="1.2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <h2 className="text-xl font-bold text-brand-dark mt-4">
                  No products found
                </h2>
                <p className="text-brand-gray mt-1 text-sm">
                  Try adjusting your filters or search term
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-5 bg-primary text-white px-6 py-2.5 text-sm font-bold hover:bg-primary-hover transition-colors rounded-sm"
                >
                  CLEAR FILTERS
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
