"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Trash2, X, Ticket, Calendar, DollarSign, Percent } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  type: "fixed" | "percentage" | "free_shipping";
  value: number;
  minPurchaseAmount: number;
  usageLimit: number;
  usedCount: number;
  expiryDate: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form Fields
  const [code, setCode] = useState("");
  const [type, setType] = useState<"fixed" | "percentage" | "free_shipping">("percentage");
  const [value, setValue] = useState(0);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(100);
  const [expiryDate, setExpiryDate] = useState("");

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "coupons"));
      const list: Coupon[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Coupon);
      });
      setCoupons(list);
    } catch (e) {
      console.error("Error fetching coupons:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAddModal = () => {
    setCode("");
    setType("percentage");
    setValue(0);
    setMinPurchaseAmount(0);
    setUsageLimit(100);
    setExpiryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const couponCode = code.trim().toUpperCase();
    const payload = {
      code: couponCode,
      type,
      value: type === "free_shipping" ? 0 : Number(value),
      minPurchaseAmount: Number(minPurchaseAmount),
      usageLimit: Number(usageLimit),
      usedCount: 0,
      expiryDate: new Date(expiryDate).toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "coupons", couponCode), payload);
      setModalOpen(false);
      fetchCoupons();
    } catch (err) {
      console.error("Error saving coupon:", err);
      alert("Failed to save coupon.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await deleteDoc(doc(db, "coupons", id));
      fetchCoupons();
    } catch (e) {
      console.error("Error deleting coupon:", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Ticket className="h-5 w-5 text-indigo-500" />
          Promo Coupons
        </h3>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Coupon
        </button>
      </div>

      {/* Coupon List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-zinc-150 dark:bg-zinc-900" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-12">No active coupons found.</p>
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="px-6 py-3.5">Coupon Code</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Value</th>
                <th className="px-6 py-3.5">Min Purchase</th>
                <th className="px-6 py-3.5">Usage</th>
                <th className="px-6 py-3.5">Expiry</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coup) => (
                <tr
                  key={coup.id}
                  className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 last:border-0 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block">{coup.code}</span>
                  </td>
                  <td className="px-6 py-4 capitalize font-semibold">{coup.type.replace("_", " ")}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                    {coup.type === "percentage"
                      ? `${coup.value}%`
                      : coup.type === "fixed"
                      ? `₹${coup.value.toLocaleString()}`
                      : "FREE Shipping"}
                  </td>
                  <td className="px-6 py-4 font-semibold">₹{coup.minPurchaseAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium text-zinc-500">
                    {coup.usedCount} / {coup.usageLimit}
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-400 font-bold">
                    {new Date(coup.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(coup.id)}
                      className="p-2 rounded-lg border border-zinc-100 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-zinc-400 transition-colors"
                      title="Delete Coupon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          <form
            onSubmit={handleSubmit}
            className="relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-zinc-900 dark:text-white">Create Coupon</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-150"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. FESTIVAL20"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Discount Type</label>
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="percentage">Percentage Discount (%)</option>
                  <option value="fixed">Fixed Amount Discount (₹)</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>

              {/* Value (if not free shipping) */}
              {type !== "free_shipping" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">
                    Discount Value {type === "percentage" ? "(%)" : "(₹)"}
                  </label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Min Purchase */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Minimum Purchase Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={minPurchaseAmount}
                  onChange={(e) => setMinPurchaseAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Usage Limit */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Usage Limit</label>
                <input
                  type="number"
                  required
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border px-4 py-2 text-xs font-bold text-zinc-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold"
              >
                Create Coupon
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
