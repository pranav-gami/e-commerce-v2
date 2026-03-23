import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../data/products";
import { useSearch } from "../context/SearchContext";
import { useInventory } from "../context/InventoryContext";
import ProductCard from "../components/ProductCard";
import { trackSearch } from "../utils/analytics";
import api from "../utils/api";
import "./ProductsPage.css";

const ProductsPage = () => {
  const { searchQuery, setSearchQuery } = useSearch();
  const { initInventory } = useInventory();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "",
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("");
  const [discountOnly, setDiscountOnly] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get("/categories"),
          api.get("/products"),
        ]);

        const allCategories = catRes.data.data?.categories || [];
        const allProducts = prodRes.data.data || [];

        // Collect all category ids that have at least one product
        const categoryIdsWithProducts = new Set();
        allProducts.forEach((p) => {
          if (p.subCategory?.category?.id)
            categoryIdsWithProducts.add(p.subCategory.category.id);
          if (p.subCategory?.categoryId)
            categoryIdsWithProducts.add(p.subCategory.categoryId);
        });

        // Only show categories that have products
        setCategories(
          allCategories.filter((cat) => categoryIdsWithProducts.has(cat.id)),
        );
      } catch (err) {
        console.error(err);
      }
    };
    loadCategories();
  }, []);

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

  // Add this useEffect to sync URL search param with context
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, []);
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts(selectedCategory || null);
        setProducts(data);
        initInventory(data);
      } catch (err) {
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [selectedCategory]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedSubcategory)
      result = result.filter(
        (p) => String(p.subCategoryId) === String(selectedSubcategory),
      );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.subCategory?.name?.toLowerCase().includes(q) || // subcategory name
          p.subCategory?.category?.name?.toLowerCase().includes(q), // category name
      );
    }
    if (priceRange.min !== "")
      result = result.filter((p) => {
        const fp = p.price - (p.price * (p.discount || 0)) / 100;
        return fp >= Number(priceRange.min);
      });
    if (priceRange.max !== "")
      result = result.filter((p) => {
        const fp = p.price - (p.price * (p.discount || 0)) / 100;
        return fp <= Number(priceRange.max);
      });
    if (discountOnly) result = result.filter((p) => p.discount > 0);
    if (sortBy === "price_asc") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "name_asc")
      result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name_desc")
      result.sort((a, b) => b.name.localeCompare(a.name));
    return result;
  }, [
    products,
    selectedSubcategory,
    searchQuery,
    priceRange,
    sortBy,
    discountOnly,
  ]);

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

  return (
    <div className="products-page">
      {/* Dark Banner */}
      <div className="products-banner">
        <div className="container">
          <div className="products-banner-inner">
            <div>
              <h1>
                {categoryName ||
                  (searchQuery ? `"${searchQuery}"` : "All Products")}
              </h1>
              <p className="products-banner-sub">
                {categoryName
                  ? `Explore our ${categoryName} collection`
                  : "Discover premium products at great prices"}
              </p>
            </div>
            {!loading && (
              <span className="products-count-badge">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="products-layout">
          {/* Sidebar */}
          <aside className="filters-sidebar">
            <div className="filters-sidebar-header">
              <h3>
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
                  <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
                </svg>
                Filters
              </h3>
              {hasActiveFilters && (
                <button className="btn-clear-all" onClick={handleClearFilters}>
                  Clear all
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="filter-section">
              <p className="filter-section-title">Sort By</p>
              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Default</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="name_asc">Name: A → Z</option>
                <option value="name_desc">Name: Z → A</option>
              </select>
            </div>

            {/* Category */}
            <div className="filter-section">
              <p className="filter-section-title">Category</p>
              <select
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            {subcategories.length > 0 && (
              <div className="filter-section">
                <p className="filter-section-title">Subcategory</p>
                <select
                  className="filter-select"
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                >
                  <option value="">All</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price */}
            <div className="filter-section">
              <p className="filter-section-title">Price Range (₹)</p>
              <div className="price-inputs">
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange((p) => ({ ...p, min: e.target.value }))
                  }
                  min="0"
                />
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange((p) => ({ ...p, max: e.target.value }))
                  }
                  min="0"
                />
              </div>
            </div>

            {/* Offers */}
            <div className="filter-section">
              <p className="filter-section-title">Offers</p>
              <label className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={discountOnly}
                  onChange={(e) => setDiscountOnly(e.target.checked)}
                />
                <span>Discounted only</span>
              </label>
            </div>

            {/* Active filter tags */}
            {hasActiveFilters && (
              <div className="filter-section">
                <p className="filter-section-title">Active Filters</p>
                <div className="sidebar-active-tags">
                  {searchQuery && (
                    <span className="filter-tag">
                      "{searchQuery}"
                      <button onClick={() => setSearchQuery("")}>×</button>
                    </span>
                  )}
                  {selectedSubcategory && (
                    <span className="filter-tag">
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
                    <span className="filter-tag">
                      Offers Only
                      <button onClick={() => setDiscountOnly(false)}>×</button>
                    </span>
                  )}
                  {(priceRange.min || priceRange.max) && (
                    <span className="filter-tag">
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
          </aside>

          {/* Products Area */}
          <div className="products-area">
            {loading ? (
              <div className="products-skeleton">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="product-skeleton" />
                ))}
              </div>
            ) : error ? (
              <div className="no-results">
                <p style={{ color: "var(--primary)" }}>{error}</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="products-grid">
                {filteredProducts.map((product, i) => (
                  <div
                    key={product.id}
                    style={{
                      animation: `fadeSlideUp 0.4s ease-out ${i * 0.04}s both`,
                    }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <h2>No products found</h2>
                <p>Try adjusting your filters or search term</p>
                <button
                  className="btn btn-primary"
                  onClick={handleClearFilters}
                >
                  Clear Filters
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
