"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function VirtualTryouts() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-12">
      <Card className="w-full">
        <CardContent className="space-y-5 p-8">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Virtual tryouts</p>
            <h1 className="text-3xl font-bold tracking-tight">Share your best tape with coaches.</h1>
            <p className="text-muted-foreground">
              Upload highlights, tag your sport and position, and keep your recruiting profile ready for review.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/upload?template=tryout_tape">Upload tryout tape</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/recruiting-ready">Recruiting checklist</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
