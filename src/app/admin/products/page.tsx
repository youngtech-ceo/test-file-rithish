"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit3, Trash2, Search, X, Check, Eye } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  specifications: Record<string, string>;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  images: string[];
  warrantyDetails: string;
  deliveryInfo: string;
  rating: number;
  numReviews: number;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [discountPrice, setDiscountPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [warrantyDetails, setWarrantyDetails] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  
  // Specs State (array of key-value pairs)
  const [specKey, setSpecKey] = useState("");
  const [specVal, setSpecVal] = useState("");
  const [specs, setSpecs] = useState<Record<string, string>>({});

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const list: Product[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(list);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setSku("");
    setBrand("");
    setCategory("");
    setSubcategory("");
    setDescription("");
    setPrice(0);
    setDiscountPrice("");
    setStockQuantity(0);
    setImageUrl("");
    setWarrantyDetails("");
    setDeliveryInfo("");
    setSpecs({});
    setModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku);
    setBrand(prod.brand);
    setCategory(prod.category);
    setSubcategory(prod.subcategory || "");
    setDescription(prod.description);
    setPrice(prod.price);
    setDiscountPrice(prod.discountPrice ? prod.discountPrice.toString() : "");
    setStockQuantity(prod.stockQuantity);
    setImageUrl(prod.images?.[0] || "");
    setWarrantyDetails(prod.warrantyDetails || "");
    setDeliveryInfo(prod.deliveryInfo || "");
    setSpecs(prod.specifications || {});
    setModalOpen(true);
  };

  const handleAddSpec = (e: React.MouseEvent) => {
    e.preventDefault();
    if (specKey.trim() && specVal.trim()) {
      setSpecs((prev) => ({ ...prev, [specKey.trim()]: specVal.trim() }));
      setSpecKey("");
      setSpecVal("");
    }
  };

  const handleRemoveSpec = (key: string) => {
    const updated = { ...specs };
    delete updated[key];
    setSpecs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      brand: brand.trim(),
      category: category.trim(),
      subcategory: subcategory.trim(),
      description: description.trim(),
      price: Number(price),
      discountPrice: discountPrice.trim() ? Number(discountPrice) : undefined,
      stockQuantity: Number(stockQuantity),
      images: imageUrl.trim() ? [imageUrl.trim()] : ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80"],
      specifications: specs,
      warrantyDetails: warrantyDetails.trim() || "1 Year Manufacturer Warranty",
      deliveryInfo: deliveryInfo.trim() || "Standard delivery 3-4 days.",
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingProduct) {
        // Update
        const docRef = doc(db, "products", editingProduct.id);
        await updateDoc(docRef, payload);
      } else {
        // Create
        await addDoc(collection(db, "products"), {
          ...payload,
          rating: 4.5, // Default for new products
          numReviews: 0,
          createdAt: new Date().toISOString(),
        });
      }
      setModalOpen(false);
      fetchProducts();
    } catch (e) {
      console.error("Error saving product:", e);
      alert("Failed to save product.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    } catch (e) {
      console.error("Error deleting product:", e);
      alert("Failed to delete product.");
    }
  };

  const handleQuickRestock = async (id: string, currentStock: number) => {
    const input = window.prompt("Enter new stock quantity:", currentStock.toString());
    if (input === null) return;
    const newQty = parseInt(input);
    if (isNaN(newQty) || newQty < 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    try {
      await updateDoc(doc(db, "products", id), { stockQuantity: newQty });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stockQuantity: newQty } : p))
      );
    } catch (e) {
      console.error("Error updating stock:", e);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-xs flex-1">
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 pl-10 text-sm outline-none focus:border-indigo-500"
          />
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-zinc-400" />
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Product
        </button>
      </div>

      {/* Table List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-zinc-150 dark:bg-zinc-900" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">No products found matching your search.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Stock</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((prod) => (
                <tr
                  key={prod.id}
                  className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 last:border-0 transition-colors"
                >
                  {/* Thumbnail & Title */}
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-zinc-50 border p-1 flex items-center justify-center shrink-0">
                      <img src={prod.images?.[0]} alt={prod.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-zinc-900 dark:text-white truncate block max-w-[220px]">
                        {prod.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 block font-semibold">{prod.brand} • {prod.sku}</span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-semibold">{prod.category}</td>

                  {/* Price */}
                  <td className="px-6 py-4">
                    <span className="font-bold text-zinc-900 dark:text-white block">
                      ₹{(prod.discountPrice || prod.price).toLocaleString()}
                    </span>
                    {prod.discountPrice && (
                      <span className="text-[10px] text-zinc-400 line-through">₹{prod.price.toLocaleString()}</span>
                    )}
                  </td>

                  {/* Stock Level */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleQuickRestock(prod.id, prod.stockQuantity)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        prod.stockQuantity <= 5
                          ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      }`}
                      title="Click to update stock level"
                    >
                      {prod.stockQuantity} Left
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="p-2 rounded-lg border border-zinc-100 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-zinc-400 transition-colors"
                      title="Edit Product"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-2 rounded-lg border border-zinc-100 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-zinc-400 transition-colors"
                      title="Delete Product"
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

      {/* Add / Edit Sliding Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          <form
            onSubmit={handleSubmit}
            className="relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh] space-y-6 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-500">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. iPad Pro 11-inch"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* SKU */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">SKU / Model ID</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. APPLE-IPAD-11"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Brand</label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Apple"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Category</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Smart Devices"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Subcategory */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Subcategory</label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g. Tablets"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Original Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Original Price (INR)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Discount Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Discount Price (Optional)</label>
                <input
                  type="number"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Stock Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Stock Quantity</label>
                <input
                  type="number"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Image URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-500">Product Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Warranty & Shipping */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Warranty Details</label>
                <input
                  type="text"
                  value={warrantyDetails}
                  onChange={(e) => setWarrantyDetails(e.target.value)}
                  placeholder="e.g. 1 Year Manufacturer Warranty"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Delivery Information</label>
                <input
                  type="text"
                  value={deliveryInfo}
                  onChange={(e) => setDeliveryInfo(e.target.value)}
                  placeholder="e.g. Free express shipping"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Specifications Key-Value entries */}
            <div className="border-t pt-4 border-zinc-100 dark:border-zinc-850 space-y-3">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
                Technical Specifications
              </label>

              {/* Current Specs tags */}
              <div className="flex flex-wrap gap-2 mb-2">
                {Object.entries(specs).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border text-[10px] font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    <span>{key}: {val}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(key)}
                      className="text-rose-500 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Spec inputs */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="e.g. RAM"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none"
                />
                <input
                  type="text"
                  placeholder="e.g. 16GB"
                  value={specVal}
                  onChange={(e) => setSpecVal(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSpec}
                  className="rounded-lg bg-zinc-900 dark:bg-zinc-800 text-white px-4 py-1.5 text-xs font-bold transition-colors"
                >
                  Add Spec
                </button>
              </div>
            </div>

            {/* Form Footer Actions */}
            <div className="border-t pt-4 border-zinc-100 dark:border-zinc-850 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 px-5 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 text-xs font-bold transition-colors shadow-lg shadow-indigo-600/10"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
