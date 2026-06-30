"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Cpu, User, Mail, Phone, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  if (user) {
    router.push("/dashboard");
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic Validation
    if (mobileNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const createdUser = userCredential.user;

      // 2. Create user document in Firestore
      const newUserProfile = {
        uid: createdUser.uid,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim(),
        role: "customer", // Default role
        savedAddresses: [],
        wishlist: [],
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", createdUser.uid), newUserProfile);
      
      // 3. Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email address is already in use.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl relative overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />

        <div className="flex flex-col items-center text-center relative z-10">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-indigo-600 dark:text-indigo-400 mb-6">
            <Cpu className="h-8 w-8" />
            <span>VoltElectro</span>
          </Link>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Create Account</h2>
          <p className="text-sm text-zinc-500 mt-1">Join the next-generation electronics platform</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs border border-rose-100 dark:border-rose-950/40 animate-in fade-in duration-200">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4 relative z-10">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 pl-11 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20"
              />
              <User className="absolute left-4 top-3 h-4.5 w-4.5 text-zinc-400" />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 pl-11 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20"
              />
              <Mail className="absolute left-4 top-3 h-4.5 w-4.5 text-zinc-400" />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Mobile Number</label>
            <div className="relative">
              <input
                type="tel"
                required
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 pl-11 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20"
              />
              <Phone className="absolute left-4 top-3 h-4.5 w-4.5 text-zinc-400" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Min 6 characters)"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 pl-11 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20"
              />
              <Lock className="absolute left-4 top-3 h-4.5 w-4.5 text-zinc-400" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/10 disabled:bg-indigo-500/50"
          >
            {loading ? "Creating Account..." : "Create Account"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-zinc-500 mt-6 relative z-10">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
