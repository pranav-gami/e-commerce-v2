import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../data/products";
import { useSearch } from "../context/SearchContext";
import { useInventory } from "../context/InventoryContext";
import ProductCard from "../components/ProductCard";
import { trackSearch } from "../utils/analytics";
import api from "../utils/api";

const ProductsPage = () => {
  const { searchQuery, setSearchQuery } = useSearch();
  const { initInventory } = useInventory();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("");
  const [discountOnly, setDiscountOnly] = useState(false);
  
useEffect(() => {
  const cat = searchParams.get("category") || "";
  setSelectedCategory(cat);
}, [searchParams]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([api.get("/categories"), api.get("/products")]);
        const allCategories = catRes.data.data?.categories || [];
        const allProducts = prodRes.data.data || [];
        const categoryIdsWithProducts = new Set();
        allProducts.forEach((p) => {
          if (p.subCategory?.category?.id) categoryIdsWithProducts.add(p.subCategory.category.id);
          if (p.subCategory?.categoryId) categoryIdsWithProducts.add(p.subCategory.categoryId);
        });
        setCategories(allCategories.filter((cat) => categoryIdsWithProducts.has(cat.id)));
      } catch (err) { console.error(err); }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory) { setSubcategories([]); setSelectedSubcategory(""); return; }
    api.get(`/subcategories?categoryId=${selectedCategory}`)
      .then((res) => { setSubcategories(res.data.data?.subCategories || []); setSelectedSubcategory(""); })
      .catch(console.error);
  }, [selectedCategory]);

  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) setSearchQuery(urlSearch);
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
      result = result.filter((p) => String(p.subCategoryId) === String(selectedSubcategory));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.subCategory?.name?.toLowerCase().includes(q) ||
        p.subCategory?.category?.name?.toLowerCase().includes(q)
      );
    }
    if (priceRange.min !== "")
      result = result.filter((p) => { const fp = p.price - (p.price * (p.discount || 0)) / 100; return fp >= Number(priceRange.min); });
    if (priceRange.max !== "")
      result = result.filter((p) => { const fp = p.price - (p.price * (p.discount || 0)) / 100; return fp <= Number(priceRange.max); });
    if (discountOnly) result = result.filter((p) => p.discount > 0);
    if (sortBy === "price_asc") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "name_asc") result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name_desc") result.sort((a, b) => b.name.localeCompare(a.name));
    return result;
  }, [products, selectedSubcategory, searchQuery, priceRange, sortBy, discountOnly]);

  useEffect(() => {
    if (searchQuery.trim()) trackSearch(searchQuery, filteredProducts.length);
  }, [searchQuery, filteredProducts.length]);

  const handleClearFilters = () => {
    setSelectedCategory(""); setSelectedSubcategory("");
    setPriceRange({ min: "", max: "" }); setSortBy("");
    setDiscountOnly(false); setSearchQuery("");
  };

  const categoryName = selectedCategory
    ? categories.find((c) => String(c.id) === String(selectedCategory))?.name : "";

  const hasActiveFilters = selectedCategory || selectedSubcategory || priceRange.min || priceRange.max || discountOnly || searchQuery;

  const FilterSection = ({ title, children }) => (
    <div className="py-4 border-b border-brand-border">
      <p className="text-xs font-extrabold text-brand-dark uppercase tracking-wider mb-3">{title}</p>
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
              {categoryName || (searchQuery ? `"${searchQuery}"` : "All Products")}
            </h1>
            <p className="text-white/60 text-sm mt-0.5">
              {categoryName ? `Explore our ${categoryName} collection` : "Discover premium products at great prices"}
            </p>
          </div>
          {!loading && (
            <span className="bg-white/10 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
              {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className={`
            lg:block lg:w-64 flex-shrink-0
            ${sidebarOpen ? "block fixed inset-0 z-50 bg-white w-72 overflow-y-auto p-4" : "hidden"}
          `}>
            {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden flex items-center gap-2 text-sm text-brand-gray mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Close Filters
              </button>
            )}

            <div className="bg-white rounded shadow-sm p-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                <h3 className="text-base font-extrabold text-brand-dark uppercase tracking-wide flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
                  </svg>
                  Filters
                </h3>
                {hasActiveFilters && (
                  <button onClick={handleClearFilters} className="text-xs font-bold text-primary hover:underline">
                    CLEAR ALL
                  </button>
                )}
              </div>

              {/* Sort */}
              <FilterSection title="Sort By">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-brand-border rounded px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-primary">
                  <option value="">Recommended</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="name_asc">Name: A → Z</option>
                  <option value="name_desc">Name: Z → A</option>
                </select>
              </FilterSection>

              {/* Category */}
              <FilterSection title="Category">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="cat" value="" checked={selectedCategory === ""} onChange={() => setSelectedCategory("")}
                      className="accent-primary" />
                    <span className="text-sm text-brand-dark group-hover:text-primary transition-colors">All Categories</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="cat" value={cat.id} checked={String(selectedCategory) === String(cat.id)}
                        onChange={() => setSelectedCategory(cat.id)} className="accent-primary" />
                      <span className="text-sm text-brand-dark group-hover:text-primary transition-colors">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Subcategory */}
              {subcategories.length > 0 && (
                <FilterSection title="Subcategory">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="subcat" value="" checked={selectedSubcategory === ""} onChange={() => setSelectedSubcategory("")}
                        className="accent-primary" />
                      <span className="text-sm text-brand-dark group-hover:text-primary transition-colors">All</span>
                    </label>
                    {subcategories.map((sub) => (
                      <label key={sub.id} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="subcat" value={sub.id} checked={String(selectedSubcategory) === String(sub.id)}
                          onChange={() => setSelectedSubcategory(sub.id)} className="accent-primary" />
                        <span className="text-sm text-brand-dark group-hover:text-primary transition-colors">{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Price */}
              <FilterSection title="Price Range (₹)">
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={priceRange.min}
                    onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))} min="0"
                    className="w-1/2 border border-brand-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="Max" value={priceRange.max}
                    onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))} min="0"
                    className="w-1/2 border border-brand-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
                </div>
              </FilterSection>

              {/* Offers */}
              <FilterSection title="Offers">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={discountOnly} onChange={(e) => setDiscountOnly(e.target.checked)}
                    className="accent-primary w-4 h-4" />
                  <span className="text-sm text-brand-dark group-hover:text-primary transition-colors">Discounted Only</span>
                </label>
              </FilterSection>

              {/* Active filters */}
              {hasActiveFilters && (
                <div className="pt-3">
                  <p className="text-xs font-extrabold text-brand-dark uppercase tracking-wider mb-2">Active Filters</p>
                  <div className="flex flex-wrap gap-1.5">
                    {searchQuery && (
                      <span className="flex items-center gap-1 bg-primary-light text-primary text-xs font-semibold px-2 py-1 rounded-full">
                        "{searchQuery}"
                        <button onClick={() => setSearchQuery("")} className="hover:text-primary-hover">×</button>
                      </span>
                    )}
                    {selectedSubcategory && (
                      <span className="flex items-center gap-1 bg-primary-light text-primary text-xs font-semibold px-2 py-1 rounded-full">
                        {subcategories.find((s) => String(s.id) === String(selectedSubcategory))?.name}
                        <button onClick={() => setSelectedSubcategory("")}>×</button>
                      </span>
                    )}
                    {discountOnly && (
                      <span className="flex items-center gap-1 bg-primary-light text-primary text-xs font-semibold px-2 py-1 rounded-full">
                        Offers Only <button onClick={() => setDiscountOnly(false)}>×</button>
                      </span>
                    )}
                    {(priceRange.min || priceRange.max) && (
                      <span className="flex items-center gap-1 bg-primary-light text-primary text-xs font-semibold px-2 py-1 rounded-full">
                        ₹{priceRange.min || "0"} – ₹{priceRange.max || "∞"}
                        <button onClick={() => setPriceRange({ min: "", max: "" })}>×</button>
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
              <button onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 border border-brand-border bg-white px-4 py-2 rounded text-sm font-semibold text-brand-dark">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="12" y1="18" x2="12" y2="18" />
                </svg>
                Filters {hasActiveFilters ? `(${[selectedCategory, selectedSubcategory, priceRange.min, priceRange.max, discountOnly, searchQuery].filter(Boolean).length})` : ""}
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded aspect-[3/4] animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-primary font-semibold text-lg">{error}</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product, i) => (
                  <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94969f" strokeWidth="1.2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <h2 className="text-xl font-bold text-brand-dark mt-4">No products found</h2>
                <p className="text-brand-gray mt-1 text-sm">Try adjusting your filters or search term</p>
                <button onClick={handleClearFilters}
                  className="mt-5 bg-primary text-white px-6 py-2.5 text-sm font-bold hover:bg-primary-hover transition-colors rounded-sm">
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
