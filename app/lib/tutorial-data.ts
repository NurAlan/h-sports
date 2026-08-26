// Data penjelasan setiap menu — dipakai untuk in-app tutorial & dialog bantuan

export interface TutorialData {
  title: string;
  description: string;
  icon: string;
  steps: { title: string; description: string }[];
  tips: string[];
}

export const TUTORIALS: Record<string, TutorialData> = {
  dashboard: {
    title: "Dashboard",
    description:
      "Tampilan utama yang merangkum kondisi bisnis Anda dalam sekali lihat.",
    icon: "📊",
    steps: [
      {
        title: "Profit Bulan Ini",
        description:
          "Card paling atas menampilkan keuntungan bulan berjalan, trend vs bulan lalu, dan margin. Ini jawaban cepat: 'saya untung berapa?'",
      },
      {
        title: "Grafik Omzet vs Profit",
        description:
          "Grafik 6 bulan terakhir — lihat tren pertumbuhan bisnis dan efisiensi biaya.",
      },
      {
        title: "Komposisi Stok Kain",
        description:
          "Donut chart menunjukkan porsi stok per jenis kain — mana yang dominan dan mana yang perlu ditambah.",
      },
      {
        title: "Order Mendekati Deadline",
        description:
          "Daftar order yang harus segera dikerjakan. Warna badge menunjukkan tingkat urgensi.",
      },
    ],
    tips: [
      "Card stok menipis berwarna merah — segera lakukan pembelian",
      "Klik order di daftar untuk melihat detailnya",
    ],
  },

  orders: {
    title: "Orders (Pesanan)",
    description:
      "Kelola seluruh pesanan kaos dari customer — dari penerimaan sampai pengiriman.",
    icon: "📦",
    steps: [
      {
        title: "Buat Order Baru",
        description:
          "Tekan tombol + (FAB) di kanan bawah untuk mencatat pesanan baru: nama customer, jumlah kaos, spesifikasi, dan deadline.",
      },
      {
        title: "Filter & Pencarian",
        description:
          "Cari berdasarkan nama customer, filter berdasarkan status (Draft/Produksi/QC/Selesai), dan urutkan berdasarkan deadline.",
      },
      {
        title: "Warna Card",
        description:
          "Oranye = deadline kurang 3 hari, merah = deadline 1 hari, merah gelap = sudah lewat, hijau = selesai.",
      },
      {
        title: "Detail Order",
        description:
          "Klik card order untuk membuka detail: komposisi bahan (BOM), timeline produksi, dan perhitungan harga jual.",
      },
    ],
    tips: [
      "Deadline penting — warna card membantu Anda memprioritaskan pengerjaan",
      "Order draft tidak mengurangi stok kain",
    ],
  },

  inventory: {
    title: "Inventory (Stok Kain)",
    description:
      "Pantau stok kain, riwayat harga pembelian, dan sisa bahan per batch.",
    icon: "🏭",
    steps: [
      {
        title: "Grid Stok",
        description:
          "Setiap card menampilkan jenis kain, jumlah stok (kg), dan harga rata-rata. Card merah menandakan stok menipis.",
      },
      {
        title: "Tambah Pembelian",
        description:
          "Tekan tombol + (FAB) untuk mencatat pembelian kain baru: jenis kain, supplier, jumlah, dan harga per kg.",
      },
      {
        title: "Detail Kain",
        description:
          "Klik card untuk melihat riwayat harga per batch (FIFO) dan sisa bahan per batch dengan progress bar.",
      },
      {
        title: "Edit Batch",
        description:
          "Jika terjadi kesalahan input, klik ikon pensil untuk memperbaiki data pembelian.",
      },
    ],
    tips: [
      "Harga kain dihitung dengan metode FIFO — batch lama dipakai lebih dulu",
      "Stok berkurang otomatis saat order masuk produksi",
    ],
  },

  production: {
    title: "Production (Produksi)",
    description:
      "Pantau progress produksi setiap order dan perkiraan waktu selesai.",
    icon: "⚙️",
    steps: [
      {
        title: "Progress Bar",
        description:
          "Menampilkan seberapa jauh order diproses (persentase dari 5 stage: Pengukuran, Pemotongan, Jahit, Finishing, QC).",
      },
      {
        title: "Estimasi vs Aktual",
        description:
          "Setiap stage menampilkan waktu pengerjaan. Hijau = on-track, merah = terlambat dari estimasi.",
      },
      {
        title: "Update Timeline",
        description:
          "Klik card order untuk mengubah status stage (Belum Dimulai → Sedang Dikerjakan → Selesai).",
      },
      {
        title: "ETA",
        description:
          "Estimasi selesai dihitung dari sisa stage dan deadline order.",
      },
    ],
    tips: [
      "Urutkan prioritas: order dengan deadline terdekat tampil di atas",
      "Update timeline secara rutin agar estimasi akurat",
    ],
  },

  reports: {
    title: "Laporan",
    description:
      "Analisis keuangan: omzet, HPP, profit, margin, dan detail transaksi.",
    icon: "📈",
    steps: [
      {
        title: "Filter Periode",
        description:
          "Pilih rentang waktu: Bulan Ini, Bulan Lalu, 3 Bulan, atau tanggal kustom.",
      },
      {
        title: "Card Ringkasan",
        description:
          "Omzet, HPP, profit, dan margin untuk periode terpilih — dengan perbandingan vs periode sebelumnya.",
      },
      {
        title: "Tabel Detail",
        description:
          "Rincian per order: omzet, biaya material, upah, HPP, profit, margin. Klik header kolom untuk mengurutkan.",
      },
      {
        title: "Export",
        description:
          "Unduh laporan sebagai file Excel (CSV) untuk dibagikan atau diarsipkan.",
      },
    ],
    tips: [
      "Gunakan filter periode untuk menganalisis performa bulanan",
      "Top customer & kain terpakai membantu keputusan bisnis",
    ],
  },

  profile: {
    title: "Profile",
    description:
      "Pengaturan akun, data master, dan akses laporan.",
    icon: "👤",
    steps: [
      {
        title: "Pengaturan Profil",
        description:
          "Perbarui nama pemilik, nama usaha, email, dan telepon.",
      },
      {
        title: "Master Fabric",
        description:
          "Kelola daftar jenis kain: tambah, edit, atau hapus. Kain yang sudah punya riwayat tidak bisa dihapus.",
      },
      {
        title: "Laporan",
        description: "Akses halaman laporan keuangan lengkap.",
      },
      {
        title: "Logout",
        description: "Keluar dari aplikasi dan kembali ke halaman login.",
      },
    ],
    tips: [
      "Role owner/admin bisa mengelola data master",
      "Setiap perubahan tersimpan otomatis",
    ],
  },
};

export function getTutorial(key: string): TutorialData | null {
  return TUTORIALS[key] ?? null;
}
