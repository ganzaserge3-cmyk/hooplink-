"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { FollowButton } from "@/components/FollowButton";
import { FollowSuggestions } from "@/components/FollowSuggestions";
import { getFollowStats, getMutualFollowers, type FollowStats } from "@/lib/follow-system";
import { searchProfiles, getUserProfileById, type SearchProfile } from "@/lib/user-profile";

interface AthleteCard extends SearchProfile {
  followStats?: FollowStats;
}

/**
 * DISCOVER PAGE EXAMPLE
 * 
 * This page demonstrates how to use the complete follow system:
 * - Display follow suggestions
 * - Show follower/following stats
 * - Display mutual connections
 * - Search and filter users
 * - Follow/unfollow with instant feedback
 */
export default function DiscoverExample() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<AthleteCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSport, setFilterSport] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"suggestions" | "search" | "trending">("suggestions");

  // Load initial data
  useEffect(() => {
    loadTrendingAthletes();
  }, []);

  const loadTrendingAthletes = async () => {
    try {
      setLoading(true);
      // In a real app, you'd have a "trending" query
      // For now, fetch some profiles and sort by followers
      const profiles = await searchProfiles("athlete");
      
      // Enrich with stats
      const enriched = await Promise.all(
        profiles.map(async (profile: SearchProfile) => ({
          ...profile,
          followStats: await getFollowStats(profile.uid || ""),
        }))
      );
      
      setAthletes(enriched.sort((a, b) => 
        (b.followStats?.followers || 0) - (a.followStats?.followers || 0)
      ));
    } catch (error) {
      console.error("Error loading athletes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      loadTrendingAthletes();
      return;
    }

    try {
      setLoading(true);
      const results = await searchProfiles(term);
      
      const enriched = await Promise.all(
        results.map(async (profile: SearchProfile) => ({
          ...profile,
          followStats: await getFollowStats(profile.uid || ""),
        }))
      );
      
      setAthletes(enriched);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = athletes.filter((athlete) => {
    if (filterSport !== "all" && athlete.role?.sport !== filterSport) {
      return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Discover Athletes</h1>
        <p className="text-muted-foreground">
          Follow athletes, coaches, and scouts to build your network
        </p>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="suggestions">Suggested</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        {/* SUGGESTIONS TAB */}
        <TabsContent value="suggestions" className="space-y-6">
          <FollowSuggestions limit={8} title="Suggested For You" />
        </TabsContent>

        {/* SEARCH TAB */}
        <TabsContent value="search" className="space-y-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search athletes, coaches, scouts..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full px-4 py-2 rounded-lg border bg-background"
            />
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterSport === "all" ? "default" : "outline"}
                onClick={() => setFilterSport("all")}
                size="sm"
              >
                All Sports
              </Button>
              {["Basketball", "Football", "Baseball", "Soccer"].map((sport) => (
                <Button
                  key={sport}
                  variant={filterSport === sport ? "default" : "outline"}
                  onClick={() => setFilterSport(sport)}
                  size="sm"
                >
                  {sport}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredAthletes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No athletes found. Try a different search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAthletes.map((athlete) => (
                <AthleteCardWithFollow key={athlete.uid} athlete={athlete} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* TRENDING TAB */}
        <TabsContent value="trending" className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterSport === "all" ? "default" : "outline"}
                onClick={() => setFilterSport("all")}
                size="sm"
              >
                All Sports
              </Button>
              {["Basketball", "Football", "Baseball", "Soccer"].map((sport) => (
                <Button
                  key={sport}
                  variant={filterSport === sport ? "default" : "outline"}
                  onClick={() => setFilterSport(sport)}
                  size="sm"
                >
                  {sport}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAthletes.map((athlete, idx) => (
                <TrendingAthleteCard 
                  key={athlete.uid} 
                  athlete={athlete} 
                  rank={idx + 1}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * ATHLETE CARD WITH FOLLOW BUTTON
 * Shows:
 * - Profile info
 * - Follower count
 * - Mutual followers
 * - Follow/Unfollow button
 */
function AthleteCardWithFollow({ athlete }: { athlete: AthleteCard }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(athlete.followStats);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (user && stats) {
      setIsFollowing(stats.isFollowedByCurrentUser);
    }
  }, [user, stats]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition">
      {/* Cover Photo */}
      <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-500">
        {athlete.coverPhotoURL && (
          <img 
            src={athlete.coverPhotoURL} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <CardContent className="p-4 space-y-4 -mt-8 relative z-10">
        {/* Avatar */}
        <div className="flex justify-between items-start">
          <Link href={`/profile/${athlete.uid}`}>
            <Avatar className="h-16 w-16 border-4 border-white cursor-pointer hover:opacity-80">
              <AvatarImage src={athlete.photoURL || ""} />
              <AvatarFallback>{athlete.displayName?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          {athlete.verified && (
            <Badge variant="secondary">Verified</Badge>
          )}
        </div>

        {/* Profile Info */}
        <div>
          <Link href={`/profile/${athlete.uid}`} className="hover:underline">
            <h3 className="font-bold text-lg">{athlete.displayName}</h3>
          </Link>
          <p className="text-sm text-muted-foreground">
            {athlete.role?.sport}
            {athlete.role?.position ? ` • ${athlete.role.position}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {athlete.location || athlete.identity?.hometown || "Location not set"}
          </p>
        </div>

        {/* Bio */}
        {athlete.role?.bio && (
          <p className="text-sm line-clamp-2">{athlete.role.bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div>
            <p className="font-bold">{stats?.followers || 0}</p>
            <p className="text-muted-foreground text-xs">Followers</p>
          </div>
          {stats && stats.mutualFollowers > 0 && (
            <div>
              <p className="font-bold text-primary">{stats.mutualFollowers}</p>
              <p className="text-muted-foreground text-xs">Mutual</p>
            </div>
          )}
        </div>

        {/* Follow Button */}
        <div className="pt-2 flex gap-2">
          <FollowButton
            targetUid={athlete.uid || ""}
            isFollowing={isFollowing}
            displayName={athlete.displayName}
            onFollowChange={(newStatus) => {
              setIsFollowing(newStatus);
              if (stats) {
                setStats({
                  ...stats,
                  followers: newStatus ? stats.followers + 1 : stats.followers - 1,
                  isFollowedByCurrentUser: newStatus,
                });
              }
            }}
            className="flex-1"
          />
          <Button variant="outline" asChild className="flex-1">
            <Link href={`/profile/${athlete.uid}`}>View</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * TRENDING ATHLETE CARD
 * Shows rank badge + all stats
 */
function TrendingAthleteCard({ 
  athlete, 
  rank 
}: { 
  athlete: AthleteCard
  rank: number
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-2 right-2 z-10">
        <Badge className="text-lg px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600">
          #{rank}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-4">
        <div className="flex gap-3">
          <Link href={`/profile/${athlete.uid}`}>
            <Avatar className="h-14 w-14 cursor-pointer hover:opacity-80">
              <AvatarImage src={athlete.photoURL || ""} />
              <AvatarFallback>{athlete.displayName?.slice(0, 2)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${athlete.uid}`} className="hover:underline">
              <h3 className="font-bold truncate">{athlete.displayName}</h3>
            </Link>
            <p className="text-xs text-muted-foreground">
              {athlete.role?.sport}
              {athlete.role?.position ? ` • ${athlete.role.position}` : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-muted p-2 rounded">
            <p className="font-bold">{athlete.followStats?.followers || 0}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="bg-muted p-2 rounded">
            <p className="font-bold text-primary">{athlete.followStats?.mutualFollowers || 0}</p>
            <p className="text-xs text-muted-foreground">Mutual</p>
          </div>
        </div>

        <FollowButton
          targetUid={athlete.uid || ""}
          isFollowing={athlete.followStats?.isFollowedByCurrentUser || false}
          displayName={athlete.displayName}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
