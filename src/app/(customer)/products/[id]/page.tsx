"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, limit, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Star, ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, MessageSquare, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  specifications: Record<string, string>;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  images: string[];
  warrantyDetails: string;
  deliveryInfo: string;
  rating: number;
  numReviews: number;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { user, userData } = useAuth();

  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState("");
  const [loading, setLoading] = useState(true);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        // 1. Fetch Product Doc
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          router.push("/products");
          return;
        }

        const prodData = { id: docSnap.id, ...docSnap.data() } as Product;
        setProduct(prodData);
        if (prodData.images?.length > 0) {
          setActiveImage(prodData.images[0]);
        }

        // 2. Fetch Approved Reviews for this Product
        const revQuery = query(
          collection(db, "reviews"),
          where("productId", "==", id),
          where("status", "==", "approved")
        );
        const revSnap = await getDocs(revQuery);
        const revList: Review[] = [];
        revSnap.forEach((d) => {
          revList.push({ id: d.id, ...d.data() } as Review);
        });
        setReviews(revList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

        // 3. Fetch Related Products (same category, excluding current, limit 4)
        const relQuery = query(
          collection(db, "products"),
          where("category", "==", prodData.category),
          limit(5)
        );
        const relSnap = await getDocs(relQuery);
        const relList: Product[] = [];
        relSnap.forEach((d) => {
          if (d.id !== id) {
            relList.push({ id: d.id, ...d.data() } as Product);
          }
        });
        setRelatedProducts(relList.slice(0, 4));

      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, router]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setReviewError("");
    setSubmittingReview(true);

    if (!reviewComment.trim()) {
      setReviewError("Please write a review comment.");
      setSubmittingReview(false);
      return;
    }

    try {
      const newReview = {
        productId: id,
        userId: user.uid,
        userName: userData?.fullName || user.displayName || "Anonymous Buyer",
        rating: reviewRating,
        comment: reviewComment.trim(),
        status: "approved", // Automatically approved for simplicity in demo, can be set to 'pending'
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "reviews"), newReview);
      
      const submittedReview: Review = {
        id: docRef.id,
        userName: newReview.userName,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: newReview.createdAt,
      };

      // Update local review state
      setReviews((prev) => [submittedReview, ...prev]);
      setReviewComment("");
      setReviewRating(5);
      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Error adding review:", error);
      setReviewError("Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, 1);
      router.push("/cart");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-zinc-200 border-t-indigo-600 animate-spin" />
        <span className="text-sm font-medium text-zinc-500">Loading premium details...</span>
      </div>
    );
  }

  if (!product) return null;

  const activePrice = product.discountPrice || product.price;
  const hasDiscount = !!product.discountPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      
      {/* Product Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden relative flex items-center justify-center p-4">
            <img
              src={activeImage}
              alt={product.name}
              className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-350"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl border-2 bg-white dark:bg-zinc-900 overflow-hidden shrink-0 p-1 flex items-center justify-center transition-all ${
                    activeImage === img ? "border-indigo-600" : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="max-h-full max-w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information Panel */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-500">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{product.brand}</span>
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-zinc-500">SKU: {product.sku}</p>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center text-amber-500">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className="h-4.5 w-4.5"
                    fill={idx < Math.floor(product.rating) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{product.rating}</span>
              <span className="text-xs text-zinc-500">({product.numReviews} Reviews)</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-zinc-900 dark:text-white">
                ₹{activePrice.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <span className="text-lg text-zinc-400 line-through">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {product.stockQuantity > 0 ? (
                <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ● In Stock ({product.stockQuantity} units available)
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-bold text-rose-600">
                  ● Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Short Description */}
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {product.description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => addToCart(product, 1)}
              disabled={product.stockQuantity <= 0}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 py-3 font-semibold transition-colors disabled:border-zinc-300 disabled:text-zinc-400"
            >
              <ShoppingBag className="h-5 w-5" />
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stockQuantity <= 0}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-3 font-semibold transition-colors shadow-lg shadow-indigo-600/10 disabled:bg-zinc-300"
            >
              Buy Now
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`p-3 rounded-xl border-2 transition-colors ${
                isInWishlist(product.id)
                  ? "border-rose-500 bg-rose-500 text-white"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-rose-500 hover:text-rose-500"
              }`}
            >
              <Heart className="h-5.5 w-5.5" fill={isInWishlist(product.id) ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Quick Info Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-500 shrink-0" />
              <span>{product.deliveryInfo}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0" />
              <span>{product.warrantyDetails}</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-indigo-500 shrink-0" />
              <span>7-Day Returns</span>
            </div>
          </div>

        </div>

      </div>

      {/* Technical Specifications & Reviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
        
        {/* Specifications (Left Column) */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Technical Specifications</h3>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
            <table className="w-full text-sm text-left border-collapse">
              <tbody>
                {Object.entries(product.specifications || {}).map(([key, val], idx) => (
                  <tr
                    key={idx}
                    className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-semibold text-zinc-500 dark:text-zinc-400 w-1/3">{key}</td>
                    <td className="px-6 py-3.5 text-zinc-900 dark:text-white">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Reviews (Right Column) */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Customer Reviews</h3>

          {/* Add Review Form */}
          {user ? (
            <form onSubmit={handleAddReview} className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 space-y-4">
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Write a Review</h4>
              
              {reviewError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 text-rose-600 text-xs border border-rose-100">
                  <AlertCircle className="h-4 w-4" />
                  <span>{reviewError}</span>
                </div>
              )}

              {/* Star Rating Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-500">Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-amber-500 hover:scale-110 transition-transform"
                    >
                      <Star className="h-5 w-5" fill={star <= reviewRating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Textarea */}
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 text-xs outline-none focus:border-indigo-500"
              />

              {/* Submit */}
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2 text-xs font-bold transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          ) : (
            <div className="p-5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center">
              <p className="text-xs text-zinc-500">Only registered customers can write product reviews.</p>
              <Link
                href="/login"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Log in to review
              </Link>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {reviews.length === 0 ? (
              <p className="text-xs text-zinc-500 italic text-center py-6">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-semibold text-xs text-zinc-900 dark:text-white">{rev.userName}</h5>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3 w-3" fill={i < rev.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Related Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((prod) => {
              const rPrice = prod.discountPrice || prod.price;
              return (
                <div
                  key={prod.id}
                  className="group relative flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    <img
                      src={prod.images?.[0]}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">
                      {prod.brand}
                    </span>
                    <Link href={`/products/${prod.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                      <h4 className="font-semibold text-zinc-900 dark:text-white text-sm line-clamp-1">{prod.name}</h4>
                    </Link>
                    <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                      <span className="font-bold text-zinc-900 dark:text-white text-sm">
                        ₹{rPrice.toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => addToCart(prod, 1)}
                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
