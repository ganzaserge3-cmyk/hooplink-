"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  Plus,
  Filter,
  Search,
  Calendar,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveStreamCard } from "@/components/LiveStreamCard";
import { useAuth } from "@/hooks/useAuth";
import {
  getLiveStreams,
  subscribeToLiveStreams,
  joinLiveStream,
} from "@/lib/live-stream";
import type { LiveStream } from "@/types/live-stream";

export default function LiveStreamsPage() {
  const { user } = useAuth();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("live");

  useEffect(() => {
    const loadStreams = async () => {
      try {
        const streams = await getLiveStreams();
        setLiveStreams(streams);
      } catch (error) {
        console.error("Error loading live streams:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStreams();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToLiveStreams(setLiveStreams);
    return unsubscribe;
  }, []);

  useEffect(() => {
    let filtered = liveStreams;

    // Filter by tab
    if (activeTab === "live") {
      filtered = filtered.filter(stream => stream.status === "live");
    } else if (activeTab === "scheduled") {
      filtered = filtered.filter(stream => stream.status === "scheduled");
    } else if (activeTab === "my-streams" && user) {
      filtered = filtered.filter(stream => stream.hostId === user.uid);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(stream =>
        stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.hostName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by sport
    if (selectedSport !== "all") {
      filtered = filtered.filter(stream => stream.sport === selectedSport);
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(stream => stream.category === selectedCategory);
    }

    setFilteredStreams(filtered);
  }, [liveStreams, activeTab, searchQuery, selectedSport, selectedCategory, user]);

  const handleJoinStream = async (streamId: string) => {
    try {
      await joinLiveStream(streamId);
      // Navigate to the stream viewer
      window.location.href = `/live-stream/${streamId}/watch`;
    } catch (error) {
      console.error("Error joining stream:", error);
    }
  };

  const handleShareStream = (stream: LiveStream) => {
    const url = `${window.location.origin}/live-stream/${stream.id}`;
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  const sports = Array.from(new Set(liveStreams.map(stream => stream.sport)));
  const categories: LiveStream['category'][] = ['training', 'game', 'workout', 'q&a', 'recruiting', 'general'];

  const liveCount = liveStreams.filter(s => s.status === 'live').length;
  const scheduledCount = liveStreams.filter(s => s.status === 'scheduled').length;
  const myStreamsCount = user ? liveStreams.filter(s => s.hostId === user.uid).length : 0;

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Live Streams</h1>
          <p>Loading live streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Live Streams</h1>
          <p className="text-muted-foreground">
            Watch live training sessions, games, and connect with the HoopLink community
          </p>
        </div>

        {user && (
          <Button asChild>
            <Link href="/live-stream/create">
              <Plus className="h-4 w-4 mr-2" />
              Go Live
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Play className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{liveCount}</p>
                <p className="text-sm text-muted-foreground">Live Now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledCount}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {liveStreams.reduce((sum, stream) => sum + stream.viewerCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Viewers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search streams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedSport} onValueChange={setSelectedSport}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Sports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {sports.map((sport) => (
              <SelectItem key={sport} value={sport}>
                {sport}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Live ({liveCount})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled ({scheduledCount})
          </TabsTrigger>
          {user && (
            <TabsTrigger value="my-streams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Streams ({myStreamsCount})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="live" className="mt-6">
          {filteredStreams.length === 0 ? (
            <div className="text-center py-12">
              <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No live streams right now</h3>
              <p className="text-muted-foreground mb-4">
                Check back later or start your own live stream!
              </p>
              {user && (
                <Button asChild>
                  <Link href="/live-stream/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Go Live
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStreams.map((stream) => (
                <LiveStreamCard
                  key={stream.id}
                  stream={stream}
                  onJoin={handleJoinStream}
                  onShare={handleShareStream}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          {filteredStreams.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scheduled streams</h3>
              <p className="text-muted-foreground mb-4">
                No streams are scheduled right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStreams.map((stream) => (
                <LiveStreamCard
                  key={stream.id}
                  stream={stream}
                  onJoin={handleJoinStream}
                  onShare={handleShareStream}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {user && (
          <TabsContent value="my-streams" className="mt-6">
            {filteredStreams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No streams yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven&apos;t created any live streams yet.
                </p>
                <Button asChild>
                  <Link href="/live-stream/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Stream
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStreams.map((stream) => (
                  <LiveStreamCard
                    key={stream.id}
                    stream={stream}
                    showHost={false}
                    onJoin={handleJoinStream}
                    onShare={handleShareStream}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}