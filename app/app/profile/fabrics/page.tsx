"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Package,
} from "lucide-react";
import { FABRIC_CATALOG } from "@/lib/master-data";
import { fabricBatches, bomItems, getFabricStock } from "@/lib/mock-data";
import { useToast } from "@/components/toast/toast-provider";

interface FabricEntry {
  id: string;
  name: string;
  unit: string;
}

/** Cek apakah kain sudah pernah dipakai (pembelian/BOM) — tidak boleh dihapus */
function isFabricUsed(fabricId: string): boolean {
  return (
    fabricBatches.some((b) => b.fabricId === fabricId) ||
    bomItems.some((b) => b.fabricId === fabricId)
  );
}

export default function FabricsPage() {
  const toast = useToast();
  const [fabrics, setFabrics] = useState<FabricEntry[]>(FABRIC_CATALOG);
  const [search, setSearch] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FabricEntry | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<FabricEntry | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fabrics;
    return fabrics.filter((f) => f.name.toLowerCase().includes(q));
  }, [fabrics, search]);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setUnit("kg");
    setDialogOpen(true);
  };

  const openEdit = (fabric: FabricEntry) => {
    setEditing(fabric);
    setName(fabric.name);
    setUnit(fabric.unit);
    setDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (editing) {
      // Edit
      setFabrics((prev) =>
        prev.map((f) => (f.id === editing.id ? { ...f, name: trimmed, unit } : f))
      );
      toast.success(`Kain "${trimmed}" berhasil diperbarui`);
    } else {
      // Tambah baru
      const newId = `fabric-${Date.now()}`;
      setFabrics((prev) => [...prev, { id: newId, name: trimmed, unit }]);
      toast.success(`Kain "${trimmed}" berhasil ditambahkan`);
    }
    setDialogOpen(false);
  };

  const handleDelete = (fabric: FabricEntry) => {
    if (isFabricUsed(fabric.id)) {
      toast.error(
        `"${fabric.name}" sudah punya riwayat pembelian/BOM — tidak bisa dihapus`
      );
      return;
    }
    // Buka dialog konfirmasi, bukan window.confirm
    setDeleteTarget(fabric);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setFabrics((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    toast.success(`Kain "${deleteTarget.name}" dihapus`);
    setDeleteTarget(null);
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Profile
      </Link>

      <PageHeader
        title="Master Fabric"
        subtitle={`Kelola jenis kain (${fabrics.length} jenis)`}
        action={
          <Button onClick={openAdd} className="gap-1">
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cari jenis kain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {/* List */}
      <div className="flex flex-col gap-2.5">
        {filtered.map((fabric) => {
          const used = isFabricUsed(fabric.id);
          const stock = getFabricStock(fabric.id);
          return (
            <Card key={fabric.id} className="border-gray-300 bg-white card-shadow">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg shrink-0">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {fabric.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {fabric.unit} •{" "}
                      {used ? `Stok ${stock} kg • punya riwayat` : "Belum dipakai"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(fabric)}
                      aria-label={`Edit ${fabric.name}`}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(fabric)}
                      aria-label={`Hapus ${fabric.name}`}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card className="bg-white border-gray-300 card-shadow-lg">
            <CardContent className="py-10 text-center">
              <p className="text-sm font-medium text-foreground mb-1">
                Kain tidak ditemukan
              </p>
              <p className="text-xs text-muted-foreground">
                Tidak ada hasil untuk "{search}"
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog tambah/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Jenis Kain" : "Tambah Jenis Kain"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Ubah nama atau satuan jenis kain"
                : "Tambahkan jenis kain baru ke master data"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fabric-name">Nama Kain *</Label>
                <Input
                  id="fabric-name"
                  placeholder="Contoh: Cotton Carded 32s"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fabric-unit">Satuan</Label>
                <Input
                  id="fabric-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                {editing ? "Simpan Perubahan" : "Tambah Kain"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog konfirmasi hapus */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Hapus Jenis Kain?
            </DialogTitle>
            <DialogDescription>
              Kain{" "}
              <span className="font-semibold text-foreground">
                "{deleteTarget?.name}"
              </span>{" "}
              akan dihapus dari master data secara permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 text-xs text-red-700">
            Tindakan ini tidak bisa dibatalkan. Kain yang sudah dipakai di
            pembelian atau BOM tidak bisa dihapus.
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="default"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={confirmDelete}
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}