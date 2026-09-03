"use client";

import { useMemo, useState, useEffect } from "react";
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
  DialogBody,
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
import { api, type Fabric } from "@/lib/api";
import { ListItemSkeleton } from "@/components/skeletons";
import { useToast } from "@/components/toast/toast-provider";

interface FabricEntry {
  id: string;
  name: string;
  unit: string;
}

// Hapus? Cek riwayat/pemakaian kain — ditangani server (409)

export default function FabricsPage() {
  const toast = useToast();
  const [fabrics, setFabrics] = useState<FabricEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FabricEntry | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<FabricEntry | null>(null);

  useEffect(() => {
    api
      .get<Fabric[]>("/api/fabrics")
      .then((data) =>
        setFabrics(data.map((f) => ({ id: f.id, name: f.name, unit: f.unit })))
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      if (editing) {
        await api.patch(`/api/fabrics/${editing.id}`, { name: trimmed, unit });
        setFabrics((prev) =>
          prev.map((f) => (f.id === editing.id ? { ...f, name: trimmed, unit } : f))
        );
        toast.success(`Kain "${trimmed}" berhasil diperbarui`);
      } else {
        const created = await api.post<Fabric>("/api/fabrics", {
          name: trimmed,
          unit,
        });
        setFabrics((prev) => [
          ...prev,
          { id: created.id, name: created.name, unit: created.unit },
        ]);
        toast.success(`Kain "${trimmed}" berhasil ditambahkan`);
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(`Gagal: ${(err as Error).message}`);
    }
  };

  const handleDelete = (fabric: FabricEntry) => {
    // Buka dialog konfirmasi — validasi "punya riwayat" ditangani server (409)
    setDeleteTarget(fabric);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.del(`/api/fabrics/${deleteTarget.id}`);
      setFabrics((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      toast.success(`Kain "${deleteTarget.name}" dihapus`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(`Gagal hapus: ${(err as Error).message}`);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-base font-medium text-primary hover:underline mb-4"
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
          className="h-9 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>

      {/* List */}
      <div className="flex flex-col gap-2.5">
        {loading && (
          <div className="space-y-2.5">
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </div>
        )}
        {!loading && fabrics.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-lg bg-stone-100 flex items-center justify-center mb-3">
              <Package className="h-6 w-6 text-stone-400" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">Belum ada jenis kain</p>
            <p className="text-sm text-muted-foreground">Tambah jenis kain dengan tombol Tambah di atas</p>
          </div>
        )}
        {!loading && filtered.length === 0 && search && (
          <div className="text-center py-8">
            <p className="text-base text-muted-foreground">Tidak ada kain yang cocok dengan &quot;{search}&quot;</p>
          </div>
        )}
        {filtered.map((fabric) => {
          return (
            <Card key={fabric.id} className="border-stone-200 bg-white card-shadow">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="bg-stone-100 p-2 rounded-lg shrink-0">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">
                      {fabric.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {fabric.unit} • Belum dipakai
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(fabric)}
                      aria-label={`Edit ${fabric.name}`}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-blue-50 hover:text-primary transition-colors"
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
          <Card className="bg-white border-stone-300 card-shadow-lg">
            <CardContent className="py-10 text-center">
              <p className="text-base font-medium text-foreground mb-1">
                Kain tidak ditemukan
              </p>
              <p className="text-sm text-muted-foreground">
                Tidak ada hasil untuk &quot;{search}&quot;
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
          <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <DialogBody>
              <div className="grid gap-4">
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
            </DialogBody>
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
                &quot;{deleteTarget?.name}&quot;
              </span>{" "}
              akan dihapus dari master data secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700">
              Tindakan ini tidak bisa dibatalkan. Kain yang sudah dipakai di
              pembelian atau BOM tidak bisa dihapus.
            </div>
          </DialogBody>
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