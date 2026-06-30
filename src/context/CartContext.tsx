"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  quantity: number;
  stockQuantity: number;
  brand: string;
  category: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "fixed" | "percentage" | "free_shipping";
  value: number;
  minPurchaseAmount: number;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: string[]; // Product IDs
  coupon: Coupon | null;
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  applyCoupon: (coupon: Coupon | null) => void;
  getCartTotals: () => {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, userData, refreshUserData } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing cart from localStorage", e);
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Sync wishlist with userData when logged in
  useEffect(() => {
    if (userData && userData.wishlist) {
      setWishlist(userData.wishlist);
    } else {
      // For guest users, load from localStorage
      const savedWishlist = localStorage.getItem("wishlist");
      if (savedWishlist) {
        try {
          setWishlist(JSON.parse(savedWishlist));
        } catch (e) {
          console.error("Error parsing wishlist", e);
        }
      } else {
        setWishlist([]);
      }
    }
  }, [userData]);

  const addToCart = (product: any, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.productId === product.id
      );

      if (existingIndex > -1) {
        const newCart = [...prevCart];
        const newQty = newCart[existingIndex].quantity + quantity;
        newCart[existingIndex].quantity = Math.min(
          newQty,
          product.stockQuantity
        );
        return newCart;
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            discountPrice: product.discountPrice,
            image: product.images?.[0] || "",
            quantity: Math.min(quantity, product.stockQuantity),
            stockQuantity: product.stockQuantity,
            brand: product.brand,
            category: product.category,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.productId !== productId)
    );
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.stockQuantity)),
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
  };

  const toggleWishlist = async (productId: string) => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const isAlreadyIn = wishlist.includes(productId);

      try {
        if (isAlreadyIn) {
          await updateDoc(userRef, {
            wishlist: arrayRemove(productId),
          });
        } else {
          await updateDoc(userRef, {
            wishlist: arrayUnion(productId),
          });
        }
        await refreshUserData();
      } catch (error) {
        console.error("Error updating wishlist in Firestore:", error);
      }
    } else {
      // Guest: Sync with localStorage
      setWishlist((prev) => {
        const newWishlist = prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];
        localStorage.setItem("wishlist", JSON.stringify(newWishlist));
        return newWishlist;
      });
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const applyCoupon = (appliedCoupon: Coupon | null) => {
    setCoupon(appliedCoupon);
  };

  const getCartTotals = () => {
    const subtotal = cart.reduce((acc, item) => {
      const activePrice =
        item.discountPrice !== undefined ? item.discountPrice : item.price;
      return acc + activePrice * item.quantity;
    }, 0);

    let discount = 0;
    let isFreeShipping = false;

    if (coupon && subtotal >= coupon.minPurchaseAmount) {
      if (coupon.type === "fixed") {
        discount = coupon.value;
      } else if (coupon.type === "percentage") {
        discount = Math.round((subtotal * coupon.value) / 100);
      } else if (coupon.type === "free_shipping") {
        isFreeShipping = true;
      }
    }

    discount = Math.min(discount, subtotal);
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.18); // 18% GST

    const shipping =
      taxableAmount > 50000 || isFreeShipping || cart.length === 0 ? 0 : 150;

    const total = taxableAmount + tax + shipping;

    return {
      subtotal,
      discount,
      tax,
      shipping,
      total,
    };
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        coupon,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        applyCoupon,
        getCartTotals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
