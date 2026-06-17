"use client";

import React, { useState, useCallback, useRef } from "react";
import { User, Monitor, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { authApi } from "@/lib/api/authApi";
import { useSystemBranding } from "@/hooks/use-system-branding";
import SystemBrandMark from "@/components/branding/SystemBrandMark";

const PIN_LENGTH = 4;

export default function PosLoginPage() {
  const { branding } = useSystemBranding();
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const pinInputRef = useRef<HTMLInputElement>(null);

  const submitLogin = useCallback(
    async (user: string, pinCode: string) => {
      if (!user.trim() || pinCode.length !== PIN_LENGTH) return;

      setIsLoading(true);
      setError("");
      try {
        await authApi.posLogin({
          username: user.trim().toLowerCase(),
          pin: pinCode,
        });
        showToast("Login successful! Redirecting...", "success");
        window.location.href = "/pos-terminal";
      } catch (err: unknown) {
        const axiosErr = err as {
          message?: string;
          response?: { data?: { message?: string } };
        };
        const message =
          !axiosErr.response && axiosErr.message === "Network Error"
            ? "Cannot connect to server. Make sure the backend is running on port 5000."
            : axiosErr.response?.data?.message || "Invalid username or PIN";
        setError(message);
        setPin("");
        pinInputRef.current?.focus();
        showToast(message, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitLogin(username, pin);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-secondary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

      <div className="w-full max-w-md bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-5 flex h-28 w-full max-w-[300px] items-center justify-center overflow-visible">
            {branding.systemLogoUrl ? (
              <SystemBrandMark
                logoUrl={branding.systemLogoUrl}
                systemName={branding.systemName}
                variant="plain"
                fit="width"
                className="h-24 w-auto max-w-[280px] scale-[1.25] origin-center object-contain"
              />
            ) : (
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner ring-1 ring-primary/20">
                <Monitor className="w-8 h-8 text-primary" />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            POS Terminal
          </h1>
          <p className="text-muted-foreground mt-2 text-center">
            Sign in with your username and PIN
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="space-y-2 group">
            <label
              htmlFor="pos-username"
              className="text-sm font-medium text-foreground ml-1"
            >
              Username
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                id="pos-username"
                type="text"
                value={username}
                onChange={e => {
                  setUsername(e.target.value.toLowerCase().replace(/\s/g, ""));
                  setError("");
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && username.trim()) {
                    e.preventDefault();
                    pinInputRef.current?.focus();
                  }
                }}
                placeholder="your.username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 bg-input/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground/70 disabled:opacity-60"
                required
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <label
              htmlFor="pos-pin"
              className="text-sm font-medium text-foreground ml-1"
            >
              PIN
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                ref={pinInputRef}
                id="pos-pin"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={PIN_LENGTH}
                value={pin}
                onChange={e => {
                  setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH));
                  setError("");
                }}
                disabled={isLoading}
                placeholder="••••"
                className="w-full pl-10 pr-4 py-3 bg-input/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground/70 disabled:opacity-60"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full py-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-primary/25 transition-all group relative overflow-hidden"
            disabled={isLoading || !username.trim() || pin.length !== PIN_LENGTH}
          >
            <div className="absolute inset-0 -translate-x-full bg-white/20 group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
            <span className="relative flex items-center justify-center gap-2">
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}
