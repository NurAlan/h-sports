import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { BottomNavWrapper } from "@/components/bottom-nav-wrapper";
import { ToastProvider } from "@/components/toast/toast-provider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "H-Sport — Manajemen Produksi Tekstil",
  description: "Inventaris, costing, dan pelacakan produksi untuk manufaktur tekstil",
  openGraph: {
    title: "H-Sport",
    description: "Manajemen produksi tekstil — inventaris, costing, dan pelacakan order",
    type: "website",
    locale: "id_ID",
    siteName: "H-Sport",
  },
  twitter: {
    card: "summary",
    title: "H-Sport",
    description: "Manajemen produksi tekstil",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F4F2" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1917" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={outfit.variable}>
      <body className="antialiased bg-background text-foreground font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-base focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none"
        >
          Lewati ke konten
        </a>
        <ToastProvider>
          <main
            id="main-content"
            tabIndex={-1}
            className="pb-28 min-h-dvh bg-background outline-none"
          >
            {children}
          </main>
          <BottomNavWrapper />
        </ToastProvider>
      </body>
    </html>
  );
}
