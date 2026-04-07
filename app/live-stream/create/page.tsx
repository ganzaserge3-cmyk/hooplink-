"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Settings, Users, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentUserProfile } from "@/lib/user-profile";
import { createLiveStream } from "@/lib/live-stream";
import type { LiveStream } from "@/types/live-stream";

export default function CreateLiveStreamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sport: "",
    category: "general" as LiveStream['category'],
    isPrivate: false,
    allowChat: true,
    allowRecording: true,
    requireApproval: false,
    ageRestriction: "all" as "all" | "13+" | "18+",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  const categories: { value: LiveStream['category']; label: string; description: string }[] = [
    { value: "training", label: "Training Session", description: "Share your workout or practice session" },
    { value: "game", label: "Live Game", description: "Broadcast a game or match" },
    { value: "workout", label: "Workout", description: "Live fitness or training session" },
    { value: "q&a", label: "Q&A Session", description: "Answer questions from the community" },
    { value: "recruiting", label: "Recruiting Session", description: "Connect with potential recruits" },
    { value: "general", label: "General", description: "Other types of live content" },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Get user's sport preference
      const profile = await getCurrentUserProfile();
      const defaultSport = profile?.role?.sport || "Basketball";

      const streamData = {
        ...formData,
        sport: formData.sport || defaultSport,
        scheduledFor: new Date(), // Start immediately
        settings: {
          allowChat: formData.allowChat,
          allowRecording: formData.allowRecording,
          requireApproval: formData.requireApproval,
          ageRestriction: formData.ageRestriction,
        },
      };

      const result = await createLiveStream(streamData);
      router.push(`/live-stream/${result.id}/broadcast`);
    } catch (error) {
      console.error("Error creating live stream:", error);
      // You could add error handling UI here
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Create Live Stream</h1>
          <p className="mb-4">You need to be signed in to create a live stream.</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/live-stream">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Live Streams
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Live Stream</h1>
          <p className="text-muted-foreground">
            Set up your live stream and start broadcasting to the HoopLink community
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Stream Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Morning Basketball Training Session"
                required
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe what you'll be streaming..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sport">Sport *</Label>
                <Select value={formData.sport} onValueChange={(value) => handleInputChange("sport", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basketball">Basketball</SelectItem>
                    <SelectItem value="Football">Football</SelectItem>
                    <SelectItem value="Soccer">Soccer</SelectItem>
                    <SelectItem value="Baseball">Baseball</SelectItem>
                    <SelectItem value="Volleyball">Volleyball</SelectItem>
                    <SelectItem value="Tennis">Tennis</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value: LiveStream['category']) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tags..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {formData.isPrivate ? <Lock className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
              Privacy & Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="private">Private Stream</Label>
                <p className="text-sm text-muted-foreground">
                  Only invited users can watch this stream
                </p>
              </div>
              <Switch
                id="private"
                checked={formData.isPrivate}
                onCheckedChange={(checked) => handleInputChange("isPrivate", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="chat">Allow Chat</Label>
                <p className="text-sm text-muted-foreground">
                  Let viewers send messages during the stream
                </p>
              </div>
              <Switch
                id="chat"
                checked={formData.allowChat}
                onCheckedChange={(checked) => handleInputChange("allowChat", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="recording">Allow Recording</Label>
                <p className="text-sm text-muted-foreground">
                  Viewers can record this stream for later viewing
                </p>
              </div>
              <Switch
                id="recording"
                checked={formData.allowRecording}
                onCheckedChange={(checked) => handleInputChange("allowRecording", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="approval">Require Approval</Label>
                <p className="text-sm text-muted-foreground">
                  New viewers must be approved before joining
                </p>
              </div>
              <Switch
                id="approval"
                checked={formData.requireApproval}
                onCheckedChange={(checked) => handleInputChange("requireApproval", checked)}
              />
            </div>

            <div>
              <Label htmlFor="age">Age Restriction</Label>
              <Select value={formData.ageRestriction} onValueChange={(value: "all" | "13+" | "18+") => handleInputChange("ageRestriction", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="13+">13+</SelectItem>
                  <SelectItem value="18+">18+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Stream Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{formData.title || "Your Stream Title"}</h4>
                  <p className="text-sm text-muted-foreground">
                    {user.displayName || "You"} • {formData.sport || "Sport"} • {categories.find(c => c.value === formData.category)?.label}
                  </p>
                </div>
              </div>

              {formData.description && (
                <p className="text-sm mb-3">{formData.description}</p>
              )}

              <div className="flex items-center gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {formData.isPrivate && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading || !formData.title.trim()} className="flex-1">
            {loading ? "Creating..." : "Start Live Stream"}
            <Play className="h-4 w-4 ml-2" />
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/live-stream">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}