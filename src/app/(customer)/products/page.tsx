"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import { Star, ShoppingBag, Heart, SlidersHorizontal, ArrowUpDown, Search, X } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  images: string[];
  rating: number;
  numReviews: number;
  createdAt: string;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter States
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 400000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [onlyDiscounted, setOnlyDiscounted] = useState(searchParams.get("discount") === "true");
  const [sortBy, setSortBy] = useState("newest");

  // Sync search and category from URL
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setSelectedCategory(searchParams.get("category") || "All");
    setOnlyDiscounted(searchParams.get("discount") === "true");
  }, [searchParams]);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "products"));
        const list: Product[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(list);
      } catch (e) {
        console.error("Error fetching products:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Unique Brands & Categories for filter panels
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(cats)];
  }, [products]);

  const brands = useMemo(() => {
    const bnds = new Set(products.map((p) => p.brand));
    return ["All", ...Array.from(bnds)];
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // 2. Category filter
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // 3. Brand filter
    if (selectedBrand !== "All") {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    // 4. Price filter
    result = result.filter((p) => {
      const price = p.discountPrice || p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // 5. In Stock filter
    if (inStockOnly) {
      result = result.filter((p) => p.stockQuantity > 0);
    }

    // 6. Rating filter
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    // 7. Discount filter
    if (onlyDiscounted) {
      result = result.filter((p) => !!p.discountPrice);
    }

    // 8. Sorting
    result.sort((a, b) => {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;

      if (sortBy === "price-low") return priceA - priceB;
      if (sortBy === "price-high") return priceB - priceA;
      if (sortBy === "rating") return b.rating - a.rating;
      
      // Default: Newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [products, search, selectedCategory, selectedBrand, priceRange, inStockOnly, minRating, onlyDiscounted, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedBrand("All");
    setPriceRange([0, 400000]);
    setInStockOnly(false);
    setMinRating(0);
    setOnlyDiscounted(false);
    setSortBy("newest");
    router.push("/products");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col gap-6">
      {/* Top Header & Search Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Product Catalog</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {loading ? "Loading products..." : `Showing ${filteredProducts.length} premium items`}
          </p>
        </div>

        {/* Sort and Mobile Filter Toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-48 appearance-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 pr-10 text-sm outline-none focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Best Rated</option>
            </select>
            <ArrowUpDown className="absolute right-3.5 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Panel */}
        <aside className="hidden md:flex flex-col gap-6 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-20">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="h-4.5 w-4.5" />
              Filter Products
            </h3>
            <button onClick={clearFilters} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Clear All
            </button>
          </div>

          {/* Search Input inside Filters */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Search</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 pl-8 text-xs outline-none focus:border-indigo-500"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:border-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:border-indigo-500"
            >
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Max Price</label>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                ₹{priceRange[1].toLocaleString("en-IN")}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={400000}
              step={5000}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full accent-indigo-600 cursor-pointer h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none"
            />
          </div>

          {/* Ratings Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Min Rating</label>
            <div className="flex gap-1">
              {[0, 3, 4].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className={`flex-1 py-1 px-2 text-[10px] sm:text-xs font-bold rounded-lg border transition-colors ${
                    minRating === rating
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  {rating === 0 ? "All" : `${rating}★ +`}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-900">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>In Stock Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={onlyDiscounted}
                onChange={(e) => setOnlyDiscounted(e.target.checked)}
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>Discounted Only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-200 dark:bg-zinc-900 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <ShoppingBag className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No products match filters</h3>
              <p className="text-sm text-zinc-500 mt-1">Try resetting your search query or adjusting the filters.</p>
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 text-sm font-semibold transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => {
                const activePrice = prod.discountPrice || prod.price;
                const hasDiscount = !!prod.discountPrice;
                const discountPercent = hasDiscount
                  ? Math.round(((prod.price - prod.discountPrice!) / prod.price) * 100)
                  : 0;

                return (
                  <div
                    key={prod.id}
                    className="group relative flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                      <img
                        src={prod.images?.[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {hasDiscount && (
                        <span className="absolute top-3 left-3 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white">
                          {discountPercent}% OFF
                        </span>
                      )}
                      {/* Wishlist */}
                      <button
                        onClick={() => toggleWishlist(prod.id)}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                          isInWishlist(prod.id)
                            ? "bg-rose-500 text-white"
                            : "bg-white/80 dark:bg-zinc-950/80 text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-950 hover:text-rose-500"
                        }`}
                      >
                        <Heart className="h-4 w-4" fill={isInWishlist(prod.id) ? "currentColor" : "none"} />
                      </button>
                    </div>

                    {/* Details */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">
                        {prod.brand} • {prod.category}
                      </div>
                      <Link href={`/products/${prod.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                        <h3 className="font-semibold text-zinc-900 dark:text-white line-clamp-1 text-sm sm:text-base">
                          {prod.name}
                        </h3>
                      </Link>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-2 mb-3">
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className="h-3.5 w-3.5"
                              fill={idx < Math.floor(prod.rating) ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-zinc-500">({prod.numReviews})</span>
                      </div>

                      {/* Price & Add to Cart */}
                      <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          {hasDiscount && (
                            <span className="text-xs text-zinc-400 line-through">₹{prod.price.toLocaleString("en-IN")}</span>
                          )}
                          <span className="font-bold text-zinc-900 dark:text-white text-base sm:text-lg">
                            ₹{activePrice.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <button
                          onClick={() => addToCart(prod, 1)}
                          disabled={prod.stockQuantity <= 0}
                          className="inline-flex items-center justify-center p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 animate-out duration-200"
                        >
                          <ShoppingBag className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Slide-out Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />

          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white dark:bg-zinc-950 p-6 shadow-xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900 mb-6">
              <h3 className="font-bold text-zinc-900 dark:text-white">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs outline-none"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs outline-none"
                >
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Max Price</label>
                  <span className="font-semibold text-indigo-600">₹{priceRange[1].toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={400000}
                  step={5000}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Min Rating</label>
                <div className="flex gap-1">
                  {[0, 3, 4].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                        minRating === rating
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {rating === 0 ? "All" : `${rating}★ +`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>In Stock Only</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={onlyDiscounted}
                    onChange={(e) => setOnlyDiscounted(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Discounted Only</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-zinc-200 text-zinc-700 text-center"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 text-white text-center"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
