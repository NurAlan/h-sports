// ============================================================
// MASTER DATA GLOBAL — daftar jenis kain (hardcode)
// Dipakai oleh semua menu/komponen yang memilih kain:
// - AddFabricPurchaseDialog (tambah pembelian)
// - AddBOMItemDialog (komposisi bahan order)
// - halaman lain yang butuh daftar kain
// ============================================================

export interface MasterFabric {
  id: string;
  name: string;
  unit: string;
}

/**
 * Katalog lengkap jenis kain (satuan pembelian: kg).
 * Id stabil (tidak berubah) supaya mudah direferensikan dari API/schema nanti.
 */
export const FABRIC_CATALOG: MasterFabric[] = [
  // === Cotton ===
  { id: "fabric-cotton-combed-24", name: "Cotton Combed 24s", unit: "kg" },
  { id: "fabric-cotton-combed-30", name: "Cotton Combed 30s", unit: "kg" },
  { id: "fabric-cotton-combed-40", name: "Cotton Combed 40s", unit: "kg" },
  { id: "fabric-cotton-carded-20", name: "Cotton Carded 20s", unit: "kg" },
  { id: "fabric-cotton-carded-24", name: "Cotton Carded 24s", unit: "kg" },
  { id: "fabric-cotton-carded-30", name: "Cotton Carded 30s", unit: "kg" },
  { id: "fabric-cotton-bamboo", name: "Cotton Bamboo", unit: "kg" },

  // === Campuran / Blended ===
  { id: "fabric-cvc-50", name: "CVC 50/50 (Cotton-Viscose)", unit: "kg" },
  { id: "fabric-tc-65", name: "TC 65/35 (Tetoron-Cotton)", unit: "kg" },
  { id: "fabric-pe", name: "Polyester PE", unit: "kg" },
  { id: "fabric-spandex", name: "Spandex / Lycra", unit: "kg" },
  { id: "fabric-rayon", name: "Rayon / Viscose", unit: "kg" },
  { id: "fabric-cotton-spandex", name: "Cotton Spandex", unit: "kg" },
  { id: "fabric-cvc-spandex", name: "CVC Spandex", unit: "kg" },

  // === Rajut (Knitted) — untuk kaos ===
  { id: "fabric-jersey", name: "Jersey", unit: "kg" },
  { id: "fabric-interlock", name: "Interlock", unit: "kg" },
  { id: "fabric-lacoste", name: "Lacoste (Pique)", unit: "kg" },
  { id: "fabric-hyget", name: "Hyget", unit: "kg" },
  { id: "fabric-fleece", name: "Fleece", unit: "kg" },
  { id: "fabric-terry", name: "Terry / Towel", unit: "kg" },
  { id: "fabric-rib", name: "Rib (Kerah / Lengan)", unit: "kg" },

  // === Tenun (Woven) ===
  { id: "fabric-drill", name: "Drill / Canvas", unit: "kg" },
  { id: "fabric-oxford", name: "Oxford", unit: "kg" },
  { id: "fabric-denim", name: "Denim", unit: "kg" },
  { id: "fabric-twill", name: "Twill", unit: "kg" },
];

/** Cari jenis kain berdasarkan id */
export function getFabricCatalogById(id: string): MasterFabric | undefined {
  return FABRIC_CATALOG.find((f) => f.id === id);
}

/** Nama kain berdasarkan id (fallback: id itu sendiri) */
export function getFabricCatalogName(id: string): string {
  return getFabricCatalogById(id)?.name ?? id;
}
