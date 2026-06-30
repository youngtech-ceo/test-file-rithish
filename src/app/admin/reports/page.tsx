"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Download, FileSpreadsheet, Printer, BarChart3, TrendingUp, Cpu } from "lucide-react";

interface Order {
  id: string;
  createdAt: string;
  paymentStatus: string;
  orderStatus: string;
  customerDetails: {
    name: string;
    email: string;
  };
  pricing: {
    total: number;
  };
  items: Array<{
    productId: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    discountPrice?: number;
    quantity: number;
  }>;
}

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "orders"));
        const list: Order[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Order);
        });
        setOrders(list);
      } catch (e) {
        console.error("Error fetching orders for reports:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Compute stats
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid" || o.orderStatus !== "cancelled");
  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.pricing.total, 0);

  // Category-wise Sales
  const categorySales = React.useMemo(() => {
    const map: Record<string, { quantity: number; revenue: number }> = {};
    paidOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cat = item.category || "General";
        const price = item.discountPrice || item.price;
        const subtotal = price * item.quantity;
        if (!map[cat]) {
          map[cat] = { quantity: 0, revenue: 0 };
        }
        map[cat].quantity += item.quantity;
        map[cat].revenue += subtotal;
      });
    });
    return Object.entries(map).map(([name, data]) => ({ name, ...data }));
  }, [paidOrders]);

  // Product-wise Sales
  const productSales = React.useMemo(() => {
    const map: Record<string, { brand: string; quantity: number; revenue: number }> = {};
    paidOrders.forEach((o) => {
      o.items.forEach((item) => {
        const name = item.name;
        const price = item.discountPrice || item.price;
        const subtotal = price * item.quantity;
        if (!map[name]) {
          map[name] = { brand: item.brand, quantity: 0, revenue: 0 };
        }
        map[name].quantity += item.quantity;
        map[name].revenue += subtotal;
      });
    });
    return Object.entries(map).map(([name, data]) => ({ name, ...data }));
  }, [paidOrders]);

  const handleExportCSV = () => {
    const headers = ["Order ID", "Date", "Customer", "Item Name", "Category", "Quantity", "Revenue"];
    const rows = paidOrders.flatMap((o) =>
      o.items.map((i) => {
        const price = i.discountPrice || i.price;
        return [
          o.id,
          new Date(o.createdAt).toLocaleDateString(),
          o.customerDetails.name,
          i.name.replace(/,/g, " "), // Escape commas
          i.category,
          i.quantity,
          price * i.quantity,
        ];
      })
    );

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `voltelectro_sales_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 rounded-2xl bg-zinc-150 dark:bg-zinc-900" />
        <div className="h-60 rounded-2xl bg-zinc-150 dark:bg-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Controllers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 print:hidden">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            Financial Reports & Analytics
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Export sales records and monitor hardware demand.</p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 px-4 py-2.5 text-xs font-bold transition-colors text-zinc-700 dark:text-zinc-300"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export CSV / Excel
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-bold transition-colors shadow-lg shadow-indigo-600/10"
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Invoice Header (Hidden on Web, visible on Print) */}
      <div className="hidden print:block space-y-4 border-b pb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-indigo-600 flex items-center gap-1">
              <Cpu className="h-6 w-6 inline" /> VoltElectro Retail
            </h1>
            <p className="text-xs text-zinc-500">123 Tech Avenue, Silicon Valley, Bengaluru, KA 560001</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold">Sales & Revenue Report</h2>
            <p className="text-xs text-zinc-400">Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <strong>Total Orders Analyzed:</strong> {orders.length}
          </div>
          <div>
            <strong>Total Sales Value:</strong> ₹{totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-1">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Sales Volume</span>
          <p className="text-3xl font-black text-zinc-900 dark:text-white">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
          <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 pt-2">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Reflects all completed and verified transactions.</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-1">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Orders Analyzed</span>
          <p className="text-3xl font-black text-zinc-900 dark:text-white">
            {paidOrders.length} <span className="text-xs text-zinc-400 font-medium">Paid/Confirmed</span>
          </p>
          <p className="text-[10px] text-zinc-500 pt-2">Out of {orders.length} total registered orders.</p>
        </div>
      </div>

      {/* Category Wise Sales Table */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-4 page-break-after">
        <h4 className="font-bold text-zinc-900 dark:text-white border-b pb-3">Category-Wise Revenue</h4>
        <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-900">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b">
                <th className="px-6 py-3">Category Name</th>
                <th className="px-6 py-3 text-center">Items Sold</th>
                <th className="px-6 py-3 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {categorySales.map((cat, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-zinc-50/40">
                  <td className="px-6 py-3.5 font-semibold text-zinc-900 dark:text-white">{cat.name}</td>
                  <td className="px-6 py-3.5 text-center text-zinc-500">{cat.quantity}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-zinc-900 dark:text-white">
                    ₹{cat.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Wise Sales Table */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-4">
        <h4 className="font-bold text-zinc-900 dark:text-white border-b pb-3">Product-Wise Sales</h4>
        <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-900">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b">
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Brand</th>
                <th className="px-6 py-3 text-center">Qty Sold</th>
                <th className="px-6 py-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {productSales.map((prod, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-zinc-50/40">
                  <td className="px-6 py-3.5 font-semibold text-zinc-900 dark:text-white">{prod.name}</td>
                  <td className="px-6 py-3.5 text-zinc-500">{prod.brand}</td>
                  <td className="px-6 py-3.5 text-center text-zinc-500">{prod.quantity}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-zinc-900 dark:text-white">
                    ₹{prod.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
