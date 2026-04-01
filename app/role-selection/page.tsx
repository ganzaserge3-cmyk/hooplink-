"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dribbble, Shield, Users, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { saveUserProfile, type HoopLinkRole } from "@/lib/user-profile";

const roles: Array<{
  id: HoopLinkRole;
  title: string;
  description: string;
  icon: typeof Dribbble;
  color: string;
}> = [
  {
    id: "athlete",
    title: "Athlete/Player",
    description: "Showcase your highlights and connect with coaches & scouts",
    icon: Dribbble,
    color: "from-orange-400 to-red-500",
  },
  {
    id: "coach",
    title: "Coach",
    description: "Discover talent and build your team",
    icon: Trophy,
    color: "from-blue-400 to-indigo-500",
  },
  {
    id: "scout",
    title: "Scout",
    description: "Find the next big talent for your organization",
    icon: Shield,
    color: "from-purple-400 to-pink-500",
  },
  {
    id: "fan",
    title: "Fan",
    description: "Follow your favorite athletes and stay updated",
    icon: Users,
    color: "from-green-400 to-emerald-500",
  },
];

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<HoopLinkRole | "">("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (!selectedRole) return;

    if (!auth?.currentUser) {
      setError("Please sign in again to continue.");
      router.push("/login");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await saveUserProfile({
        role: selectedRole,
        sport: "",
        bio: "",
      });
      router.push(`/complete-profile?role=${selectedRole}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your role.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold mb-2">Choose your role</CardTitle>
            <CardDescription className="text-lg">
              Select how you want to use HoopLink
            </CardDescription>
          </CardHeader>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`cursor-pointer hover:shadow-lg transition-all group ${
                selectedRole === role.id ? "ring-2 ring-primary shadow-lg" : ""
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              <CardContent className="p-8 pt-10">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${role.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  <role.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center mb-3">{role.title}</h3>
                <p className="text-muted-foreground text-center mb-6">{role.description}</p>
                {selectedRole === role.id && (
                  <div className="w-full bg-primary/10 border border-primary/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-1/2 animate-pulse" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            className="flex-1 max-w-md mx-auto"
            onClick={() => router.push("/login")}
          >
            Back to Login
          </Button>
          <Button 
            className="flex-1 max-w-md mx-auto font-semibold" 
            onClick={handleContinue}
            disabled={!selectedRole || isSaving}
          >
            {isSaving ? "Saving..." : "Continue"}
          </Button>
        </div>
        {error ? (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
