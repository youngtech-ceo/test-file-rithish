"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Eye, ClipboardList, AlertCircle, Printer, X } from "lucide-react";

interface Order {
  id: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    zipCode: string;
  };
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "orders"));
      const list: Order[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Order);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(list);
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        orderStatus: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus } : null));
      }
    } catch (e) {
      console.error("Error updating order status:", e);
    }
  };

  const handleTogglePaymentStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "paid" ? "pending" : "paid";
    try {
      await updateDoc(doc(db, "orders", orderId), {
        paymentStatus: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: nextStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, paymentStatus: nextStatus } : null));
      }
    } catch (e) {
      console.error("Error toggling payment status:", e);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customerDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customerDetails.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || ord.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-xs flex-1">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 pl-10 text-sm outline-none focus:border-indigo-500"
          />
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-zinc-400" />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {["All", "pending_verification", "confirmed", "processing", "shipped", "delivered"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                statusFilter === status
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              {status === "All" ? "All Orders" : status.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-zinc-150 dark:bg-zinc-900" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-12">No orders found.</p>
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 shadow-sm print:hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Total</th>
                <th className="px-6 py-3.5">Payment</th>
                <th className="px-6 py-3.5">Order Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => (
                <tr
                  key={ord.id}
                  className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 last:border-0 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-bold text-zinc-900 dark:text-white truncate block max-w-[120px]">{ord.id}</span>
                    <span className="text-[10px] text-zinc-400">{new Date(ord.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-zinc-900 dark:text-white block">{ord.customerDetails.name}</span>
                    <span className="text-xs text-zinc-400 block">{ord.customerDetails.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-zinc-900 dark:text-white">₹{ord.pricing.total.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleTogglePaymentStatus(ord.id, ord.paymentStatus)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                        ord.paymentStatus === "paid"
                          ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                      }`}
                    >
                      {ord.paymentStatus}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={ord.orderStatus}
                      onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                      className="text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 outline-none font-semibold"
                    >
                      <option value="pending_verification">Pending Verification</option>
                      <option value="contacted">Contacted</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="p-2 rounded-lg border border-zinc-100 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-zinc-400 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details & Printable Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm print:hidden" onClick={() => setSelectedOrder(null)} />

          <div className="relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh] space-y-6 animate-in zoom-in-95 duration-200 print:absolute print:inset-0 print:border-0 print:shadow-none print:max-h-none print:rounded-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Order Invoice</h3>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintInvoice}
                  className="p-1.5 rounded-lg border hover:bg-zinc-100 text-zinc-600"
                  title="Print Invoice"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Invoice Header details */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-black text-indigo-600">VoltElectro Retail</h2>
                <p className="text-xs text-zinc-500 mt-1">123 Tech Avenue, Silicon Valley, Bengaluru, KA 560001</p>
                <p className="text-xs text-zinc-500">support@voltelectro.com | +91 98765 43210</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Invoice ID</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-white block truncate max-w-[160px]">{selectedOrder.id}</span>
                <span className="text-xs text-zinc-500 block">Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Billed To:</span>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">{selectedOrder.customerDetails.name}</p>
                <p className="text-xs text-zinc-500">{selectedOrder.customerDetails.email}</p>
                <p className="text-xs text-zinc-500">Phone: {selectedOrder.customerDetails.phone}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Ship To:</span>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">{selectedOrder.shippingAddress.name}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {selectedOrder.shippingAddress.addressLine}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.zipCode}
                </p>
                <p className="text-xs text-zinc-500">Phone: {selectedOrder.shippingAddress.phone}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900/50">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase bg-zinc-100/50 dark:bg-zinc-900">
                    <th className="px-4 py-2.5">Item Details</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.productId} className="border-b border-zinc-155 last:border-0">
                      <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        ₹{(item.discountPrice || item.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        ₹{((item.discountPrice || item.price) * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="space-y-2 text-xs text-right max-w-xs ml-auto border-t pt-4">
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
                <span>Total Payable:</span>
                <span className="text-indigo-600 dark:text-indigo-400">₹{selectedOrder.pricing.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Bottom Actions Print View footer */}
            <div className="flex items-center justify-between border-t pt-4 text-[10px] text-zinc-400 font-medium">
              <p>Payment Method: <strong className="capitalize">{selectedOrder.paymentMethod.replace("_", " ")}</strong></p>
              <p>Status: <strong className="capitalize">{selectedOrder.orderStatus}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
