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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-stone-50/95 backdrop-blur-sm border-t border-stone-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
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
                "relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-lg transition-all duration-200 active:scale-95",
                isActive
                  ? "text-blue-600"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center w-10 h-8 rounded-md transition-colors duration-200",
                isActive && "bg-blue-100"
              )}>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-blue-600" />
                )}
              </div>
              <span className={cn(
                "text-[10px] transition-all duration-200",
                isActive ? "font-semibold text-blue-700" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
