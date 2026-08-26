"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shirt, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState, Suspense, useEffect } from "react";

function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Tampilkan error dari OAuth callback (jika ada) — HANYA sekali,
  // lalu hapus param dari URL supaya tidak muncul lagi saat refresh
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error(`Gagal masuk: ${error}`);
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [searchParams, toast, router]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(`Gagal: ${error.message}`);
      setGoogleLoading(false);
      return;
    }
    if (data.url) {
      // Full-page redirect ke Google
      window.location.href = data.url;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Email dan password harus diisi");
      return;
    }
    setLoading(true);
    // Login via Supabase Auth (email/password)
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: username.trim(),
      password,
    });
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Email atau password salah, atau akun belum terdaftar"
          : `Gagal login: ${error.message}`
      );
      setLoading(false);
      return;
    }
    toast.success("Login berhasil!");
    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg mb-4">
            <Shirt className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">H-Sport</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Textile Production Management
          </p>
        </div>

        {/* Card Login */}
        <div className="rounded-2xl border border-gray-300 bg-white p-6 card-shadow-lg">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Email</Label>
              <Input
                id="username"
                type="email"
                placeholder="nama@email.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-muted-foreground">atau</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-gray-50 disabled:opacity-60 transition-colors"
            title="Hanya berfungsi dari localhost (buka di Mac, bukan dari HP)"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
          {googleLoading && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Mengarahkan ke Google...
            </p>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Login menggunakan email yang telah terdaftar oleh admin.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}