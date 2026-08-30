// Data penjelasan setiap menu & alur bisnis — dipakai untuk in-app tutorial & dialog bantuan

export interface TutorialStep {
  title: string;
  description: string;
  badge?: string;
}

export interface TutorialData {
  title: string;
  subtitle?: string;
  description: string;
  icon: string;
  steps: TutorialStep[];
  tips: string[];
}

export interface OnboardingSlide {
  stepNumber: number;
  title: string;
  badge: string;
  icon: string;
  headline: string;
  description: string;
  keyPoints: string[];
  actionLink?: string;
  actionText?: string;
}

export const ONBOARDING_JOURNEY: OnboardingSlide[] = [
  {
    stepNumber: 1,
    title: "Stok Kain & FIFO",
    badge: "Langkah 1",
    icon: "🏭",
    headline: "Catat Pembelian Kain & Pantau Stok per Batch",
    description:
      "Sebelum membuat pesanan, pastikan bahan kain tersedia. Setiap pembelian dicatat per warna dan batch harga menggunakan metode FIFO (First-In, First-Out).",
    keyPoints: [
      "Buka menu Inventory untuk melihat stok kg dan harga rata-rata",
      "Tekan tombol + untuk mencatat pembelian kain baru per warna",
      "Sistem otomatis menghitung HPP berdasarkan batch kain tertua",
    ],
    actionLink: "/inventory",
    actionText: "Buka Inventory",
  },
  {
    stepNumber: 2,
    title: "Buat Pesanan",
    badge: "Langkah 2",
    icon: "📦",
    headline: "Terima & Catat Pesanan Kaos dari Customer",
    description:
      "Catat informasi pelanggan, jumlah pcs kaos, tanggal pesanan, spesifikasi sablon/bordir, serta batas waktu pengerjaan (deadline).",
    keyPoints: [
      "Buka menu Orders dan tekan tombol + di kanan bawah",
      "Status awal pesanan adalah Draft (belum mengurangi stok kain)",
      "Warna kartu membantu memprioritaskan order mendekati deadline",
    ],
    actionLink: "/orders",
    actionText: "Buka Orders",
  },
  {
    stepNumber: 3,
    title: "BOM & Costing",
    badge: "Langkah 3",
    icon: "💰",
    headline: "Rancang Komposisi Bahan & Hitung Harga Jual",
    description:
      "Buka detail pesanan untuk menambahkan komposisi bahan (BOM) dengan waste %, lalu tentukan harga jual dengan kalkulator costing otomatis.",
    keyPoints: [
      "Pilih jenis kain & warna yang dibutuhkan per order",
      "Kalkulator menghitung HPP (Bahan + Upah Jahit + Biaya Lain-lain)",
      "Pilih metode Markup (%) atau Profit Tetap untuk harga jual akurat",
    ],
    actionLink: "/orders",
    actionText: "Lihat Contoh Order",
  },
  {
    stepNumber: 4,
    title: "Produksi & Timeline",
    badge: "Langkah 4",
    icon: "⚙️",
    headline: "Mulai Produksi, Potong Stok & Catat Riwayat Tanggal",
    description:
      "Klik 'Mulai Produksi' di detail order. Stok kain akan dipotong otomatis dengan FIFO dan 5 tahapan produksi akan aktif.",
    keyPoints: [
      "5 Tahapan: Pengukuran → Pemotongan → Jahit → Finishing → QC",
      "Catat tanggal mulai & selesai tiap tahapan untuk evaluasi durasi",
      "Pantau seluruh pesanan aktif langsung di menu Timeline/Production",
    ],
    actionLink: "/production",
    actionText: "Buka Production",
  },
  {
    stepNumber: 5,
    title: "QC & Laporan",
    badge: "Langkah 5",
    icon: "📈",
    headline: "Pemeriksaan Akhir, Kirim Pesanan & Evaluasi Profit",
    description:
      "Setelah tahapan QC selesai, tandai pesanan sebagai Selesai. Semua omzet, biaya aktual, dan profit bersih otomatis masuk ke Laporan Keuangan.",
    keyPoints: [
      "Lihat ringkasan keuntungan bulan berjalan di Dashboard",
      "Buka menu Laporan untuk analisis profit per order & performa produksi",
      "Download laporan keuangan dalam format Excel/CSV kapan saja",
    ],
    actionLink: "/reports",
    actionText: "Buka Laporan",
  },
];

