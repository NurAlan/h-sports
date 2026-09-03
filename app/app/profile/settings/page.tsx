"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Building, Mail, Phone, ShieldCheck, Check, RotateCcw } from "lucide-react";
import { useToast } from "@/components/toast/toast-provider";
import { api, type UserProfile } from "@/lib/api";
import { resetAllTutorialState } from "@/lib/tutorial-storage";

export default function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("owner");

  useEffect(() => {
    api
      .get<UserProfile>("/api/profile")
      .then((data) => {
        setOwnerName(data.fullName || "");
        setBusinessName(data.businessName || "H-Sport");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setRole(data.role || "owner");
        setLoading(false);
      })
      .catch((err) => {
        toast.error(`Gagal memuat profil: ${(err as Error).message}`);
        setLoading(false);
      });
  }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put<UserProfile>("/api/profile", {
        fullName: ownerName,
        businessName,
        phone,
      });

      setOwnerName(updated.fullName || "");
      setBusinessName(updated.businessName || "");
      setPhone(updated.phone || "");
      toast.success("Profil usaha berhasil disimpan ke database!");
    } catch (err) {
      toast.error(`Gagal menyimpan: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetTour = () => {
    resetAllTutorialState();
    toast.success("Status panduan berhasil di-reset! Panduan onboarding akan otomatis muncul kembali di Dashboard.");
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4 active:scale-95 transition-transform"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Profile
      </Link>

      <PageHeader
        title="Pengaturan Profil"
        subtitle="Informasi pemilik & identitas usaha tersimpan di database"
      />

      <Card className="border-stone-300 bg-white card-shadow-lg">
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4 py-6">
              <div className="h-4 w-1/3 bg-stone-200 rounded-md animate-pulse" />
              <div className="h-11 w-full bg-stone-100 rounded-lg animate-pulse" />
              <div className="h-4 w-1/4 bg-stone-200 rounded-md animate-pulse" />
              <div className="h-11 w-full bg-stone-100 rounded-lg animate-pulse" />
              <div className="h-4 w-1/4 bg-stone-200 rounded-md animate-pulse" />
              <div className="h-11 w-full bg-stone-100 rounded-lg animate-pulse" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="owner" className="font-semibold text-sm flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary" />
                  Nama Pemilik
                </Label>
                <Input
                  id="owner"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Masukkan nama pemilik"
                  className="h-11 text-base"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="business" className="font-semibold text-sm flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-primary" />
                  Nama Usaha / Brand
                </Label>
                <Input
                  id="business"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Nama konveksi / apparel"
                  className="h-11 text-base"
                  required
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="font-semibold text-sm flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Akun
                  </Label>
                  <span className="text-[11px] text-muted-foreground bg-stone-100 px-2 py-0.5 rounded">
                    Terhubung ke Akun
                  </span>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="h-11 text-base bg-stone-100 text-stone-600 opacity-90 cursor-not-allowed"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone" className="font-semibold text-sm flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-primary" />
                  No. Telepon / WhatsApp
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="h-11 text-base"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>Peran Akses:</span>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300 font-semibold capitalize">
                  {role}
                </Badge>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full h-12 text-base font-semibold mt-2 shadow-sm active:scale-98 transition-all"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Menyimpan ke Database...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4" />
                    Simpan Perubahan
                  </span>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Kartu Reset Preferensi Panduan */}
      <Card className="border-stone-300 bg-white card-shadow-lg mt-4">
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-primary shrink-0" />
                Reset Panduan Aplikasi
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Memunculkan kembali pop-up tur panduan otomatis dan banner di Dashboard
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetTour}
              className="shrink-0 min-h-[40px] px-3 border-stone-300 hover:bg-blue-50 hover:text-primary text-xs font-semibold active:scale-95 transition-all"
            >
              Reset Panduan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}