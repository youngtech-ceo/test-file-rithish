"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trash2, Plus, Minus, Ticket, Percent, Trash, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const {
    cart,
    coupon,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    getCartTotals,
  } = useCart();

  // Local State
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [validating, setValidating] = useState(false);

  const { subtotal, discount, tax, shipping, total } = getCartTotals();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponError("");
    setCouponSuccess("");
    setValidating(true);

    try {
      const codeUpper = couponCode.trim().toUpperCase();
      const docRef = doc(db, "coupons", codeUpper);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setCouponError("Invalid coupon code.");
        applyCoupon(null);
        return;
      }

      const data = docSnap.data();

      // Validate expiry
      if (data.expiryDate && new Date() > new Date(data.expiryDate)) {
        setCouponError("This coupon has expired.");
        applyCoupon(null);
        return;
      }

      // Validate usage limit
      if (data.usedCount >= data.usageLimit) {
        setCouponError("This coupon is no longer available.");
        applyCoupon(null);
        return;
      }

      // Validate minimum purchase amount
      if (subtotal < data.minPurchaseAmount) {
        setCouponError(`Minimum purchase of ₹${data.minPurchaseAmount.toLocaleString()} required.`);
        applyCoupon(null);
        return;
      }

      // Success
      applyCoupon({
        id: docSnap.id,
        code: data.code,
        type: data.type,
        value: data.value,
        minPurchaseAmount: data.minPurchaseAmount,
      });

      setCouponSuccess(`Coupon "${data.code}" applied successfully!`);
      setCouponCode("");
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError("Failed to apply coupon. Please try again.");
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    applyCoupon(null);
    setCouponSuccess("");
    setCouponError("");
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-6 text-zinc-400">
          <ShoppingBag className="h-16 w-16" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Your Shopping Cart is Empty</h2>
        <p className="text-sm text-zinc-500 mt-2 max-w-md">
          Explore our wide collection of laptops, mobile phones, smartwatches, and accessories to add premium tech items here.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 font-semibold transition-colors shadow-lg shadow-indigo-600/10"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Shopping Cart</h1>
        <p className="text-sm text-zinc-500 mt-1">Review your items and apply coupon offers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => {
            const activePrice = item.discountPrice !== undefined ? item.discountPrice : item.price;
            const itemTotal = activePrice * item.quantity;

            return (
              <div
                key={item.productId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Product Info */}
                <div className="flex gap-4 items-center">
                  <div className="h-20 w-20 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900 p-2 shrink-0 flex items-center justify-center">
                    <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">{item.brand}</span>
                    <Link
                      href={`/products/${item.productId}`}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <h3 className="font-semibold text-zinc-900 dark:text-white text-sm sm:text-base line-clamp-1">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-zinc-500 mt-1">
                      ₹{activePrice.toLocaleString("en-IN")} each
                    </p>
                  </div>
                </div>

                {/* Controls (Quantity + Total + Remove) */}
                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-100 dark:border-zinc-900">
                  {/* Quantity Counter */}
                  <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-2 hover:text-indigo-600 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-2 hover:text-indigo-600 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Total Price */}
                  <div className="text-right sm:w-24">
                    <span className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base">
                      ₹{itemTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-2 rounded-lg border border-zinc-100 dark:border-zinc-900 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Summary Panel */}
        <aside className="lg:col-span-4 flex flex-col gap-6 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-20">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-900">
            Order Summary
          </h3>

          {/* Calculations */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Subtotal</span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Coupon Discount</span>
                <span className="font-semibold">
                  -₹{discount.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>GST (18%)</span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                ₹{tax.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Delivery Charge</span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                {shipping === 0 ? "FREE" : `₹${shipping}`}
              </span>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-900 pt-4 flex justify-between text-base font-bold text-zinc-900 dark:text-white">
              <span>Total Amount</span>
              <span className="text-lg text-indigo-600 dark:text-indigo-400">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Coupon Input Form */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-3">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="h-4 w-4 text-indigo-500" />
              Have a Coupon?
            </label>

            {coupon ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  <div>
                    <span className="font-bold">{coupon.code}</span>
                    <p className="text-[10px] text-indigo-500 mt-0.5">
                      {coupon.type === "percentage"
                        ? `${coupon.value}% Discount`
                        : coupon.type === "fixed"
                        ? `₹${coupon.value} Discount`
                        : "Free Shipping"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="p-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-rose-500 transition-colors"
                  title="Remove Coupon"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="WELCOME10, SUPER5000"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 text-xs outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={validating}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white px-4 py-2 text-xs font-bold transition-colors disabled:bg-zinc-500"
                >
                  {validating ? "Applying..." : "Apply"}
                </button>
              </form>
            )}

            {couponError && <p className="text-[11px] text-rose-600">{couponError}</p>}
            {couponSuccess && <p className="text-[11px] text-emerald-600 font-medium">{couponSuccess}</p>}
          </div>

          {/* Checkout Link */}
          <Link
            href="/checkout"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-3 font-semibold transition-colors shadow-lg shadow-indigo-600/15 text-sm"
          >
            Proceed to Checkout
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
