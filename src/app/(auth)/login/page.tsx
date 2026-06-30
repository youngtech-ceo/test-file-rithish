"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Cpu, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { loginWithGoogle, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  if (user) {
    router.push("/dashboard");
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Failed to sign in. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Google login error:", err);
      setError("Failed to sign in with Google.");
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
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Welcome Back</h2>
          <p className="text-sm text-zinc-500 mt-1">Sign in to your premium tech account</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs border border-rose-100 dark:border-rose-950/40 animate-in fade-in duration-200">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 relative z-10">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 pl-11 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20"
              />
              <Mail className="absolute left-4 top-3 h-4.5 w-4.5 text-zinc-400" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Password</label>
              <a href="#" className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 pl-11 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20"
              />
              <Lock className="absolute left-4 top-3 h-4.5 w-4.5 text-zinc-400" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/10 disabled:bg-indigo-500/50"
          >
            {loading ? "Signing in..." : "Sign In"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center relative z-10">
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
        </div>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-200 py-2.5 text-sm font-semibold transition-colors relative z-10"
        >
          {/* Google Color Icon */}
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.67 0 3.2.58 4.38 1.71l3.27-3.27C17.67 1.6 15.02 1 12 1 7.35 1 3.39 3.69 1.5 7.62l3.86 2.99C6.27 7.58 8.89 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.46c-.28 1.47-1.11 2.71-2.35 3.54l3.64 2.82c2.13-1.96 3.74-4.85 3.74-8.46z"
            />
            <path
              fill="#FBBC05"
              d="M5.36 14.39c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.5 6.82C.54 8.78 0 10.96 0 13.25c0 2.29.54 4.47 1.5 6.43l3.86-3.29z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.64-2.82c-1.01.68-2.31 1.09-4.32 1.09-3.11 0-5.73-2.54-6.64-5.57L1.5 16.08C3.39 20.01 7.35 23 12 23z"
            />
          </svg>
          Google Account
        </button>

        {/* Footer Link */}
        <div className="text-center text-xs text-zinc-500 mt-6 relative z-10">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
}
