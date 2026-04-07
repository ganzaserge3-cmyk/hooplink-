"use client";

import { GamificationDashboard } from "@/components/GamificationDashboard";
import Link from "next/link";

export default function GamificationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Achievements & Challenges</h1>
        <p className="text-muted-foreground">
          Track your progress, unlock achievements, and earn rewards for your HoopLink activity.
        </p>
      </div>

      <GamificationDashboard />
    </div>
  );
}
