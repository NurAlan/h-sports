import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan akses dev server dari device lain di jaringan (mobile testing).
  // Catatan: Next.js memblokir wildcard tunggal ('*' / '**') — hanya wildcard
  // per-segment yang valid, contoh: '192.168.*.*' match semua IP di subnet.
  // IP user berubah-ubah (DHCP WiFi / Tailscale), jadi daftarkan subnet umum.
  allowedDevOrigins: [
    "192.168.*.*",
    "100.*.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
};

export default nextConfig;
