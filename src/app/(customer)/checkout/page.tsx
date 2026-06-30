"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { collection, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ShieldCheck, Truck, CreditCard, PhoneCall, AlertCircle, ShoppingBag, CheckCircle, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

export default function CheckoutPage() {
  const { user, userData } = useAuth();
  const { cart, coupon, clearCart, getCartTotals } = useCart();
  const router = useRouter();

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Shipping Form State
  const [fullName, setFullName] = useState(userData?.fullName || "");
  const [phone, setPhone] = useState(userData?.mobileNumber || "");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"contact_before_payment" | "online_payment">("contact_before_payment");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<{ orderId: string } | null>(null);

  const { subtotal, discount, tax, shipping, total } = getCartTotals();

  // Redirect if cart is empty and order hasn't succeeded yet
  useEffect(() => {
    if (cart.length === 0 && !orderSuccess) {
      router.push("/cart");
    }
  }, [cart, orderSuccess, router]);

  // Sync user info when loaded
  useEffect(() => {
    if (userData) {
      setFullName(userData.fullName || "");
      setPhone(userData.mobileNumber || "");
    }
  }, [userData]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=checkout");
      return;
    }

    setError("");
    setLoading(true);

    const shippingAddress = {
      id: "address_" + Date.now(),
      name: fullName.trim(),
      phone: phone.trim(),
      addressLine: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      isDefault: true,
    };

    const newOrderData = {
      customerId: user.uid,
      customerDetails: {
        name: fullName.trim(),
        email: user.email || "",
        phone: phone.trim(),
      },
      items: cart,
      pricing: {
        subtotal,
        discount,
        tax,
        shipping,
        total,
      },
      couponCode: coupon?.code || null,
      paymentMethod,
      shippingAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (paymentMethod === "contact_before_payment") {
        // Option 1: Contact Before Payment
        const orderDoc = await addDoc(collection(db, "orders"), {
          ...newOrderData,
          paymentStatus: "pending",
          orderStatus: "pending_verification",
        });

        // Reduce stock quantities
        await updateInventory();

        triggerSuccess(orderDoc.id);
      } else {
        // Option 2: Online Payment (Razorpay)
        const res = await fetch("/api/checkout/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: total }),
        });
        const rzOrder = await res.json();

        if (rzOrder.error) {
          throw new Error(rzOrder.error);
        }

        if (rzOrder.mock) {
          // If in Mock Mode (no keys), simulate success/failure
          const confirmPayment = window.confirm(
            "Razorpay keys not set. [DEVELOPMENT MOCK MODE]\n\nClick OK to simulate a SUCCESSFUL payment, or Cancel to simulate a FAILED payment."
          );

          if (confirmPayment) {
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: rzOrder.id,
                razorpay_payment_id: "mock_pay_" + Math.random().toString(36).substring(2, 9),
                razorpay_signature: "mock_sig_123",
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.verified) {
              const orderDoc = await addDoc(collection(db, "orders"), {
                ...newOrderData,
                paymentStatus: "paid",
                orderStatus: "processing",
                paymentDetails: {
                  razorpayOrderId: rzOrder.id,
                  razorpayPaymentId: "mock_pay_success",
                },
              });

              await updateInventory();
              triggerSuccess(orderDoc.id);
            } else {
              throw new Error("Mock payment verification failed.");
            }
          } else {
            setError("Payment cancelled/failed by the user.");
            setLoading(false);
          }
        } else {
          // Real Razorpay Checkout
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
            amount: rzOrder.amount,
            currency: rzOrder.currency,
            name: "VoltElectro",
            description: "E-Commerce Purchase",
            order_id: rzOrder.id,
            handler: async (response: any) => {
              try {
                setLoading(true);
                const verifyRes = await fetch("/api/checkout/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                });
                const verifyData = await verifyRes.json();

                if (verifyData.verified) {
                  const orderDoc = await addDoc(collection(db, "orders"), {
                    ...newOrderData,
                    paymentStatus: "paid",
                    orderStatus: "processing",
                    paymentDetails: {
                      razorpayOrderId: response.razorpay_order_id,
                      razorpayPaymentId: response.razorpay_payment_id,
                      razorpaySignature: response.razorpay_signature,
                    },
                  });

                  await updateInventory();
                  triggerSuccess(orderDoc.id);
                } else {
                  setError("Payment verification failed.");
                  setLoading(false);
                }
              } catch (err: any) {
                setError("Verification error: " + err.message);
                setLoading(false);
              }
            },
            prefill: {
              name: fullName,
              email: user.email || "",
              contact: phone,
            },
            theme: {
              color: "#4f46e5",
            },
            modal: {
              ondismiss: () => {
                setLoading(false);
                setError("Payment window closed.");
              },
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        }
      }
    } catch (err: any) {
      console.error("Order error:", err);
      setError(err.message || "An error occurred during checkout.");
      setLoading(false);
    }
  };

  const updateInventory = async () => {
    // Deduct stock levels for each cart item in Firestore
    for (const item of cart) {
      const prodRef = doc(db, "products", item.productId);
      await updateDoc(prodRef, {
        stockQuantity: increment(-item.quantity),
      });
    }
  };

  const triggerSuccess = (orderId: string) => {
    clearCart();
    setOrderSuccess({ orderId });
    setLoading(false);
    
    // Confetti explosion
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  if (orderSuccess) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-full mb-6 text-indigo-600 dark:text-indigo-400">
          <CheckCircle className="h-16 w-16" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Order Placed Successfully!</h2>
        <p className="text-sm text-zinc-500 mt-2 max-w-md">
          Thank you for shopping with VoltElectro. Your order has been registered and is being processed.
        </p>

        <div className="mt-6 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 max-w-sm w-full space-y-3 text-left">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Order ID:</span>
            <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">{orderSuccess.orderId}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Payment Status:</span>
            <span className="font-bold capitalize text-emerald-600 dark:text-emerald-400">
              {paymentMethod === "online_payment" ? "Paid (Online)" : "Pending (Offline)"}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Estimated Delivery:</span>
            <span className="font-bold text-zinc-900 dark:text-white">3-4 Business Days</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard?tab=orders"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 font-semibold transition-colors shadow-lg shadow-indigo-600/10 text-sm"
          >
            Track My Order
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 px-6 py-3 font-semibold transition-colors text-sm text-zinc-700 dark:text-zinc-300"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Secure Checkout</h1>
        <p className="text-sm text-zinc-500 mt-1">Complete your shipping and payment information.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs border border-rose-100 dark:border-rose-950/40">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Shipping details + Payment Method */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section 1: Shipping Address */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-6">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-500" />
              1. Shipping Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Mobile Number</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-950"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Address Line</label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Apartment, suite, street address"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bengaluru"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-950"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">ZIP Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="560001"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-950"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-6">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              2. Payment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Contact Before Payment */}
              <label
                className={`relative flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === "contact_before_payment"
                    ? "border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/10"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="contact_before_payment"
                  checked={paymentMethod === "contact_before_payment"}
                  onChange={() => setPaymentMethod("contact_before_payment")}
                  className="mt-1 h-4 w-4 text-indigo-600 border-zinc-300 focus:ring-indigo-500"
                />
                <div className="space-y-1">
                  <span className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <PhoneCall className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Contact Before Payment
                  </span>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Verify availability with the business owner before paying. Once confirmed, collect your item or pay offline.
                  </p>
                </div>
              </label>

              {/* Option B: Online Payment */}
              <label
                className={`relative flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === "online_payment"
                    ? "border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/10"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="online_payment"
                  checked={paymentMethod === "online_payment"}
                  onChange={() => setPaymentMethod("online_payment")}
                  className="mt-1 h-4 w-4 text-indigo-600 border-zinc-300 focus:ring-indigo-500"
                />
                <div className="space-y-1">
                  <span className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Online Payment
                  </span>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Secure transaction using Razorpay. Pay instantly with UPI, Credit/Debit Card, Net Banking, or Wallet.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary & Finalize */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-900">
              Order Details
            </h3>

            {/* Item List Summary */}
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between items-center text-xs gap-3">
                  <span className="text-zinc-600 dark:text-zinc-400 line-clamp-1 flex-1">
                    {item.name} <strong className="text-zinc-400">x{item.quantity}</strong>
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    ₹{((item.discountPrice || item.price) * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-zinc-100 dark:border-zinc-900 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-500">
                <span>GST (18%)</span>
                <span>₹{tax.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Delivery</span>
                <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-zinc-900 dark:text-white pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <span>Payable Amount</span>
                <span className="text-indigo-600 dark:text-indigo-400">₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Place Order Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-3 font-semibold transition-colors shadow-lg shadow-indigo-600/10 text-sm disabled:bg-zinc-500"
            >
              {loading
                ? "Processing..."
                : paymentMethod === "online_payment"
                ? "Pay & Place Order"
                : "Place Order (Contact Model)"}
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Secure Trust Info */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 text-[10px] text-zinc-500 text-center space-y-1">
            <p className="font-bold text-zinc-700 dark:text-zinc-300">100% Encrypted Transactions</p>
            <p>Your personal information is protected by industry standard SSL and Firebase security protocols.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