export const TUTORIALS: Record<string, TutorialData> = {
  core_journey: {
    title: "Alur Lengkap Bisnis H-Sport",
    subtitle: "5 Langkah dari Terima Pesanan hingga Kirim Kaos",
    description:
      "Panduan langkah demi langkah bagaimana sistem H-Sport menghubungkan stok kain, pesanan, perhitungan profit, dan produksi.",
    icon: "🚀",
    steps: [
      {
        title: "1. Input Pembelian Kain (Inventory)",
        description: "Catat stok kain per warna dan batch harga. Sistem menggunakan FIFO agar perhitungan modal bahan akurat.",
      },
      {
        title: "2. Buat Order Baru (Status: Draft)",
        description: "Catat customer, jumlah pcs, spesifikasi, dan tanggal deadline pesanan.",
      },
      {
        title: "3. Susun BOM & Hitung Harga Jual (Costing)",
        description: "Tentukan kebutuhan kain per order dan hitung HPP + target profit dengan margin yang sehat.",
      },
      {
        title: "4. Klik 'Mulai Produksi' & Update Timeline",
        description: "Stok kain dipotong otomatis secara FIFO. Catat tanggal riwayat mulai dan selesai pada setiap tahapan.",
      },
      {
        title: "5. Tandai Selesai & Pantau Laporan Keuangan",
        description: "Setelah QC dan pengiriman, evaluasi performa bisnis di menu Laporan dan Dashboard.",
      },
    ],
    tips: [
      "Selalu input pembelian kain sebelum membuat order agar harga material otomatis terisi.",
      "Tombol 'Mulai Produksi' akan memotong stok kain di database secara instan.",
    ],
  },

  dashboard: {
    title: "Dashboard",
    subtitle: "Ringkasan Performa Bisnis Real-time",
    description:
      "Tampilan utama yang merangkum kondisi keuangan, kesehatan stok kain, dan pesanan prioritas dalam sekali lihat.",
    icon: "📊",
    steps: [
      {
        title: "Profit Bulan Ini",
        description:
          "Card paling atas menampilkan keuntungan bersih bulan berjalan, tren vs bulan lalu, dan rata-rata margin profit.",
      },
      {
        title: "Grafik Omzet vs Profit",
        description:
          "Grafik 6 bulan terakhir untuk melihat tren pertumbuhan omzet dan efisiensi biaya operasional.",
      },
      {
        title: "Komposisi Stok Kain",
        description:
          "Donut chart menunjukkan porsi stok per jenis kain — membantu mendeteksi kain mana yang menipis.",
      },
      {
        title: "Order Mendekati Deadline",
        description:
          "Daftar pesanan aktif yang harus segera diselesaikan dengan indikator warna urgensi deadline.",
      },
    ],
    tips: [
      "Card stok menipis bertanda merah — segera lakukan pembelian kain tambahan.",
      "Klik kartu pesanan di daftar untuk langsung membuka rincian order.",
    ],
  },

  orders: {
    title: "Orders (Pesanan)",
    subtitle: "Kelola Alur Pesanan Pelanggan",
    description:
      "Kelola seluruh pesanan kaos dari customer — dari penerimaan order hingga pengiriman barang jadi.",
    icon: "📦",
    steps: [
      {
        title: "Buat Order Baru (+)",
        description:
          "Tekan tombol + di kanan bawah untuk mencatat nama customer, jumlah pcs, spesifikasi, dan deadline.",
      },
      {
        title: "Filter Status & Search",
        description:
          "Cari nama pemesan dan filter status menggunakan chip scrollable: Semua, Draft, Produksi, QC, atau Selesai.",
      },
      {
        title: "Warna Tingkat Urgensi Card",
        description:
          "Oranye = sisa < 3 hari, Merah = sisa < 1 hari, Merah Gelap = Terlambat, Hijau = Selesai.",
      },
      {
        title: "Detail Order",
        description:
          "Klik kartu order untuk menyusun bahan (BOM), menghitung harga jual (Costing), dan memantau timeline.",
      },
    ],
    tips: [
      "Order berstatus Draft belum memotong stok kain di gudang.",
      "Prioritaskan order bertanda merah untuk mencegah komplain keterlambatan.",
    ],
  },

  order_detail: {
    title: "Detail Pesanan & Costing",
    subtitle: "Komposisi Bahan, HPP, Margin & Timeline",
    description:
      "Pusat pengelolaan teknis pesanan: susun BOM bahan kain, tentukan harga jual, dan lacak tahapan pengerjaan.",
    icon: "📋",
    steps: [
      {
        title: "Status Progression",
        description:
          "Klik tombol 'Mulai Produksi' untuk mengubah status dari Draft. Tombol ini otomatis memotong stok kain secara FIFO.",
      },
      {
        title: "Komposisi Bahan (BOM)",
        description:
          "Tambahkan kain & warna yang dibutuhkan. Masukkan persentase toleransi sisa (waste %) untuk menghitung kebutuhan aktual.",
      },
      {
        title: "Kalkulator Costing (HPP & Margin)",
        description:
          "Hitung otomatis total HPP (Bahan + Upah Jahit + Ongkir + Biaya Lain) dan pilih Markup % atau Target Profit Tetap.",
      },
      {
        title: "Timeline Produksi Vertikal",
        description:
          "Lacak tanggal masuk dan selesai untuk 5 tahapan pengerjaan (Pengukuran, Pemotongan, Jahit, Finishing, QC).",
      },
    ],
    tips: [
      "Pastikan bahan BOM sudah diinput sebelum menekan tombol Hitung Harga Jual.",
      "Data tanggal mulai & selesai pada timeline otomatis tersimpan dan menghitung durasi pengerjaan.",
    ],
  },

  inventory: {
    title: "Inventory (Stok Kain)",
    subtitle: "Manajemen Gudang & Pembelian Batch",
    description:
      "Pantau ketersediaan stok kain, batas aman reorder point, dan riwayat harga beli per supplier.",
    icon: "🏭",
    steps: [
      {
        title: "Ringkasan Stok & Reorder Point",
        description:
          "Setiap card menampilkan total stok (kg) dan harga rata-rata. Card berwarna merah menandakan stok di bawah batas aman.",
      },
      {
        title: "Tambah Pembelian Kain (+)",
        description:
          "Tekan tombol + di kanan bawah untuk mencatat pembelian baru: pilih jenis kain, warna, supplier, jumlah kg, dan harga.",
      },
      {
        title: "Warna Kain Terintegrasi",
        description:
          "Setiap kain dapat memiliki banyak warna. Warna baru otomatis terdaftar saat pembelian pertama kali dilakukan.",
      },
      {
        title: "Buka Detail Batch (FIFO)",
        description:
          "Klik card kain untuk melihat sisa stok per batch pembelian dan alokasi yang telah terpakai oleh pesanan.",
      },
    ],
    tips: [
      "Harga kain dihitung otomatis dengan metode FIFO — batch pembelian tertua dipakai lebih dahulu.",
      "Stok akan otomatis terpotong saat status order dipindahkan ke Produksi.",
    ],
  },

  inventory_detail: {
    title: "Detail Kain & Riwayat Batch",
    subtitle: "Pelacakan FIFO dan Pemakaian Bahan",
    description:
      "Melihat rincian setiap batch pembelian kain, harga per kg saat beli, sisa kg, dan daftar warna aktif.",
    icon: "🧵",
    steps: [
      {
        title: "Kartu Batch Pembelian",
        description:
          "Menampilkan tanggal beli, nama supplier, harga/kg, jumlah awal, dan sisa bahan yang masih tersedia.",
      },
      {
        title: "Alokasi FIFO",
        description:
          "Sistem otomatis mengonsumsi stok dari batch paling atas (tertua) sampai habis sebelum beralih ke batch berikutnya.",
      },
      {
        title: "Edit & Koreksi Data",
        description:
          "Gunakan tombol edit pada batch jika terdapat koreksi harga per kg atau jumlah pembelian dari supplier.",
      },
    ],
    tips: [
      "Batch dengan sisa 0 kg akan ditandai 'Terpakai Penuh'.",
      "Harga HPP pada order mengunci harga batch saat order tersebut masuk produksi.",
    ],
  },

  production: {
    title: "Production (Timeline)",
    subtitle: "Monitoring Tahapan Pengerjaan",
    description:
      "Memantau seluruh order yang sedang dikerjakan di konveksi dan mencatat riwayat tanggal penyelesaian tiap stage.",
    icon: "⚙️",
    steps: [
      {
        title: "Progress Bar Produksi",
        description:
          "Menampilkan persentase penyelesaian dari 5 tahapan (Pengukuran, Pemotongan, Jahit, Finishing, QC).",
      },
      {
        title: "Riwayat Tanggal & Durasi",
        description:
          "Melihat tanggal mulai dan tanggal selesai per tahapan, serta lama waktu pengerjaan (misal: 2 hari).",
      },
      {
        title: "Update Status Tahapan",
        description:
          "Klik kartu order untuk membuka dialog pembaruan status (Belum Dimulai → Sedang Dikerjakan → Selesai).",
      },
      {
        title: "Pencegahan Keterlambatan",
        description:
          "Urutan pesanan diprioritaskan berdasarkan deadline terdekat agar tim fokus pada pekerjaan mendesak.",
      },
    ],
    tips: [
      "Saat stage diubah ke 'Sedang Dikerjakan', tanggal mulai otomatis terisi hari ini.",
      "Saat stage diubah ke 'Selesai', tanggal selesai otomatis terisi hari ini.",
    ],
  },

  reports: {
    title: "Laporan Keuangan & Produksi",
    subtitle: "Analisis Profit, Lead Time & Customer",
    description:
      "Menganalisis pendapatan omzet, HPP modal kain & upah, keuntungan bersih, serta performa kecepatan produksi.",
    icon: "📈",
    steps: [
      {
        title: "Filter Periode Waktu",
        description:
          "Pilih rentang analisis: Bulan Ini, Bulan Lalu, 3 Bulan Terakhir, atau rentang tanggal kustom.",
      },
      {
        title: "Tab 1: Laporan Keuangan",
        description:
          "Menampilkan total omzet, HPP, laba kotor, margin %, dan tabel rincian laba per nomor order.",
      },
      {
        title: "Tab 2: Laporan Produksi",
        description:
          "Menganalisis jumlah order selesai, lead time rata-rata (hari), dan rata-rata durasi per tahapan.",
      },
      {
        title: "Tab 3: Top Customer",
        description:
          "Melihat pelanggan dengan frekuensi order tertinggi dan kontribusi omzet terbesar bagi usaha.",
      },
    ],
    tips: [
      "Gunakan fitur Ekspor Excel/CSV untuk membackup pembukuan atau laporan ke mitra bisnis.",
      "Tabel laporan dapat diurutkan berdasarkan profit tertinggi untuk evaluasi pesanan terbaik.",
    ],
  },

  profile: {
    title: "Profile & Pengaturan",
    subtitle: "Identitas Usaha & Data Master",
    description:
      "Pengaturan profil pemilik, nama konveksi/apparel, master jenis kain, dan panduan lengkap aplikasi.",
    icon: "👤",
    steps: [
      {
        title: "Pengaturan Profil Usaha",
        description:
          "Ubah nama pemilik, nama brand konveksi, dan nomor telepon yang tersimpan aman di database.",
      },
      {
        title: "Master Kain",
        description:
          "Kelola katalog jenis kain utama (misal Cotton Combed 30s, 24s, Lacoste) beserta unit dan reorder point.",
      },
      {
        title: "Panduan Lengkap Bisnis",
        description:
          "Buka kembali alur panduan 5 langkah kapan saja untuk mereview alur kerja operasional.",
      },
      {
        title: "Keluar (Logout)",
        description:
          "Mengakhiri sesi akun dengan aman dan kembali ke halaman login.",
      },
    ],
    tips: [
      "Data usaha yang diisi di Pengaturan Profil akan tampil di seluruh laporan dan identitas akun.",
      "Kain yang sudah memiliki transaksi pembelian tidak dapat dihapus untuk menjaga integritas data.",
    ],
  },
};

export function getTutorial(key: string): TutorialData | null {
  return TUTORIALS[key] ?? null;
}
