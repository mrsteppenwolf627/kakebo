"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const supabase = createClient();
  const t = useTranslations("Auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function loginGoogle() {
    setLoading(true);
    setMsg(null);
    setNeedsConfirm(false);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) throw error;
    } catch (e: any) {
      setMsg(e?.message ?? t('form.errors.unknown'));
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    setLoading(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMsg(t('form.success.resend'));
    } catch (e: any) {
      setMsg(e?.message ?? t('form.errors.unknown'));
    } finally {
      setLoading(false);
    }
  }

  async function authEmail() {
    setLoading(true);
    setMsg(null);
    setNeedsConfirm(false);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        setNeedsConfirm(true);
        setMsg(
          t('form.success.signup')
        );
        setMode("login");
        return;
      }

      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const m = (error.message || "").toLowerCase();

        if (m.includes("confirm") || m.includes("not confirmed")) {
          setNeedsConfirm(true);
          setMsg(t('form.errors.notConfirmed'));
          return;
        }

        throw error;
      }

      window.location.href = "/app";
    } catch (e: any) {
      setMsg(e?.message ?? t('form.errors.unknown'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex">
      {/* LEFT PANEL - Información */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-900 items-center justify-center p-12">
        <div className="max-w-md text-white space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border border-white bg-white">
              <span className="text-xl font-serif text-stone-900">K</span>
            </div>
            <span className="text-2xl font-serif">Kakebo</span>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl font-serif font-normal leading-tight">
              {t.rich('leftPanel.title', {
                br: () => <br />
              })}
            </h1>
            <p className="text-stone-300 font-light leading-relaxed">
              {t('leftPanel.subtitle')}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 border-t border-stone-700 pt-8">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-white mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm text-stone-300 font-light">
                {t('leftPanel.features.free')}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-white mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm text-stone-300 font-light">
                {t('leftPanel.features.ai')}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-white mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm text-stone-300 font-light">
                {t('leftPanel.features.privacy')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="w-full lg:w-1/2 bg-stone-50 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Back to home - mobile */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-stone-600 font-light hover:text-stone-900 transition-colors lg:hidden"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t('form.backToHome')}
          </Link>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-serif text-stone-900">
              {mode === "login" ? t('form.login.title') : t('form.signup.title')}
            </h2>
            <p className="text-sm text-stone-600 font-light">
              {mode === "login"
                ? t('form.login.subtitle')
                : t('form.signup.subtitle')}
            </p>
          </div>

          {/* Google Auth */}
          <button
            onClick={loginGoogle}
            disabled={loading}
            className="w-full border border-stone-300 bg-white px-6 py-3 text-sm font-light text-stone-900 hover:border-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? "..." : t('form.googleBtn')}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-stone-50 px-4 text-stone-500 font-light">{t('form.divider')}</span>
            </div>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-stone-600 font-light">{t('form.emailLabel')}</label>
              <input
                className="w-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-900 transition-colors font-mono"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-stone-600 font-light">{t('form.passwordLabel')}</label>
              <input
                className="w-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-900 transition-colors font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
              />
            </div>

            {msg && (
              <div className="border border-stone-300 bg-white p-3">
                <p className="text-xs text-stone-700 font-light">{msg}</p>
              </div>
            )}

            {needsConfirm && (
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={loading || !email}
                className="w-full text-sm text-stone-600 font-light hover:text-stone-900 disabled:opacity-50 disabled:cursor-not-allowed underline"
              >
                {t('form.resendBtn')}
              </button>
            )}

            <button
              onClick={authEmail}
              disabled={loading || !email || !password}
              className="w-full border border-stone-900 bg-stone-900 text-white py-3 text-sm font-light hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mode === "login" ? t('form.submitLogin') : t('form.submitSignup')}
            </button>

            <button
              onClick={() => {
                const next = mode === "login" ? "signup" : "login";
                setMode(next);
                setMsg(null);
                setNeedsConfirm(false);
              }}
              className="w-full text-sm text-stone-600 font-light hover:text-stone-900 transition-colors"
            >
              {mode === "login" ? t('form.toggleToSignup') : t('form.toggleToLogin')}
            </button>
          </div>

          {/* Back to home - desktop */}
          <Link
            href="/"
            className="hidden lg:inline-flex items-center gap-2 text-sm text-stone-600 font-light hover:text-stone-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t('form.backToHome')}
          </Link>
        </div>
      </div>
    </main>
  );
}
