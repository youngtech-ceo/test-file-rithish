"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  IndianRupee,
  ShoppingBag,
  Users,
  AlertTriangle,
  ClipboardList,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Order {
  id: string;
  createdAt: string;
  paymentStatus: string;
  orderStatus: string;
  pricing: {
    total: number;
  };
}

interface Product {
  id: string;
  name: string;
  stockQuantity: number;
  price: number;
}

export default function AdminOverviewPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Orders
        const ordSnap = await getDocs(collection(db, "orders"));
        const ordList: Order[] = [];
        ordSnap.forEach((doc) => {
          ordList.push({ id: doc.id, ...doc.data() } as Order);
        });
        setOrders(ordList);

        // 2. Fetch Products
        const prodSnap = await getDocs(collection(db, "products"));
        const prodList: Product[] = [];
        prodSnap.forEach((doc) => {
          prodList.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(prodList);

        // 3. Fetch Customers
        const custQuery = query(collection(db, "users"), where("role", "==", "customer"));
        const custSnap = await getDocs(custQuery);
        setTotalCustomers(custSnap.size);

      } catch (error) {
        console.error("Error fetching dashboard overview data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Compute KPIs
  const totalSales = orders
    .filter((o) => o.paymentStatus === "paid" || o.orderStatus !== "cancelled")
    .reduce((acc, o) => acc + o.pricing.total, 0);

  const pendingOrders = orders.filter(
    (o) => o.orderStatus === "pending_verification" || o.orderStatus === "pending"
  ).length;

  const lowStockProducts = products.filter((p) => p.stockQuantity <= 5);

  // Prepare chart data (sales over last 7 days)
  const chartData = React.useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const salesMap: Record<string, number> = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = days[date.getDay()];
      salesMap[label] = 0;
    }

    // Populate sales
    orders
      .filter((o) => o.paymentStatus === "paid" || o.orderStatus !== "cancelled")
      .forEach((o) => {
        const orderDate = new Date(o.createdAt);
        const dayLabel = days[orderDate.getDay()];
        if (salesMap[dayLabel] !== undefined) {
          salesMap[dayLabel] += o.pricing.total;
        }
      });

    return Object.entries(salesMap).map(([name, sales]) => ({
      name,
      sales,
    }));
  }, [orders]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-150 dark:bg-zinc-900" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-zinc-150 dark:bg-zinc-900" />
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Sales",
      value: `₹${totalSales.toLocaleString("en-IN")}`,
      icon: <IndianRupee className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-950/40",
    },
    {
      title: "Total Orders",
      value: orders.length,
      icon: <ShoppingBag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      bg: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-950/40",
    },
    {
      title: "Total Customers",
      value: totalCustomers,
      icon: <Users className="h-6 w-6 text-sky-600 dark:text-sky-400" />,
      bg: "bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-950/40",
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: <ClipboardList className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-950/40",
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl border flex items-center justify-between bg-white dark:bg-zinc-950 ${kpi.bg} shadow-sm`}
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{kpi.title}</span>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">{kpi.value}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 shadow-sm">{kpi.icon}</div>
          </div>
        ))}
      </div>

      {/* Revenue Trend Graph */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Sales Performance
            </h3>
            <p className="text-xs text-zinc-500">Weekly revenue trends (INR)</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(value: any) => [`₹${value.toLocaleString()}`, "Sales"]}
              />
              <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Split Lists: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders (Left Column) */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">Recent Orders</h3>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage Orders
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 5).map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs"
              >
                <div className="space-y-1">
                  <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[120px] block">{ord.id}</span>
                  <span className="text-zinc-400">{new Date(ord.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block">₹{ord.pricing.total.toLocaleString()}</span>
                  <span className="text-zinc-500 capitalize">{ord.paymentStatus}</span>
                </div>
                <div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      ord.orderStatus === "delivered"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : ord.orderStatus === "cancelled"
                        ? "bg-rose-500/10 text-rose-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {ord.orderStatus.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts (Right Column) */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
              Stock Alerts
            </h3>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Restock
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-zinc-500 italic text-center py-6">All products are well stocked.</p>
            ) : (
              lowStockProducts.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs"
                >
                  <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[160px]">
                    {prod.name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold">
                    {prod.stockQuantity} Left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
