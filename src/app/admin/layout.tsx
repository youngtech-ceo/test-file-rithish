"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, ShoppingBag, FolderTree, ClipboardList, Ticket, BarChart3, LogOut, Cpu, ShieldAlert, ArrowLeft } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-4 bg-zinc-950 text-zinc-400">
        <div className="h-12 w-12 rounded-full border-4 border-zinc-800 border-t-indigo-500 animate-spin" />
        <span className="text-sm font-medium">Verifying administrator credentials...</span>
      </div>
    );
  }

  // Strict Admin Validation
  if (!user || userData?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-950 text-zinc-400">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-full mb-6 text-rose-500 animate-bounce">
          <ShieldAlert className="h-16 w-16" />
        </div>
        <h1 className="text-3xl font-bold text-white">Access Denied</h1>
        <p className="text-sm text-zinc-500 mt-2 text-center max-w-md">
          You do not have the required administrative permissions to access this dashboard. This incident has been logged.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 px-5 py-2.5 text-xs font-bold transition-colors text-zinc-300"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  const sidebarLinks = [
    { name: "Overview", href: "/admin", icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    { name: "Products", href: "/admin/products", icon: <ShoppingBag className="h-4.5 w-4.5" /> },
    { name: "Categories", href: "/admin/categories", icon: <FolderTree className="h-4.5 w-4.5" /> },
    { name: "Orders", href: "/admin/orders", icon: <ClipboardList className="h-4.5 w-4.5" /> },
    { name: "Coupons", href: "/admin/coupons", icon: <Ticket className="h-4.5 w-4.5" /> },
    { name: "Reports", href: "/admin/reports", icon: <BarChart3 className="h-4.5 w-4.5" /> },
  ];

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6 gap-2">
          <Cpu className="h-6 w-6 text-indigo-500" />
          <span className="font-bold text-lg text-zinc-950 dark:text-white">VoltAdmin</span>
          <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">Control</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shopfront
          </Link>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-8 shrink-0">
          <h2 className="font-bold text-zinc-900 dark:text-white">Admin Dashboard</h2>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-zinc-900 dark:text-white">{userData?.fullName}</p>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">System Administrator</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center border border-amber-400 shadow-sm">
              AD
            </div>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>

      </div>

    </div>
  );
}
