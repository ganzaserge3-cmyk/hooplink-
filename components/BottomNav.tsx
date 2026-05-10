"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, PlusSquare, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/components/AuthProvider";

const tabs = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const { user } = useAuthContext();
  const pathname = usePathname();

  if (!user || pathname === "/role-selection" || pathname === "/complete-profile") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-3">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 hover:bg-muted ${pathname === href ? "text-primary" : ""}`}>
            <Icon className="h-6 w-6" />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
        <Button size="icon" className="h-12 w-12 rounded-2xl shadow-lg" asChild>
          <Link href="/upload"><PlusSquare className="h-5 w-5" /></Link>
        </Button>
      </div>
    </div>
  );
}
