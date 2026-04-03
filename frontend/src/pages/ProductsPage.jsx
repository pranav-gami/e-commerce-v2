import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchProducts } from '../data/products';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectSearchQuery, setSearchQuery } from '../redux/slices/searchSlice';
import { initInventory } from '../redux/slices/inventorySlice';
import ProductCard from '../components/ProductCard';
import { trackSearch } from '../utils/analytics';
import api from '../utils/api';
import Slider from '@mui/material/Slider';

const LIMIT = 40;

//Pagination
const Pagination = ({ pagination, page, onPage }) => {
    if (!pagination || pagination.totalPages <= 1) return null;
    const { totalPages, hasNextPage, hasPrevPage } = pagination;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
        else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    return (
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-8 flex-wrap">
            <button
                onClick={() => onPage(page - 1)}
                disabled={!hasPrevPage}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-[#d4d5d9] bg-white text-[#94969f] hover:border-[#ff3f6c] hover:text-[#ff3f6c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                p === '...' ? (
                    <span
                        key={`d${i}`}
                        className="w-8 h-8 flex items-center justify-center text-[#94969f] text-sm"
                    >
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPage(p)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border text-sm font-bold transition-colors ${
                            p === page
                                ? 'bg-[#ff3f6c] text-white border-[#ff3f6c]'
                                : 'bg-white border-[#d4d5d9] text-[#282c3f] hover:border-[#ff3f6c] hover:text-[#ff3f6c]'
                        }`}
                    >
                        {p}
                    </button>
                ),
            )}
            <button
                onClick={() => onPage(page + 1)}
                disabled={!hasNextPage}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-[#d4d5d9] bg-white text-[#94969f] hover:border-[#ff3f6c] hover:text-[#ff3f6c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

//Sort Dropdown
const SORT_OPTIONS = [
    { value: '', label: 'Recommended' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name_asc', label: 'Name: A → Z' },
    { value: 'name_desc', label: 'Name: Z → A' },
];

const SortDropdown = ({ sortBy, setSortBy }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = e => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const currentLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Recommended';

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                className="flex items-center gap-2 border border-[#d4d5d9] px-3 sm:px-4 py-2 sm:py-2.5 text-[12px] sm:text-[13px] font-semibold text-[#282c3f] bg-white hover:border-[#282c3f] transition-colors min-w-[140px] sm:min-w-[200px] justify-between"
                onClick={() => setOpen(o => !o)}
            >
                <span>
                    <span className="text-[#94969f] font-normal hidden sm:inline">Sort by: </span>
                    <span className="sm:hidden text-[#94969f] font-normal">Sort: </span>
                    {currentLabel}
                </span>
                <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#282c3f"
                    strokeWidth="2.5"
                    className={`transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            {open && (
                <div className="absolute right-0 top-full z-50 bg-white border border-[#d4d5d9] shadow-lg min-w-[180px] sm:min-w-[200px] py-1">
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                setSortBy(opt.value);
                                setOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                                sortBy === opt.value
                                    ? 'bg-[#fff0f3] text-[#ff3f6c] font-semibold'
                                    : 'text-[#282c3f] hover:bg-[#f5f5f6]'
                            }`}
                        >
                            {opt.label}
                            {sortBy === opt.value && (
                                <span className="float-right text-[#ff3f6c]">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const SortModal = ({ sortBy, setSortBy, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-end">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            {/* Sheet */}
            <div className="relative bg-white w-full rounded-t-2xl shadow-2xl">
                <div className="p-4 border-b border-[#eaeaec] font-bold text-[#282c3f]">
                    Sort By
                </div>

                <div className="py-2">
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                setSortBy(opt.value);
                                onClose();
                            }}
                            className={`w-full text-left px-4 py-3 text-[14px] ${
                                sortBy === opt.value
                                    ? 'text-[#ff3f6c] font-semibold bg-[#fff0f3]'
                                    : 'text-[#282c3f]'
                            }`}
                        >
                            {opt.label}
                            {sortBy === opt.value && <span className="float-right">✓</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

//More Items Modal
const MoreModal = ({ title, items, selectedItems, onToggle, onClose }) => {
    const [search, setSearch] = useState('');
    const filtered = items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white w-full sm:w-[480px] max-h-[85vh] sm:max-h-[70vh] flex flex-col shadow-2xl rounded-t-2xl sm:rounded-none">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#eaeaec]">
                    <h3 className="text-[15px] font-extrabold text-[#282c3f] uppercase tracking-[0.8px]">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-[#94969f] hover:text-[#282c3f] bg-transparent border-none cursor-pointer"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="px-5 py-3 border-b border-[#eaeaec]">
                    <div className="flex items-center gap-2 border border-[#d4d5d9] px-3 py-2">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#94969f"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder={`Search ${title}`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 text-[13px] text-[#282c3f] outline-none placeholder:text-[#94969f] bg-transparent border-none"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 px-5 py-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                        {filtered.map(item => (
                            <label
                                key={item.id}
                                className="flex items-center gap-2.5 cursor-pointer group"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.id)}
                                    onChange={() => onToggle(item.id)}
                                    className="accent-[#ff3f6c] w-3.5 h-3.5 flex-shrink-0"
                                />
                                <span className="text-[13px] text-[#282c3f] group-hover:text-[#ff3f6c] transition-colors truncate">
                                    {item.name}
                                </span>
                            </label>
                        ))}
                        {filtered.length === 0 && (
                            <p className="col-span-2 text-[13px] text-[#94969f] text-center py-4">
                                No results found
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#eaeaec]">
                    <span className="text-[12px] text-[#94969f]">
                        {selectedItems.length} selected
                    </span>
                    <button
                        onClick={onClose}
                        className="bg-[#ff3f6c] text-white px-6 py-2 text-[13px] font-bold hover:bg-[#e8365d] transition-colors border-none cursor-pointer"
                    >
                        APPLY
                    </button>
                </div>
            </div>
        </div>
    );
};

//Price Slider
const PriceSlider = ({ onCommit, catMinPrice, catMaxPrice, priceRange }) => {
    const min = catMinPrice ?? 0;
    const max = catMaxPrice ?? 8000;
    const [local, setLocal] = useState([min, max]);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!isDragging) {
            const committed = [
                priceRange.min ? Number(priceRange.min) : min,
                priceRange.max ? Number(priceRange.max) : max,
            ];
            setLocal(committed);
        }
    }, [min, max, priceRange.min, priceRange.max]);

    return (
        <div className="px-2">
            <Slider
                sx={{
                    color: '#ff3f6c',
                    height: 4,
                    '& .MuiSlider-thumb': { height: 16, width: 16, backgroundColor: '#ff3f6c' },
                    '& .MuiSlider-track': { border: 'none' },
                    '& .MuiSlider-rail': { opacity: 0.3, backgroundColor: '#ccc' },
                    '& .MuiSlider-valueLabel': { fontSize: 11, background: '#ff3f6c' },
                }}
                value={local}
                min={min}
                max={max}
                step={1}
                onChange={(_, v) => {
                    setIsDragging(true);
                    setLocal(v);
                }}
                onChangeCommitted={(_, v) => {
                    setIsDragging(false);
                    setLocal(v); // lock thumb to final drag position
                    onCommit({ min: String(v[0]), max: String(v[1]) });
                }}
                valueLabelDisplay="auto"
                valueLabelFormat={v => `₹${v.toLocaleString('en-IN')}`}
            />
            <div className="flex justify-between text-[11px] text-[#94969f] -mt-1">
                <span>₹{local[0].toLocaleString('en-IN')}</span>
                <span>₹{local[1].toLocaleString('en-IN')}</span>
            </div>
        </div>
    );
};

//Scroll to top
const ScrollToTopBtn = () => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const fn = () => setVisible(window.scrollY > 400);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);
    if (!visible) return null;
    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-50 w-10 h-10 bg-[#ff3f6c] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#e8365d] transition-all hover:scale-110 active:scale-95 border-none cursor-pointer"
        >
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
            >
                <polyline points="18 15 12 9 6 15" />
            </svg>
        </button>
    );
};

//Breadcrumb
const Breadcrumb = ({
    categories,
    selectedCategory,
    selectedSubcategory,
    subcategories,
    searchQuery,
}) => {
    const cat = selectedCategory.length
        ? categories.find(c => String(c.id) === String(selectedCategory[0]))
        : null;
    const sub = selectedSubcategory.length
        ? subcategories.find(s => String(s.id) === String(selectedSubcategory[0]))
        : null;
    const Sep = () => (
        <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94969f"
            strokeWidth="2"
            className="flex-shrink-0"
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
    return (
        <nav className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-[#94969f] mb-3 sm:mb-4 flex-wrap">
            <Link to="/" className="hover:text-[#ff3f6c] transition-colors">
                Home
            </Link>
            <Sep />
            <Link to="/products" className="hover:text-[#ff3f6c] transition-colors">
                Products
            </Link>
            {cat && (
                <>
                    <Sep />
                    <Link
                        to={`/products?category=${cat.id}`}
                        className="hover:text-[#ff3f6c] transition-colors"
                    >
                        {cat.name}
                    </Link>
                </>
            )}
            {sub && (
                <>
                    <Sep />
                    <span className="font-semibold text-[#282c3f]">{sub.name}</span>
                </>
            )}
            {!cat && searchQuery && (
                <>
                    <Sep />
                    <span className="font-semibold text-[#282c3f]">"{searchQuery}"</span>
                </>
            )}
        </nav>
    );
};

//Filter Pill
const FilterPill = ({ label, onRemove }) => (
    <span className="flex items-center gap-1.5 border border-[#d4d5d9] rounded-full text-[#282c3f] text-[11px] sm:text-[12px] font-semibold px-2.5 py-1 bg-white hover:border-[#ff3f6c] transition-colors">
        {label}
        <button
            onClick={onRemove}
            className="text-[#94969f] hover:text-[#ff3f6c] font-bold leading-none bg-transparent border-none cursor-pointer p-0"
        >
            ×
        </button>
    </span>
);

//Main ProductsPage
const ProductsPage = () => {
    const dispatch = useAppDispatch();
    const searchQuery = useAppSelector(selectSearchQuery);
    const [searchParams] = useSearchParams();

    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [catMinPrice, setCatMinPrice] = useState(0);
    const [catMaxPrice, setCatMaxPrice] = useState(8000);
    const [availableDiscounts, setAvailableDiscounts] = useState([10, 20, 30, 40, 50]);
    const [sliderKey, setSliderKey] = useState(0);

    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
    const [sortModalOpen, setSortModalOpen] = useState(false);
    const toggleValue = (value, setter) =>
        setter(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]));

    const [selectedCategory, setSelectedCategory] = useState(
        searchParams.get('category') ? [searchParams.get('category')] : [],
    );
    const [selectedSubcategory, setSelectedSubcategory] = useState([]);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('');
    const [discountOnly, setDiscountOnly] = useState(false);
    const [minDiscount, setMinDiscount] = useState(null);

    //Sync category from URL
    useEffect(() => {
        const cat = searchParams.get('category') || '';
        setSelectedCategory(cat ? [cat] : []);
        setPage(1);
    }, [searchParams]);

    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch) dispatch(setSearchQuery(urlSearch));
    }, []);

    //Load categories
    useEffect(() => {
        api.get('/categories')
            .then(res => setCategories(res.data.data?.categories || []))
            .catch(console.error);
    }, []);

    //Load subcategories
    useEffect(() => {
        if (!selectedCategory.length) {
            setSubcategories([]);
            setSelectedSubcategory([]);
            return;
        }
        Promise.all(
            selectedCategory.map(catId =>
                api
                    .get(`/subcategories?categoryId=${catId}`)
                    .then(res => res.data.data?.subCategories || []),
            ),
        )
            .then(results => {
                const seen = new Set();
                const unique = results.flat().filter(s => {
                    if (seen.has(s.id)) return false;
                    seen.add(s.id);
                    return true;
                });
                setSubcategories(unique);
                setSelectedSubcategory(prev =>
                    prev.filter(id => unique.some(s => String(s.id) === String(id))),
                );
            })
            .catch(console.error);
    }, [selectedCategory]);

    //Load filter meta from backend whenever category/subcategory changes
    useEffect(() => {
        const query = new URLSearchParams();
        selectedCategory.forEach(id => query.append('categoryId', id));
        selectedSubcategory.forEach(id => query.append('subCategoryId', id));

        api.get(`/products/filter-meta?${query.toString()}`)
            .then(res => {
                const { minPrice, maxPrice, availableDiscounts: discounts } = res.data.data;
                setCatMinPrice(minPrice ?? 0);
                setCatMaxPrice(maxPrice ?? 8000);
                setAvailableDiscounts(discounts?.length ? discounts : [10, 20, 30, 40, 50]);
                // Reset dependent filters and force slider remount
                setPriceRange({ min: '', max: '' });
                setMinDiscount(null);
                setSliderKey(k => k + 1);
            })
            .catch(() => {});
    }, [selectedCategory, selectedSubcategory]);

    //Load products
    const loadProducts = useCallback(
        async p => {
            try {
                setLoading(true);
                setError(null);
                const result = await fetchProducts({
                    page: p,
                    limit: LIMIT,
                    categoryId: selectedCategory.length ? selectedCategory.join(',') : undefined,
                    subCategoryId: selectedSubcategory.length
                        ? selectedSubcategory.join(',')
                        : undefined,
                    search: searchQuery.trim() || undefined,
                    priceMin: priceRange.min || undefined,
                    priceMax: priceRange.max || undefined,
                    minDiscount: minDiscount ?? undefined,
                    discountOnly: discountOnly || undefined,
                    sortBy: sortBy || undefined,
                });
                setProducts(result.products);
                setPagination(result.pagination);
                dispatch(initInventory(result.products));
            } catch {
                setError('Failed to load products.');
            } finally {
                setLoading(false);
            }
        },
        [
            selectedCategory,
            selectedSubcategory,
            searchQuery,
            priceRange,
            minDiscount,
            discountOnly,
            sortBy,
            dispatch,
        ],
    );

    useEffect(() => {
        setPage(1);
        loadProducts(1);
    }, [
        selectedCategory,
        selectedSubcategory,
        searchQuery,
        priceRange.min,
        priceRange.max,
        minDiscount,
        discountOnly,
        sortBy,
    ]);

    const handlePage = p => {
        setPage(p);
        loadProducts(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        if (searchQuery.trim()) trackSearch(searchQuery, products.length);
    }, [searchQuery, products.length]);

    const handleClearFilters = () => {
        setSelectedCategory([]);
        setSelectedSubcategory([]);
        setPriceRange({ min: '', max: '' });
        setSortBy('');
        setDiscountOnly(false);
        setMinDiscount(null);
        dispatch(setSearchQuery(''));
    };

    const categoryName = useMemo(() => {
        if (!categories?.length || !selectedCategory?.length) return '';
        return selectedCategory
            .map(id => categories.find(c => String(c.id) === String(id))?.name || '')
            .filter(Boolean)
            .join(', ');
    }, [categories, selectedCategory]);

    useEffect(() => {
        let title = 'Buy Latest Fashion Online at Best Prices | Shop.in';
        if (categoryName) title = `${categoryName} | Buy ${categoryName} Online | Shop.in`;
        else if (searchQuery) title = `"${searchQuery}" | Shop.in`;
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

    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    //Sidebar sections
    const FilterSection = ({ title, children }) => (
        <div className="border-b border-[#eaeaec]">
            <div className="py-3.5">
                <span className="text-[13px] font-extrabold text-[#282c3f] uppercase tracking-[0.8px]">
                    {title}
                </span>
            </div>
            <div className="pb-4">{children}</div>
        </div>
    );

    const SidebarContent = () => (
        <div>
            <div className="flex items-center justify-between py-3.5 border-b border-[#eaeaec]">
                <h3 className="text-[15px] font-semibold text-[#282c3f] uppercase tracking-[0.8px] m-0">
                    Filters
                </h3>
                {hasActiveFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="text-[13px] font-semibold text-[#ff3f6c] hover:underline uppercase tracking-wide bg-transparent border-none cursor-pointer"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Category */}
            <FilterSection title="Category">
                <div className="space-y-2.5">
                    {categories.slice(0, 8).map(cat => (
                        <label
                            key={cat.id}
                            className="flex items-center gap-2.5 cursor-pointer group"
                        >
                            <input
                                type="checkbox"
                                checked={selectedCategory.includes(String(cat.id))}
                                onChange={() => toggleValue(String(cat.id), setSelectedCategory)}
                                className="accent-[#ff3f6c] w-3.5 h-3.5"
                            />
                            <span className="text-[13px] text-[#282c3f] group-hover:text-[#ff3f6c] transition-colors">
                                {cat.name}
                            </span>
                        </label>
                    ))}
                    {categories.length > 8 && (
                        <button
                            onClick={() => setCategoryModalOpen(true)}
                            className="text-[13px] text-[#ff3f6c] font-semibold hover:underline bg-transparent border-none cursor-pointer p-0"
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
                        {subcategories.slice(0, 8).map(sub => (
                            <label
                                key={sub.id}
                                className="flex items-center gap-2.5 cursor-pointer group"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedSubcategory.includes(String(sub.id))}
                                    onChange={() =>
                                        toggleValue(String(sub.id), setSelectedSubcategory)
                                    }
                                    className="accent-[#ff3f6c] w-3.5 h-3.5"
                                />
                                <span className="text-[13px] text-[#282c3f] group-hover:text-[#ff3f6c] transition-colors">
                                    {sub.name}
                                </span>
                            </label>
                        ))}
                        {subcategories.length > 8 && (
                            <button
                                onClick={() => setSubcategoryModalOpen(true)}
                                className="text-[13px] text-[#ff3f6c] font-semibold hover:underline bg-transparent border-none cursor-pointer p-0"
                            >
                                + {subcategories.length - 8} more
                            </button>
                        )}
                    </div>
                </FilterSection>
            )}

            {/* Price Range — sliderKey forces remount when bounds change */}
            <FilterSection
                title={`Price Range (₹${catMinPrice.toLocaleString('en-IN')} – ₹${catMaxPrice.toLocaleString('en-IN')})`}
            >
                <PriceSlider
                    key={sliderKey}
                    catMinPrice={catMinPrice}
                    catMaxPrice={catMaxPrice}
                    priceRange={priceRange}
                    onCommit={setPriceRange}
                />
                {(priceRange.min || priceRange.max) && (
                    <p className="text-[11px] text-[#ff3f6c] mt-2 font-semibold">
                        ₹{priceRange.min || catMinPrice} – ₹{priceRange.max || catMaxPrice} applied
                    </p>
                )}
            </FilterSection>

            {/* Discount Range — fully dynamic from backend */}
            <FilterSection title="Discount Range">
                <div className="space-y-2.5">
                    {availableDiscounts.length > 0 ? (
                        availableDiscounts.map(pct => {
                            const isSelected = minDiscount === pct;
                            return (
                                <label
                                    key={pct}
                                    className="flex items-center gap-2.5 cursor-pointer group"
                                    onClick={() => setMinDiscount(isSelected ? null : pct)}
                                >
                                    {/* Custom radio — single click, no double-click needed */}
                                    <span
                                        className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                                            isSelected
                                                ? 'border-[#ff3f6c] bg-[#ff3f6c]'
                                                : 'border-[#94969f] bg-white group-hover:border-[#ff3f6c]'
                                        }`}
                                    >
                                        {isSelected && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                                        )}
                                    </span>
                                    <span className="text-[13px] text-[#282c3f] group-hover:text-[#ff3f6c] transition-colors select-none">
                                        {pct}% and above
                                    </span>
                                </label>
                            );
                        })
                    ) : (
                        <p className="text-[12px] text-[#94969f]">
                            {selectedCategory.length > 0
                                ? 'No discounts available in this category'
                                : 'Select a category to see discounts'}
                        </p>
                    )}
                </div>
            </FilterSection>

            {/* Offers */}
            <FilterSection title="Offers">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={discountOnly}
                        onChange={e => setDiscountOnly(e.target.checked)}
                        className="accent-[#ff3f6c] w-3.5 h-3.5"
                    />
                    <span className="text-[13px] text-[#282c3f] group-hover:text-[#ff3f6c] transition-colors">
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
                    onToggle={id => toggleValue(id, setSelectedCategory)}
                    onClose={() => setCategoryModalOpen(false)}
                />
            )}
            {subcategoryModalOpen && (
                <MoreModal
                    title="Subcategory"
                    items={subcategories.map(s => ({ ...s, id: String(s.id) }))}
                    selectedItems={selectedSubcategory}
                    onToggle={id => toggleValue(id, setSelectedSubcategory)}
                    onClose={() => setSubcategoryModalOpen(false)}
                />
            )}
            {sortModalOpen && (
                <SortModal
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    onClose={() => setSortModalOpen(false)}
                />
            )}
            <div className="w-full px-3 sm:px-5 lg:px-10 xl:px-14 py-4 sm:py-5 pb-20 sm:pb-5">
                <Breadcrumb
                    categories={categories}
                    selectedCategory={selectedCategory}
                    selectedSubcategory={selectedSubcategory}
                    subcategories={subcategories}
                    searchQuery={searchQuery}
                />
                <div className="flex items-baseline gap-2 flex-wrap mb-4 sm:mb-5">
                    <h3 className="text-[15px] sm:text-[17px] font-bold text-[#282c3f] m-0">
                        {categoryName || (searchQuery ? `"${searchQuery}"` : 'All Products')}
                    </h3>
                    {!loading && pagination && (
                        <span className="text-[14px] sm:text-[17px] text-[#94969f]">
                            — {pagination.total} items
                        </span>
                    )}
                </div>
                <div className="flex gap-0 relative">
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    {/* Desktop sidebar */}
                    <div className="hidden lg:block w-[200px] xl:w-[220px] flex-shrink-0">
                        <div
                            className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2"
                            style={{ scrollbarWidth: 'none' }}
                        >
                            <SidebarContent />
                        </div>
                    </div>

                    {/* Mobile sidebar */}
                    <aside
                        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] sm:w-[320px] bg-white overflow-y-auto transition-transform duration-300 shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-[#eaeaec] sticky top-0 bg-white z-10">
                            <span className="font-extrabold text-[#282c3f]">Filters</span>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="bg-transparent border-none cursor-pointer p-1"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#282c3f"
                                    strokeWidth="2"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 pb-8">
                            <SidebarContent />
                        </div>
                    </aside>

                    <div className="hidden lg:block w-px bg-[#eaeaec] flex-shrink-0" />

                    {/* Main content */}
                    <div className="flex-1 min-w-0 lg:pl-4">
                        {/* Toolbar */}
                        <div className="hidden lg:flex items-start justify-between gap-2 sm:gap-4 flex-wrap mb-2">
                            {' '}
                            {hasActiveFilters && (
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    {selectedCategory.map(catId => {
                                        const cat = categories.find(
                                            c => String(c.id) === String(catId),
                                        );
                                        return cat ? (
                                            <FilterPill
                                                key={catId}
                                                label={cat.name}
                                                onRemove={() =>
                                                    toggleValue(catId, setSelectedCategory)
                                                }
                                            />
                                        ) : null;
                                    })}
                                    {selectedSubcategory.map(subId => {
                                        const sub = subcategories.find(
                                            s => String(s.id) === String(subId),
                                        );
                                        return sub ? (
                                            <FilterPill
                                                key={subId}
                                                label={sub.name}
                                                onRemove={() =>
                                                    toggleValue(
                                                        String(subId),
                                                        setSelectedSubcategory,
                                                    )
                                                }
                                            />
                                        ) : null;
                                    })}
                                    {discountOnly && (
                                        <FilterPill
                                            label="Offers"
                                            onRemove={() => setDiscountOnly(false)}
                                        />
                                    )}
                                    {minDiscount !== null && (
                                        <FilterPill
                                            label={`${minDiscount}% and above`}
                                            onRemove={() => setMinDiscount(null)}
                                        />
                                    )}
                                    {(priceRange.min || priceRange.max) && (
                                        <FilterPill
                                            label={`₹${priceRange.min || '0'} – ₹${priceRange.max || '∞'}`}
                                            onRemove={() => {
                                                setPriceRange({ min: '', max: '' });
                                                setSliderKey(k => k + 1);
                                            }}
                                        />
                                    )}
                                    {searchQuery && (
                                        <FilterPill
                                            label={`"${searchQuery}"`}
                                            onRemove={() => dispatch(setSearchQuery(''))}
                                        />
                                    )}
                                </div>
                            )}
                            <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-shrink-0">
                                <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="lg:hidden flex items-center gap-1.5 border border-[#d4d5d9] px-3 py-2 sm:px-4 sm:py-2.5 text-[12px] sm:text-[13px] font-semibold text-[#282c3f] bg-white hover:border-[#282c3f] transition-colors"
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
                                    </svg>
                                    Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                                </button>
                            </div>
                        </div>

                        {/* Grid */}
                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mt-3">
                                {[...Array(LIMIT)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-[#f5f5f6] animate-pulse rounded-sm"
                                        style={{ aspectRatio: '3/4' }}
                                    />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <p className="text-[#ff3f6c] font-semibold text-lg">{error}</p>
                            </div>
                        ) : products.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mt-3 pt-3 border-t border-[#eaeaec]">
                                    {products.map((product, i) => (
                                        <div
                                            key={product.id}
                                            style={{ animationDelay: `${i * 0.03}s` }}
                                        >
                                            <ProductCard product={product} />
                                        </div>
                                    ))}
                                </div>
                                <Pagination
                                    pagination={pagination}
                                    page={page}
                                    onPage={handlePage}
                                />
                                {pagination && (
                                    <p className="text-center text-xs text-[#94969f] mt-3">
                                        Showing {(page - 1) * LIMIT + 1}–
                                        {Math.min(page * LIMIT, pagination.total)} of{' '}
                                        {pagination.total} products
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
                                <svg
                                    width="56"
                                    height="56"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#94969f"
                                    strokeWidth="1.2"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <h2 className="text-lg sm:text-xl font-bold text-[#282c3f] mt-4">
                                    No products found
                                </h2>
                                <p className="text-[#94969f] mt-1 text-sm">
                                    Try adjusting your filters or search term
                                </p>
                                <button
                                    onClick={handleClearFilters}
                                    className="mt-5 bg-[#ff3f6c] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#e8365d] transition-colors border-none cursor-pointer"
                                >
                                    CLEAR FILTERS
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* ✅ Mobile Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#eaeaec] flex">
                {/* Sort */}
                <button
                    onClick={() => setSortModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold text-[#282c3f]"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M3 6h18M6 12h12M10 18h4" />
                    </svg>
                    Sort
                </button>

                {/* Divider */}
                <div className="w-px bg-[#eaeaec]" />

                {/* Filter */}
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold text-[#282c3f]"
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
                    </svg>
                    Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                </button>
            </div>
        </div>
    );
};

export default ProductsPage;
