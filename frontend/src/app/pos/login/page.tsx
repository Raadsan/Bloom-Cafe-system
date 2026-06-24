"use client";

import React, { useState, useCallback, useRef } from "react";
import { ArrowRight, Loader2, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { authApi } from "@/lib/api/authApi";
import { APP_SYSTEM_NAME, APP_VERSION } from "@/lib/constants";
import { LoginShell, loginSubmitButtonClass } from "@/components/auth/LoginShell";

const PIN_LENGTH = 4;

export default function PosLoginPage() {
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
            ? "Cannot connect to server. Make sure the backend is running on port 2000."
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

  const canSubmit = !isLoading && !!username.trim() && pin.length === PIN_LENGTH;

  return (
    <LoginShell subtitle="Sign in with your username and PIN" error={error}>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="pos-username" className="text-sm font-medium text-zinc-700">
            Username
          </label>
          <div className="group relative">
            <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary" />
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
              className="auth-input"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="pos-pin" className="text-sm font-medium text-zinc-700">
            PIN
          </label>
          <div className="group relative">
            <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary" />
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
              className="auth-input"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className={loginSubmitButtonClass(!canSubmit)}
          disabled={!canSubmit}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-xs leading-relaxed text-zinc-400">
          {APP_SYSTEM_NAME}
          <br />
          Version {APP_VERSION}
        </p>
      </form>
    </LoginShell>
  );
}
