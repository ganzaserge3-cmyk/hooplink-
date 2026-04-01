"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, PlayCircle, PlusSquare, User } from "lucide-react";

import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

export default function BottomNav() {
  const { user } = useAuthContext();

  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-3">
        <Link href="/feed" className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 hover:bg-muted">
          <Home className="h-6 w-6" />
          <span className="text-xs">Feed</span>
        </Link>
        <Link href="/reels" className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 hover:bg-muted">
          <PlayCircle className="h-6 w-6" />
          <span className="text-xs">Reels</span>
        </Link>
        <Button size="icon" className="h-12 w-12 rounded-2xl shadow-lg" asChild>
          <Link href="/upload">
            <PlusSquare className="h-5 w-5" />
          </Link>
        </Button>
        <Link href="/profile" className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 hover:bg-muted">
          <User className="h-6 w-6" />
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </div>
  );
}
