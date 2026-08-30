import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
        Halaman tidak ditemukan
      </h1>
      <p className="text-base text-muted-foreground max-w-sm mb-6">
        URL yang Anda minta tidak ada atau sudah dipindahkan. Periksa kembali alamat yang Anda masukkan.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-base font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors duration-200"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
