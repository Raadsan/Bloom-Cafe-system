"use client";

import React, { useState } from "react";
import { Lock, Mail, ArrowRight, Store, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { authApi } from "@/lib/api/authApi";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("Submitting login for:", email);
      const res = await authApi.login({ email, password });
      console.log("Login response:", res);
      
      showToast("Login successful! Redirecting...", "success");

      // Redirect based on role
      const userRole = res?.user?.role?.toLowerCase();
      setTimeout(() => {
        if (userRole === "pos") {
          window.location.href = "/pos-terminal";
        } else {
          window.location.href = "/dashboard";
        }
      }, 1500);
    } catch (err: any) {
      console.error("Login caught error:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to login. Please try again.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-secondary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-1 ring-primary/20">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2 text-center">
            Sign in to manage your restaurant system
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 group">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground ml-1"
            >
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@restaurant.com"
                className="w-full pl-10 pr-4 py-3 bg-input/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground/70"
                required
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <div className="flex justify-between items-center ml-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 bg-input/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground/70"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
              
            </div>
            <div className="flex justify-end items-right mr-1">
              <a
                href="#"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full py-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-primary/25 transition-all group relative overflow-hidden"
            disabled={isLoading}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-white/20 group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
            <span className="relative flex items-center gap-2">
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </span>
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Need an account?{" "}
            <a
              href="#"
              className="text-primary font-medium hover:underline transition-all"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
