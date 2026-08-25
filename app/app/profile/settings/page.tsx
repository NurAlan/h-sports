"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/toast/toast-provider";

export default function SettingsPage() {
  const toast = useToast();
  const [ownerName, setOwnerName] = useState("Alan");
  const [businessName, setBusinessName] = useState("H-Sport");
  const [email, setEmail] = useState("alan@example.com");
  const [phone, setPhone] = useState("081234567890");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call
    console.log({ ownerName, businessName, email, phone });
    toast.success("Profil berhasil diperbarui");
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Profile
      </Link>

      <PageHeader title="Pengaturan Profil" subtitle="Informasi pemilik & usaha" />

      <Card className="border-gray-300 bg-white card-shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="owner">Nama Pemilik</Label>
              <Input
                id="owner"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business">Nama Usaha</Label>
              <Input
                id="business"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full mt-2">
              Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}