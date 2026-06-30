"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User as UserIcon, ShoppingBag, Heart, MapPin, KeyRound, Truck, CheckCircle2, ChevronRight, Eye, Trash2, ArrowRight } from "lucide-react";

interface Order {
  id: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  pricing: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
  items: Array<{
    productId: string;
    name: string;
    image: string;
    price: number;
    discountPrice?: number;
    quantity: number;
  }>;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  discountPrice?: number;
  images: string[];
  stockQuantity: number;
}

export default function CustomerDashboardPage() {
  const { user, userData, refreshUserData } = useAuth();
  const { addToCart, toggleWishlist } = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tabs
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");

  // Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Expanded Order for Modal / Detail view
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Address Form State
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=dashboard");
    }
  }, [user, router]);

  // Sync active tab with search param
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Fetch Orders
  useEffect(() => {
    if (user && activeTab === "orders") {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const qry = query(collection(db, "orders"), where("customerId", "==", user.uid));
          const snap = await getDocs(qry);
          const list: Order[] = [];
          snap.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as Order);
          });
          // Sort by date descending
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(list);
        } catch (e) {
          console.error("Error fetching orders:", e);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [user, activeTab]);

  // Fetch Wishlist Items
  useEffect(() => {
    if (user && activeTab === "wishlist") {
      const fetchWishlist = async () => {
        setLoadingWishlist(true);
        try {
          if (!userData?.wishlist || userData.wishlist.length === 0) {
            setWishlistItems([]);
            return;
          }

          // Fetch products in wishlist
          const items: Product[] = [];
          for (const prodId of userData.wishlist) {
            const docRef = doc(db, "products", prodId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              items.push({ id: docSnap.id, ...docSnap.data() } as Product);
            }
          }
          setWishlistItems(items);
        } catch (e) {
          console.error("Error fetching wishlist details:", e);
        } finally {
          setLoadingWishlist(false);
        }
      };
      fetchWishlist();
    }
  }, [user, userData, activeTab]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;
    setAddingAddress(true);

    const newAddress = {
      id: "address_" + Date.now(),
      name: userData.fullName,
      phone: userData.mobileNumber,
      addressLine: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      isDefault: userData.savedAddresses.length === 0,
    };

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        savedAddresses: [...userData.savedAddresses, newAddress],
      });
      await refreshUserData();
      
      // Reset form
      setAddressLine("");
      setCity("");
      setState("");
      setZipCode("");
      alert("Address added successfully!");
    } catch (e) {
      console.error("Error adding address:", e);
      alert("Failed to add address.");
    } finally {
      setAddingAddress(false);
    }
  };

  const handleRemoveAddress = async (addressId: string) => {
    if (!user || !userData) return;
    if (!window.confirm("Are you sure you want to remove this address?")) return;

    try {
      const updatedAddresses = userData.savedAddresses.filter((addr) => addr.id !== addressId);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        savedAddresses: updatedAddresses,
      });
      await refreshUserData();
    } catch (e) {
      console.error("Error removing address:", e);
    }
  };

  const handleMoveToCart = (prod: Product) => {
    addToCart(prod, 1);
    toggleWishlist(prod.id);
  };

  const renderOrderProgress = (status: string) => {
    const steps = [
      { key: "pending_verification", label: "Verification" },
      { key: "confirmed", label: "Confirmed" },
      { key: "processing", label: "Processing" },
      { key: "shipped", label: "Shipped" },
      { key: "delivered", label: "Delivered" },
    ];

    // Determine current index
    let activeIndex = 0;
    if (status === "confirmed" || status === "contacted") activeIndex = 1;
    else if (status === "processing") activeIndex = 2;
    else if (status === "shipped") activeIndex = 3;
    else if (status === "delivered") activeIndex = 4;
    else if (status === "cancelled") return <span className="text-xs font-bold text-rose-500">Order Cancelled</span>;

    return (
      <div className="flex items-center gap-2 py-4 overflow-x-auto">
        {steps.map((step, idx) => (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  idx <= activeIndex
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                }`}
              >
                {idx < activeIndex ? "✓" : idx + 1}
              </div>
              <span className="text-[10px] font-semibold text-zinc-500">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-12 shrink-0 ${
                  idx < activeIndex ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (!user || !userData) return null;

  const tabsList = [
    { id: "profile", label: "My Profile", icon: <UserIcon className="h-4 w-4" /> },
    { id: "orders", label: "Order History", icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "wishlist", label: "My Wishlist", icon: <Heart className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Customer Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your profile, orders, saved addresses, and wishlist.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <aside className="md:col-span-3 flex flex-col gap-2 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          {tabsList.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                router.push(`/dashboard?tab=${tab.id}`);
              }}
              className={`flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Dynamic Content Panel */}
        <main className="md:col-span-9 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 min-h-[450px]">
          
          {/* Tab 1: Profile */}
          {activeTab === "profile" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Profile Details</h3>
                <p className="text-xs text-zinc-500">Your personal details registered with VoltElectro</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Full Name</span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{userData.fullName}</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Email Address</span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{userData.email}</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Mobile Number</span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{userData.mobileNumber || "Not Provided"}</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Member Since</span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {new Date(userData.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Saved Addresses Section */}
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-indigo-500" />
                    Saved Addresses
                  </h3>
                  <p className="text-xs text-zinc-500">Manage your shipping destinations</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userData.savedAddresses?.map((addr: any) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 relative group"
                    >
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        {addr.name} {addr.isDefault && <span className="text-[10px] font-bold text-indigo-500 ml-2 uppercase">Default</span>}
                      </h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {addr.addressLine}, {addr.city}, {addr.state} - {addr.zipCode}
                      </p>
                      <p className="text-xs text-zinc-500">Phone: {addr.phone}</p>

                      <button
                        onClick={() => handleRemoveAddress(addr.id)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {/* Add Address Form */}
                  <form onSubmit={handleAddAddress} className="p-5 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-4">
                    <h4 className="font-bold text-sm text-zinc-950 dark:text-white">Add New Address</h4>
                    <input
                      type="text"
                      required
                      placeholder="Address Line"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        required
                        placeholder="ZIP"
                        maxLength={6}
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addingAddress}
                      className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white py-2 text-xs font-bold transition-colors"
                    >
                      {addingAddress ? "Adding..." : "Add Address"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Orders */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Order History</h3>
                <p className="text-xs text-zinc-500">Track your order statuses and invoices</p>
              </div>

              {loadingOrders ? (
                <div className="space-y-4 animate-pulse">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No orders placed yet</h4>
                  <Link href="/products" className="text-xs text-indigo-600 font-bold hover:underline mt-2 inline-block">
                    Browse premium tech products
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400">Order ID</span>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[180px]">{ord.id}</p>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Date</span>
                            <strong>{new Date(ord.createdAt).toLocaleDateString()}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total</span>
                            <strong className="text-indigo-600 dark:text-indigo-400">₹{ord.pricing.total.toLocaleString("en-IN")}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Payment</span>
                            <span className="capitalize font-semibold">{ord.paymentStatus}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-950"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </button>
                      </div>

                      {/* Visual Stepper */}
                      {renderOrderProgress(ord.orderStatus)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Wishlist */}
          {activeTab === "wishlist" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">My Wishlist</h3>
                <p className="text-xs text-zinc-500 font-medium">Your saved products</p>
              </div>

              {loadingWishlist ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-xl bg-zinc-100 dark:bg-zinc-900" />
                  ))}
                </div>
              ) : wishlistItems.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Your wishlist is empty</h4>
                  <p className="text-xs text-zinc-500 mt-1">Save products to keep track of them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {wishlistItems.map((prod) => {
                    const activePrice = prod.discountPrice || prod.price;
                    return (
                      <div
                        key={prod.id}
                        className="flex gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 items-center relative"
                      >
                        <div className="h-20 w-20 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 p-2 shrink-0 flex items-center justify-center">
                          <img src={prod.images?.[0]} alt={prod.name} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-zinc-400">{prod.brand}</span>
                          <Link href={`/products/${prod.id}`} className="hover:text-indigo-600">
                            <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white line-clamp-1">
                              {prod.name}
                            </h4>
                          </Link>
                          <p className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm">
                            ₹{activePrice.toLocaleString("en-IN")}
                          </p>
                          <button
                            onClick={() => handleMoveToCart(prod)}
                            disabled={prod.stockQuantity <= 0}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-1 disabled:text-zinc-400"
                          >
                            Move to Cart
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => toggleWishlist(prod.id)}
                          className="absolute top-3 right-3 text-zinc-400 hover:text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Expanded Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />

          <div className="relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Order Invoice</h3>
            <p className="text-xs text-zinc-500 mt-1">Detailed overview of Order #{selectedOrder.id}</p>

            {/* Item Table */}
            <div className="mt-6 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900/50">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase bg-zinc-100/50 dark:bg-zinc-900">
                    <th className="px-4 py-2.5">Item</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.productId} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                        <img src={item.image} alt={item.name} className="h-8 w-8 object-contain bg-white dark:bg-zinc-950 rounded p-0.5 border" />
                        <span className="truncate max-w-[220px]">{item.name}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-bold">
                        ₹{((item.discountPrice || item.price) * item.quantity).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="mt-6 space-y-2 text-xs text-right max-w-xs ml-auto border-t pt-4 border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal:</span>
                <span>₹{selectedOrder.pricing.subtotal.toLocaleString()}</span>
              </div>
              {selectedOrder.pricing.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount:</span>
                  <span>-₹{selectedOrder.pricing.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-500">
                <span>GST (18%):</span>
                <span>₹{selectedOrder.pricing.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Shipping:</span>
                <span>{selectedOrder.pricing.shipping === 0 ? "FREE" : `₹${selectedOrder.pricing.shipping}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-zinc-900 dark:text-white pt-2 border-t">
                <span>Total Amount:</span>
                <span className="text-indigo-600 dark:text-indigo-400">₹{selectedOrder.pricing.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Footer Close */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white px-5 py-2.5 text-xs font-bold transition-colors"
              >
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
