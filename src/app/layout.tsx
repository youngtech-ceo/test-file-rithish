import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoltElectro - Premium Electronics E-Commerce Store",
  description: "Discover the latest premium laptops, smartphones, smartwatches, TVs, and appliances at VoltElectro. Fast shipping, secure payments, and 24/7 customer support.",
  keywords: "electronics, shop online, laptops, smartphones, smartwatches, TVs, refrigerators, washing machines, VoltElectro",
  openGraph: {
    title: "VoltElectro - Premium Electronics E-Commerce Store",
    description: "Shop cutting-edge laptops, phones, smart devices, and home appliances. Secure checkout and express delivery.",
    type: "website",
    locale: "en_US",
    url: "https://voltelectro.com",
    siteName: "VoltElectro",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

