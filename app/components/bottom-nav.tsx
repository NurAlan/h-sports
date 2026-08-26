"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock3, ShoppingCart, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Clock3, label: "Timeline", href: "/production" },
  { icon: ShoppingCart, label: "Order", href: "/orders" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: User, label: "Profile", href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          // Active state: exact match untuk Home, prefix match untuk sub-halaman
          // (contoh: /inventory/1 tetap mengaktifkan menu Inventory)
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[60px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
