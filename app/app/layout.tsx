import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNavWrapper } from "@/components/bottom-nav-wrapper";
import { ToastProvider } from "@/components/toast/toast-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "H-Sport — Textile Production Management",
  description: "Inventory, costing, and production tracking for textile manufacturing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="antialiased bg-background text-foreground">
        <ToastProvider>
          {/* Main content dengan padding bottom untuk bottom nav */}
          <main className="pb-20 min-h-screen bg-gray-50">
            {children}
          </main>

          {/* Bottom Navigation (fixed) — disembunyikan di /login */}
          <BottomNavWrapper />
        </ToastProvider>
      </body>
    </html>
  );
}
