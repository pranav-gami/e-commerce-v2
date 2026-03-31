import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchProducts } from "../data/products";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { selectSearchQuery, setSearchQuery } from "../redux/slices/searchSlice";
import { initInventory } from "../redux/slices/inventorySlice";
import ProductCard from "../components/ProductCard";
import { trackSearch } from "../utils/analytics";
import api from "../utils/api";
import Slider from "@mui/material/Slider";

const LIMIT = 40;

// ─── Pagination ───────────────────────────────────────────────────────────────
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
        className="w-9 h-9 flex items-center justify-center border border-[#d4d5d9] bg-white text-[#94969f] hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`d${i}`} className="w-9 h-9 flex items-center justify-center text-[#94969f] text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-9 h-9 flex items-center justify-center border text-sm font-bold transition-colors ${
              p === page
                ? "bg-primary text-white border-primary"
                : "bg-white border-[#d4d5d9] text-[#282c3f] hover:border-primary hover:text-primary"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={!hasNextPage}
        className="w-9 h-9 flex items-center justify-center border border-[#d4d5d9] bg-white text-[#94969f] hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

// ─── Sort Dropdown ────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "", label: "Recommended" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A → Z" },
  { value: "name_desc", label: "Name: Z → A" },
];

const SortDropdown = ({ sortBy, setSortBy }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Recommended";

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className="flex items-center gap-2 border border-[#d4d5d9] px-4 py-2.5 text-[13px] font-semibold text-[#282c3f] bg-white hover:border-[#282c3f] transition-colors min-w-[200px] justify-between"
        onClick={() => setOpen((o) => !o)}
      >
        <span>
          <span className="text-[#94969f] font-normal">Sort by : </span>
          {currentLabel}
        </span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#282c3f" strokeWidth="2.5"
          className={`transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 bg-white border border-[#d4d5d9] shadow-lg min-w-[200px] py-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setSortBy(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                sortBy === opt.value
                  ? "bg-[#fff0f3] text-primary font-semibold"
                  : "text-[#282c3f] hover:bg-[#f5f5f6]"
              }`}
            >
              {opt.label}
              {sortBy === opt.value && <span className="float-right text-primary">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── More Items Modal ─────────────────────────────────────────────────────────
const MoreModal = ({ title, items, selectedItems, onToggle, onClose }) => {
  const [search, setSearch] = useState("");
  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-[480px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eaeaec]">
          <h3 className="text-[15px] font-extrabold text-[#282c3f] uppercase tracking-[0.8px]">{title}</h3>
          <button onClick={onClose} className="text-[#94969f] hover:text-[#282c3f]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-3 border-b border-[#eaeaec]">
          <div className="flex items-center gap-2 border border-[#d4d5d9] px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94969f" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder={`Search ${title}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-[#282c3f] outline-none placeholder:text-[#94969f]"
              autoFocus
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {filtered.map((item) => (
              <label key={item.id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => onToggle(item.id)}
                  className="accent-primary w-3.5 h-3.5 flex-shrink-0"
                />
                <span className="text-[13px] text-[#282c3f] group-hover:text-primary transition-colors truncate">
                  {item.name}
                  {item.count !== undefined && (
                    <span className="text-[#94969f] ml-1">({item.count})</span>
                  )}
                </span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-2 text-[13px] text-[#94969f] text-center py-4">No results found</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#eaeaec]">
          <span className="text-[12px] text-[#94969f]">{selectedItems.length} selected</span>
          <button
            onClick={onClose}
            className="bg-primary text-white px-6 py-2 text-[13px] font-bold hover:bg-primary-hover transition-colors"
          >
            APPLY
          </button>
        </div>
      </div>
    </div>
  );
};

const PriceSlider = ({ priceRange, setPriceRange }) => {
  const value = [
    priceRange.min ? Number(priceRange.min) : 0,
    priceRange.max ? Number(priceRange.max) : 8000,
  ];

  return (
    <Slider
      sx={{
        color: "#ff3f6c",
        height: 4,
        "& .MuiSlider-thumb": { height: 16, width: 16, backgroundColor: "#ff3f6c", border: "2px solid white" },
        "& .MuiSlider-track": { border: "none" },
        "& .MuiSlider-rail": { opacity: 0.3, backgroundColor: "#ccc" },
      }}
      value={value}
      min={0}
      max={8000}
      step={100}
      onChange={(e, newValue) => {
        setPriceRange({
          min: newValue[0] === 0 ? "" : String(newValue[0]),
          max: newValue[1] === 8000 ? "" : String(newValue[1]),
        });
      }}
      valueLabelDisplay="auto"
    />
  );
};

const DISCOUNT_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90];

// ─── Scroll-to-Top Button ─────────────────────────────────────────────────────
const ScrollToTopBtn = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-8 right-8 z-50 w-11 h-11 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-hover transition-all hover:scale-110 active:scale-95"
      aria-label="Scroll to top"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
};

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
const Breadcrumb = ({ categories, selectedCategory, selectedSubcategory, subcategories, searchQuery }) => {
  const cat = selectedCategory.length
    ? categories.find((c) => String(c.id) === String(selectedCategory[0]))
    : null;
  const sub = selectedSubcategory.length
    ? subcategories.find((s) => String(s.id) === String(selectedSubcategory[0]))
    : null;

  const sep = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94969f" strokeWidth="2" className="flex-shrink-0">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  return (
    <nav className="flex items-center gap-1.5 text-[13px] text-[#94969f] mb-4 flex-wrap">
      <Link to="/" className="hover:text-primary transition-colors">Home</Link>
      {sep}
      <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
      {cat && (
        <>
          {sep}
          <Link to={`/products?category=${cat.id}`} className="hover:text-primary transition-colors">{cat.name}</Link>
        </>
      )}
      {sub && (
        <>
          {sep}
          <span className="font-semibold text-[#282c3f]">{sub.name}</span>
        </>
      )}
      {!cat && searchQuery && (
        <>
          {sep}
          <span className="font-semibold text-[#282c3f]">"{searchQuery}"</span>
        </>
      )}
    </nav>
  );
};

// ─── Main ProductsPage ────────────────────────────────────────────────────────
const ProductsPage = () => {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(selectSearchQuery);
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);

  const toggleValue = (value, setter) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") ? [searchParams.get("category")] : [],
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("");
  const [discountOnly, setDiscountOnly] = useState(false);
  const [minDiscount, setMinDiscount] = useState(null);

  useEffect(() => {
    const cat = searchParams.get("category") || "";
    setSelectedCategory(cat ? [cat] : []);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) dispatch(setSearchQuery(urlSearch));
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data.data?.categories || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedCategory.length) {
      setSubcategories([]);
      setSelectedSubcategory([]);
      return;
    }
    Promise.all(
      selectedCategory.map((catId) =>
        api
          .get(`/subcategories?categoryId=${catId}`)
          .then((res) => res.data.data?.subCategories || []),
      ),
    )
      .then((results) => {
        const merged = results.flat();
        const seen = new Set();
        const unique = merged.filter((s) => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
        setSubcategories(unique);
        setSelectedSubcategory((prev) =>
          prev.filter((id) => unique.some((s) => String(s.id) === String(id))),
        );
      })
      .catch(console.error);
  }, [selectedCategory]);

  const loadProducts = async (p = page) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchProducts({
        page: p,
        limit: LIMIT,
        categoryId: selectedCategory.length ? selectedCategory.join(",") : undefined,
        subCategoryId: selectedSubcategory.length ? selectedSubcategory.join(",") : undefined,
        search: searchQuery.trim() || undefined,
      });
      setProducts(result.products);
      setPagination(result.pagination);
      dispatch(initInventory(result.products));
    } catch (err) {
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadProducts(1);
  }, [selectedCategory, selectedSubcategory, searchQuery]);

  const handlePage = (p) => {
    setPage(p);
    loadProducts(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (discountOnly) result = result.filter((p) => p.discount > 0);
    if (minDiscount !== null)
      result = result.filter((p) => (p.discount || 0) >= minDiscount);
    const minPrice = priceRange.min !== "" ? Number(priceRange.min) : 0;
    const maxPrice = priceRange.max !== "" ? Number(priceRange.max) : Infinity;
    result = result.filter((p) => {
      const fp = p.price - (p.price * (p.discount || 0)) / 100;
      return fp >= minPrice && fp <= maxPrice;
    });
    if (sortBy === "price_asc") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price);
    if (sortBy === "name_asc") result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name_desc") result.sort((a, b) => b.name.localeCompare(a.name));
    return result;
  }, [products, discountOnly, minDiscount, priceRange, sortBy]);

  useEffect(() => {
    if (searchQuery.trim()) trackSearch(searchQuery, filteredProducts.length);
  }, [searchQuery, filteredProducts.length]);

  const handleClearFilters = () => {
    setSelectedCategory([]);
    setSelectedSubcategory([]);
    setPriceRange({ min: "", max: "" });
    setSortBy("");
    setDiscountOnly(false);
    setMinDiscount(null);
    dispatch(setSearchQuery(""));
  };

  const categoryName = useMemo(() => {
    if (!categories?.length || !selectedCategory?.length) return "";
    return selectedCategory
      .map((id) => {
        const cat = categories.find((c) => String(c.id) === String(id));
        return cat?.name || "";
      })
      .filter(Boolean)
      .join(", ");
  }, [categories, selectedCategory]);

  useEffect(() => {
    let title = "Buy Latest Fashion Online at Best Prices | Myntra";
    if (categoryName) {
      title = `${categoryName} | Buy ${categoryName} Online at Best Prices | Myntra`;
    } else if (searchQuery) {
      title = `"${searchQuery}" |Buy ${searchQuery} Online at Best Prices | Myntra`;
    }
    document.title = title;
  }, [categoryName, searchQuery]);

  const hasActiveFilters =
    selectedCategory.length ||
    selectedSubcategory.length ||
    priceRange.min ||
    priceRange.max ||
    discountOnly ||
    minDiscount !== null ||
    searchQuery;

  const activeFilterCount = [
    selectedCategory.length > 0,
    selectedSubcategory.length > 0,
    priceRange.min,
    priceRange.max,
    discountOnly,
    minDiscount !== null,
    searchQuery,
  ].filter(Boolean).length;

  const FilterSection = ({ title, children }) => (
    <div className="border-b border-[#eaeaec]">
      <div className="py-3.5" data-filter-title>
        <span className="text-[13px] font-extrabold text-[#282c3f] uppercase tracking-[0.8px]">{title}</span>
      </div>
      <div className="pb-4">{children}</div>
    </div>
  );

  const SidebarContent = () => (
    <div>
      <div className="flex items-center justify-between py-3.5 border-b border-[#eaeaec]">
        <h3 className="text-[15px] font-semibold text-[#282c3f] uppercase tracking-[0.8px]">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-[13px] font-semibold text-primary hover:underline uppercase tracking-wide"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Category */}
      <FilterSection title="Category">
        <div className="space-y-2.5">
          {categories.slice(0, 8).map((cat) => (
            <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategory.includes(String(cat.id))}
                onChange={() => toggleValue(String(cat.id), setSelectedCategory)}
              />
              <span className="text-[13px] text-[#282c3f] group-hover:text-primary transition-colors">
                {cat.name}
                {cat.count !== undefined && (
                  <span className="text-[#94969f] ml-1">({cat.count})</span>
                )}
              </span>
            </label>
          ))}
          {categories.length > 8 && (
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="text-[13px] text-primary font-semibold hover:underline"
            >
              + {categories.length - 8} more
            </button>
          )}
        </div>
      </FilterSection>

      {/* Subcategory */}
      {subcategories.length > 0 && (
        <FilterSection title="Subcategory">
          <div className="space-y-2.5">
            {subcategories.slice(0, 8).map((sub) => (
              <label key={sub.id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedSubcategory.includes(String(sub.id))}
                  onChange={() => toggleValue(String(sub.id), setSelectedSubcategory)}
                  className="accent-primary w-3.5 h-3.5"
                />
                <span className="text-[13px] text-[#282c3f] group-hover:text-primary transition-colors">
                  {sub.name}
                  {sub.count !== undefined && (
                    <span className="text-[#94969f] ml-1">({sub.count})</span>
                  )}
                </span>
              </label>
            ))}
            {subcategories.length > 8 && (
              <button
                onClick={() => setSubcategoryModalOpen(true)}
                className="text-[13px] text-primary font-semibold hover:underline"
              >
                + {subcategories.length - 8} more
              </button>
            )}
          </div>
        </FilterSection>
      )}

      {/* Price Range */}
      <FilterSection title="Price Range (₹)">
        <PriceSlider priceRange={priceRange} setPriceRange={setPriceRange} />
      </FilterSection>

      {/* Discount Range */}
      <FilterSection title="Discount Range">
        <div className="space-y-2.5">
          {DISCOUNT_OPTIONS.map((pct) => (
            <label key={pct} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="discount_range"
                checked={minDiscount === pct}
                onChange={() => setMinDiscount(minDiscount === pct ? null : pct)}
                className="accent-primary w-3.5 h-3.5"
              />
              <span className="text-[13px] text-[#282c3f] group-hover:text-primary transition-colors">
                {pct}% and above
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Offers */}
      <FilterSection title="Offers">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={discountOnly}
            onChange={(e) => setDiscountOnly(e.target.checked)}
            className="accent-primary w-3.5 h-3.5"
          />
          <span className="text-[13px] text-[#282c3f] group-hover:text-primary transition-colors">
            Discounted Only
          </span>
        </label>
      </FilterSection>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      <ScrollToTopBtn />

      {categoryModalOpen && (
        <MoreModal
          title="Category"
          items={categories}
          selectedItems={selectedCategory}
          onToggle={(id) => toggleValue(id, setSelectedCategory)}
          onClose={() => setCategoryModalOpen(false)}
        />
      )}

      {subcategoryModalOpen && (
        <MoreModal
          title="Subcategory"
          items={subcategories.map((s) => ({ ...s, id: String(s.id) }))}
          selectedItems={selectedSubcategory}
          onToggle={(id) => toggleValue(id, setSelectedSubcategory)}
          onClose={() => setSubcategoryModalOpen(false)}
        />
      )}

      <div className="w-full px-36 py-5">
        <Breadcrumb
          categories={categories}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          subcategories={subcategories}
          searchQuery={searchQuery}
        />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-[17px] font-bold text-[#282c3f]">
              {categoryName || (searchQuery ? `"${searchQuery}"` : "All Products")}
            </h3>
            {!loading && pagination && (
              <span className="text-[17px] text-[#94969f]">- {pagination.total} items</span>
            )}
          </div>
        </div>

        <div className="flex gap-0 relative">
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="hidden lg:block w-[220px] flex-shrink-0">
            <div className="sticky top-0 max-h-screen overflow-y-auto p-2" style={{ scrollbarWidth: "none" }}>
              <SidebarContent />
            </div>
          </div>

          <aside
            className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-white overflow-y-auto transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#eaeaec]">
              <span className="font-extrabold text-[#282c3f]">Filters</span>
              <button onClick={() => setSidebarOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#282c3f" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <SidebarContent />
            </div>
          </aside>

          <div className="hidden lg:block w-px bg-[#eaeaec] flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-end justify-between gap-4 flex-wrap m-1.5">
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedCategory.map((catId) => {
                    const cat = categories.find((c) => String(c.id) === String(catId));
                    return cat ? (
                      <span
                        key={catId}
                        className="flex items-center gap-1.5 border border-[#d4d5d9] rounded-full text-[#282c3f] text-[12px] font-semibold px-2.5 py-1 bg-white hover:border-primary transition-colors"
                      >
                        {cat.name}
                        <button
                          onClick={() => toggleValue(catId, setSelectedCategory)}
                          className="text-[#94969f] hover:text-primary font-bold leading-none"
                        >×</button>
                      </span>
                    ) : null;
                  })}
                  {selectedSubcategory.map((subId) => {
                    const sub = subcategories.find((s) => String(s.id) === String(subId));
                    return sub ? (
                      <span
                        key={subId}
                        className="flex items-center gap-1.5 border border-[#d4d5d9] rounded-full text-[#282c3f] text-[12px] font-semibold px-2.5 py-1 bg-white hover:border-primary transition-colors"
                      >
                        {sub.name}
                        <button
                          onClick={() => toggleValue(String(subId), setSelectedSubcategory)}
                          className="text-[#94969f] hover:text-primary font-bold leading-none"
                        >×</button>
                      </span>
                    ) : null;
                  })}
                  {discountOnly && (
                    <span className="flex items-center gap-1.5 border border-[#d4d5d9] rounded-full text-[#282c3f] text-[12px] font-semibold px-2.5 py-1 bg-white hover:border-primary transition-colors">
                      Offers
                      <button onClick={() => setDiscountOnly(false)} className="text-[#94969f] hover:text-primary font-bold leading-none">×</button>
                    </span>
                  )}
                  {minDiscount !== null && (
                    <span className="flex items-center gap-1.5 border border-[#d4d5d9] rounded-full text-[#282c3f] text-[12px] font-semibold px-2.5 py-1 bg-white hover:border-primary transition-colors">
                      {minDiscount}% and above
                      <button onClick={() => setMinDiscount(null)} className="text-[#94969f] hover:text-primary font-bold leading-none">×</button>
                    </span>
                  )}
                  {(priceRange.min || priceRange.max) && (
                    <span className="flex items-center gap-1.5 border border-[#d4d5d9] rounded-full text-[#282c3f] text-[12px] font-semibold px-2.5 py-1 bg-white hover:border-primary transition-colors">
                      ₹{priceRange.min || "0"} – ₹{priceRange.max || "8000+"}
                      <button onClick={() => setPriceRange({ min: "", max: "" })} className="text-[#94969f] hover:text-primary font-bold leading-none">×</button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="flex items-center gap-1.5 border border-[#d4d5d9] rounded-full text-[#282c3f] text-[12px] font-semibold px-2.5 py-1 bg-white hover:border-primary transition-colors">
                      "{searchQuery}"
                      <button onClick={() => dispatch(setSearchQuery(""))} className="text-[#94969f] hover:text-primary font-bold leading-none">×</button>
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 border border-[#d4d5d9] px-4 py-2 text-[13px] font-semibold text-[#282c3f]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-12">
                {[...Array(LIMIT)].map((_, i) => (
                  <div key={i} className="bg-[#f5f5f6] aspect-[3/4] animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-primary font-semibold text-lg">{error}</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-12 p-5 mt-3 border-t border-[#eaeaec] shadow-[0_-1px_8px_rgba(0,0,0,0.03)]">
                  {filteredProducts.map((product, i) => (
                    <div key={product.id} style={{ animationDelay: `${i * 0.03}s` }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
                <Pagination pagination={pagination} page={page} onPage={handlePage} />
                {pagination && (
                  <p className="text-center text-xs text-[#94969f] mt-3">
                    Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total} products
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94969f" strokeWidth="1.2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <h2 className="text-xl font-bold text-[#282c3f] mt-4">No products found</h2>
                <p className="text-[#94969f] mt-1 text-sm">Try adjusting your filters or search term</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-5 bg-primary text-white px-6 py-2.5 text-sm font-bold hover:bg-primary-hover transition-colors"
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