"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Star,
  ShoppingBag,
  Heart,
  Sparkles,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  discountPrice?: number;
  images: string[];
  rating: number;
  numReviews: number;
  stockQuantity: number;
}

interface Category {
  id: string;
  name: string;
  image: string;
}

export default function HomePage() {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Categories
      const catSnap = await getDocs(collection(db, "categories"));
      const catList: Category[] = [];
      catSnap.forEach((doc) => {
        catList.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(catList);

      // Fetch Featured Products (high rating, limit 8)
      const prodQuery = query(collection(db, "products"), limit(8));
      const prodSnap = await getDocs(prodQuery);
      const prodList: Product[] = [];
      prodSnap.forEach((doc) => {
        prodList.push({ id: doc.id, ...doc.data() } as Product);
      });
      setFeaturedProducts(prodList);
    } catch (error) {
      console.error("Error fetching homepage data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed?secret=seed_secret_123");
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchData();
      } else {
        alert("Failed to seed: " + data.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSeeding(false);
    }
  };

  const features = [
    {
      icon: <Truck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      title: "Free Express Delivery",
      desc: "On all orders above ₹50,000",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      title: "Secure Payments",
      desc: "100% protected checkout",
    },
    {
      icon: <RotateCcw className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      title: "Easy Returns",
      desc: "7-day hassle-free returns",
    },
    {
      icon: <Headphones className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      title: "24/7 Tech Support",
      desc: "Expert assistance anytime",
    },
  ];

  const testimonials = [
    {
      name: "Aravind Sharma",
      role: "Verified Buyer",
      comment: "The MacBook Pro M3 Max is absolute lightning. The delivery was incredibly fast and the packaging was extremely secure. VoltElectro has won me over!",
      rating: 5,
    },
    {
      name: "Priya Nair",
      role: "Tech Enthusiast",
      comment: "Superb customer service. I opted for the 'Contact Before Payment' model for my Sony OLED TV. The admin contacted me, verified stock, and arranged delivery perfectly.",
      rating: 5,
    },
    {
      name: "Rohan Das",
      role: "Verified Buyer",
      comment: "Best prices on flagship phones. Got my S24 Ultra with a coupon discount of ₹5,000. Very happy with the seamless checkout process.",
      rating: 5,
    },
  ];

  return (
    <div className="w-full space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-zinc-950 text-white py-20 sm:py-32">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Text Details */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next-Gen Tech Arrival</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
                The Next Generation of <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Tech & Innovation</span> is Here
              </h1>
              <p className="text-base sm:text-lg text-zinc-400 max-w-xl">
                Experience premium shopping with VoltElectro. Explore flagship smartphones, beastly creator laptops, high-fidelity audio, and smart home appliances.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 font-semibold transition-colors shadow-lg shadow-indigo-600/25 text-sm"
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {featuredProducts.length === 0 && (
                  <button
                    onClick={handleSeed}
                    disabled={seeding}
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 font-semibold transition-colors text-sm border border-zinc-700"
                  >
                    {seeding ? "Seeding..." : "Seed Demo Products"}
                  </button>
                )}
              </div>
            </div>

            {/* Featured Hero Banner Image */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-4 flex items-center justify-center">
                {/* Visual Glass Card */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-50" />
                <img
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80"
                  alt="Premium Macbook Pro"
                  className="w-full h-auto object-contain rounded-2xl shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Value Propositions */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm"
            >
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
                {feat.icon}
              </div>
              <div>
                <h4 className="font-semibold text-zinc-950 dark:text-white text-sm">{feat.title}</h4>
                <p className="text-xs text-zinc-500 mt-1">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white">Shop by Category</h2>
            <p className="text-xs sm:text-sm text-zinc-500">Find exactly what you need in our curated collections</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-zinc-200 dark:bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group relative flex flex-col items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center hover:border-indigo-500 hover:shadow-md transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden mb-3 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-full">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. Featured Products Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white">Featured Products</h2>
            <p className="text-xs sm:text-sm text-zinc-500">Our highest rated and most popular hardware</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-200 dark:bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <ShoppingBag className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No products found</h3>
            <p className="text-sm text-zinc-500 mt-1">We need to seed the database with demo products to display them here.</p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 text-sm font-semibold transition-colors"
            >
              {seeding ? "Seeding..." : "Seed Demo Products Now"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => {
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
                  {/* Image Container */}
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
                    {/* Wishlist Button */}
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
                        className="inline-flex items-center justify-center p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500"
                        title="Add to Cart"
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
      </section>

      {/* 5. Offers / Promo Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Banner 1 */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-8 sm:p-12 shadow-md">
            <div className="relative z-10 space-y-4 max-w-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200 bg-white/10 px-3 py-1 rounded-full">Limited Offer</span>
              <h3 className="text-2xl sm:text-3xl font-bold">Upgrade to Premium Audio</h3>
              <p className="text-sm text-indigo-100">Enjoy pure immersive sound with top-tier active noise-cancelling headphones.</p>
              <Link
                href="/products?category=Accessories"
                className="inline-flex items-center gap-1.5 rounded-full bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-2 text-xs font-bold transition-colors shadow-sm"
              >
                Shop Audio
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-30 md:opacity-100 flex items-center justify-center p-4">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80"
                alt="Premium Audio Banner"
                className="w-full h-auto object-contain max-h-48 transform rotate-12"
              />
            </div>
          </div>

          {/* Banner 2 */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 to-zinc-800 text-white p-8 sm:p-12 shadow-md border border-zinc-800">
            <div className="relative z-10 space-y-4 max-w-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">New Arrival</span>
              <h3 className="text-2xl sm:text-3xl font-bold">Smart Wearables</h3>
              <p className="text-sm text-zinc-400">Track your health, receive alerts, and stay connected with Apple Watch Ultra 2.</p>
              <Link
                href="/products?category=Smart%20Devices"
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 px-5 py-2 text-xs font-bold transition-colors shadow-sm"
              >
                Explore Wearables
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-30 md:opacity-100 flex items-center justify-center p-4">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80"
                alt="Smartwatch Banner"
                className="w-full h-auto object-contain max-h-48 transform -rotate-12"
              />
            </div>
          </div>

        </div>
      </section>

      {/* 6. Customer Reviews Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white">What Our Customers Say</h2>
          <p className="text-xs sm:text-sm text-zinc-500">Read verified experiences from our tech community</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((test, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: test.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4" fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                  "{test.comment}"
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                  {test.name.charAt(0)}
                </div>
                <div>
                  <h5 className="font-semibold text-sm text-zinc-900 dark:text-white">{test.name}</h5>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{test.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
