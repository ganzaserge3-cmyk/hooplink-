"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, LogIn, LogOut, Menu, MessageCircle, Search, Settings, UserPlus } from "lucide-react";
import { signOut } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { subscribeToNotifications, type AppNotification } from "@/lib/notifications";
import { useAuthContext } from "@/components/AuthProvider";
import BrandMark from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { subscribeToConversations, type ConversationSummary } from "@/lib/messaging";

const navLinks = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];

export default function Navbar() {
  const { user, loading } = useAuthContext();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeToNotifications(user.uid, setNotifications);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribeToConversations(user.uid, setConversations);
  }, [user]);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = user ? notifications.filter((n) => !n.readBy?.includes(user.uid)).length : 0;
  const unreadMessages = user ? conversations.filter((c) => c.unreadBy.includes(user.uid)).length : 0;

  if (pathname === "/role-selection" || pathname === "/complete-profile") return null;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href={user ? "/feed" : "/"} aria-label="HoopLink">
          <BrandMark className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-md border bg-muted/50" />
          ) : user ? (
            <>
              {/* Desktop nav */}
              <div className="hidden items-center gap-1 md:flex">
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <Button key={href} variant="ghost" size="sm" asChild>
                    <Link href={href} className="relative">
                      <Icon className="mr-2 h-4 w-4" />
                      {label}
                      {href === "/notifications" && unreadCount > 0 && (
                        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                          {unreadCount}
                        </span>
                      )}
                      {href === "/messages" && unreadMessages > 0 && (
                        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                          {unreadMessages}
                        </span>
                      )}
                    </Link>
                  </Button>
                ))}
                <Button size="sm" asChild><Link href="/upload">+ Post</Link></Button>
                <Button variant="ghost" size="sm" asChild><Link href="/profile">Profile</Link></Button>
                <Button variant="ghost" size="sm" asChild><Link href="/settings"><Settings className="h-4 w-4" /></Link></Button>
                <Button variant="outline" size="sm" onClick={() => auth && void signOut(auth)}>
                  <LogOut className="mr-2 h-4 w-4" />Logout
                </Button>
              </div>

              {/* Mobile icons */}
              <div className="flex items-center gap-1 md:hidden">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/messages" className="relative">
                    <MessageCircle className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                        {unreadMessages}
                      </span>
                    )}
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/notifications" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </Button>
                <div ref={mobileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((v) => !v)}
                    className="flex h-10 w-10 items-center justify-center rounded-md border"
                    aria-label="Menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  {mobileMenuOpen && (
                    <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border bg-background p-3 shadow-lg space-y-1">
                      {navLinks.map(({ href, label, icon: Icon }) => (
                        <Button key={href} variant="ghost" size="sm" asChild className="w-full justify-start">
                          <Link href={href}><Icon className="mr-2 h-4 w-4" />{label}</Link>
                        </Button>
                      ))}
                      <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                        <Link href="/profile">Profile</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                        <Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => auth && void signOut(auth)}>
                        <LogOut className="mr-2 h-4 w-4" />Logout
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup"><UserPlus className="mr-2 h-4 w-4" />Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
