"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { subscribeToTeams, type TeamRecord } from "@/lib/teams";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";
import {
  buildStoryCardSuggestion,
  createStories,
  createStoryHighlightCollection,
  deleteStory,
  formatStoryTime,
  getCloseFriendIds,
  getMutedStoryUserIds,
  getStoryArchive,
  getStoryHighlightCollections,
  markStorySeen,
  recordStoryCompletion,
  recordStoryExit,
  recordStoryNavigation,
  respondToStorySticker,
  saveStoryToHighlightCollection,
  sendStoryReply,
  subscribeToActiveStories,
  toggleMuteStoryCreator,
  toggleStoryReaction,
  updateCloseFriendIds,
  type StoryAudience,
  type StoryCategory,
  type StoryFormat,
  type StoryHighlightCollection,
  type StoryItem,
  type StorySportsMeta,
  type StorySticker,
  type StoryTextCard,
} from "@/lib/stories";

const STORY_DURATION_MS = 5000;
const STORY_REACTIONS = ["\uD83D\uDD25", "\uD83D\uDC4F", "\uD83D\uDCAF", "\uD83D\uDC40", "\u26A1"];

const audienceLabels: Record<StoryAudience, string> = {
  everyone: "Everyone",
  followers: "Followers",
  close_friends: "Close friends",
  team: "Team only",
  scouts: "Scouts only",
  coaches: "Coaches only",
};

const categoryLabels: Record<StoryCategory, string> = {
  general: "General",
  recruiting: "Recruiting",
  team: "Team",
  performance: "Performance",
  event: "Event / Game",
  promo: "Creator / Brand",
};

const storyFormatLabels: Record<StoryFormat, string> = {
  standard: "Standard",
  challenge: "Challenge card",
  coach_callout: "Coach callout",
  progression: "Progression story",
  game_day: "Game-day mode",
  recruiting_spotlight: "Recruiting spotlight",
  scoreboard: "Scoreboard sticker",
  training_streak: "Training streak",
};

function themeClasses(theme: StoryTextCard["theme"] | undefined) {
  switch (theme) {
    case "arena":
      return "bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.35),_transparent_45%),linear-gradient(145deg,#111827,#1f2937,#7f1d1d)]";
    case "recruiting":
      return "bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_45%),linear-gradient(145deg,#0f172a,#1d4ed8,#0f172a)]";
    case "wellness":
      return "bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.35),_transparent_45%),linear-gradient(145deg,#052e16,#065f46,#022c22)]";
    case "spotlight":
      return "bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.35),_transparent_45%),linear-gradient(145deg,#111827,#7c2d12,#111827)]";
    default:
      return "bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.35),_transparent_45%),linear-gradient(145deg,#431407,#be123c,#1f2937)]";
  }
}

function StoriesPageContent() {
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef(0);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [archive, setArchive] = useState<StoryItem[]>([]);
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [highlightCollections, setHighlightCollections] = useState<StoryHighlightCollection[]>([]);
  const [closeFriendIds, setCloseFriendIds] = useState<string[]>([]);
  const [mutedUserIds, setMutedUserIds] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [closeFriendSearch, setCloseFriendSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [ctaSearch, setCtaSearch] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [stickerReply, setStickerReply] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState("");
  const [showTextCard, setShowTextCard] = useState(false);
  const [storyForm, setStoryForm] = useState({
    audience: "everyone" as StoryAudience,
    teamId: "",
    category: "general" as StoryCategory,
    format: "standard" as StoryFormat,
    tags: "",
    taggedUserIds: "",
    linkedEntityPath: "",
    eventLabel: "",
    ctaLabel: "",
    ctaUrl: "",
    stickerType: "poll" as StorySticker["type"],
    stickerPrompt: "",
    stickerChoices: "",
    stickerDeadlineLabel: "",
  });
  const [sportsMeta, setSportsMeta] = useState<StorySportsMeta>({
    format: "standard",
  });
  const [textCard, setTextCard] = useState<StoryTextCard>(buildStoryCardSuggestion("general"));

  const refreshStories = async () => {
    const [nextArchive, nextHighlights, nextCloseFriends, nextMuted] = await Promise.all([
      getStoryArchive(),
      getStoryHighlightCollections(),
      getCloseFriendIds(),
      getMutedStoryUserIds(),
    ]);
    setArchive(nextArchive);
    setHighlightCollections(nextHighlights);
    setCloseFriendIds(nextCloseFriends);
    setMutedUserIds(nextMuted);
  };

  useEffect(() => {
    void refreshStories();
    void searchProfiles("").then(setProfiles);
    const unsubscribeTeams = subscribeToTeams((nextTeams) => setTeams(nextTeams));
    const unsubscribeStories = subscribeToActiveStories((nextStories) => setStories(nextStories));
    return () => {
      unsubscribeTeams();
      unsubscribeStories();
    };
  }, []);

  useEffect(() => {
    const storyId = searchParams.get("story");
    if (!storyId || stories.length === 0) {
      return;
    }

    const foundIndex = stories.findIndex((story) => story.id === storyId);
    if (foundIndex >= 0) {
      setActiveIndex(foundIndex);
    }
  }, [searchParams, stories]);

  const activeStory = stories[activeIndex] ?? null;
  const availableTeams = useMemo(
    () => teams.filter((team) => team.memberIds.includes(user?.uid || "")),
    [teams, user?.uid]
  );
  const closeFriendMatches = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.uid !== (user?.uid || "") &&
          !closeFriendIds.includes(profile.uid) &&
          (!closeFriendSearch.trim() ||
            `${profile.displayName} ${profile.username || ""} ${profile.role?.team || ""}`
              .toLowerCase()
              .includes(closeFriendSearch.trim().toLowerCase()))
      ),
    [closeFriendIds, closeFriendSearch, profiles, user?.uid]
  );
  const taggedProfiles = useMemo(
    () => profiles.filter((profile) => storyForm.taggedUserIds.split(",").map((value) => value.trim()).filter(Boolean).includes(profile.uid)),
    [profiles, storyForm.taggedUserIds]
  );
  const tagMatches = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.uid !== (user?.uid || "") &&
          !storyForm.taggedUserIds.split(",").map((value) => value.trim()).filter(Boolean).includes(profile.uid) &&
          (!tagSearch.trim() ||
            `${profile.displayName} ${profile.username || ""} ${profile.role?.team || ""}`
              .toLowerCase()
              .includes(tagSearch.trim().toLowerCase()))
      ),
    [profiles, storyForm.taggedUserIds, tagSearch, user?.uid]
  );
  const ctaProfileMatches = useMemo(
    () =>
      profiles.filter((profile) =>
        !ctaSearch.trim()
          ? true
          : `${profile.displayName} ${profile.username || ""} ${profile.role?.team || ""}`
              .toLowerCase()
              .includes(ctaSearch.trim().toLowerCase())
      ),
    [ctaSearch, profiles]
  );

  const storyCreators = useMemo(() => {
    const uniqueStories = new Map<string, StoryItem>();
    stories.forEach((story) => {
      if (!uniqueStories.has(story.userId)) {
        uniqueStories.set(story.userId, story);
      }
    });
    return Array.from(uniqueStories.values());
  }, [stories]);

  const activeCreatorStories = useMemo(
    () => stories.filter((story) => story.userId === activeStory?.userId),
    [activeStory?.userId, stories]
  );

  const activeCreatorStoryIds = useMemo(
    () => new Set(activeCreatorStories.map((story) => story.id)),
    [activeCreatorStories]
  );

  const activeCreatorStoryIndex = useMemo(
    () => activeCreatorStories.findIndex((story) => story.id === activeStory?.id),
    [activeCreatorStories, activeStory?.id]
  );
  const activeStoryId = activeStory?.id ?? null;

  useEffect(() => {
    if (!activeStory || !activeStoryId) {
      return;
    }

    void markStorySeen(activeStoryId);
    setProgress(0);
    progressRef.current = 0;

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      if (isPaused) {
        return;
      }

      const nextProgress = Math.min(((Date.now() - startedAt) / STORY_DURATION_MS) * 100, 100);
      setProgress(nextProgress);
      progressRef.current = nextProgress;

      if (nextProgress >= 100) {
        void recordStoryCompletion(activeStoryId);
        setActiveIndex((current) => (current + 1 < stories.length ? current + 1 : current));
      }
    }, 100);

    return () => {
      window.clearInterval(interval);
      if (progressRef.current > 5 && progressRef.current < 95) {
        void recordStoryExit(activeStoryId);
      }
    };
  }, [activeStory, activeStoryId, isPaused, stories.length]);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    if (isPaused) {
      void videoRef.current.pause();
    } else {
      void videoRef.current.play().catch(() => undefined);
    }
  }, [activeStoryId, isPaused]);

  const navigateStory = (direction: "back" | "forward") => {
    if (!activeStory) {
      return;
    }

    void recordStoryNavigation(activeStory.id, direction);
    if (direction === "back") {
      setActiveIndex((current) => Math.max(0, current - 1));
      return;
    }

    setActiveIndex((current) => Math.min(stories.length - 1, current + 1));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (files.length === 0 && !showTextCard) {
      return;
    }

    setSaving(true);
    setError(null);
    setUploadProgress(files.length > 0 ? `Uploading ${files.length} file(s)...` : null);
    try {
      await createStories({
        files,
        caption,
        audience: storyForm.audience,
        teamId: storyForm.audience === "team" ? storyForm.teamId : undefined,
        category: storyForm.category,
        tags: storyForm.tags.split(",").map((value) => value.trim()).filter(Boolean),
        taggedUserIds: storyForm.taggedUserIds.split(",").map((value) => value.trim()).filter(Boolean),
        linkedEntityPath: storyForm.linkedEntityPath,
        eventLabel: storyForm.eventLabel,
        cta:
          storyForm.ctaLabel.trim() && storyForm.ctaUrl.trim()
            ? { label: storyForm.ctaLabel.trim(), url: storyForm.ctaUrl.trim() }
            : null,
        sticker: storyForm.stickerPrompt.trim()
          ? {
              type: storyForm.stickerType,
              prompt: storyForm.stickerPrompt.trim(),
              choices: storyForm.stickerChoices.split(",").map((value) => value.trim()).filter(Boolean),
              deadlineLabel: storyForm.stickerDeadlineLabel.trim() || undefined,
            }
          : null,
        textCard: showTextCard ? textCard : null,
        sportsMeta: {
          ...sportsMeta,
          format: storyForm.format,
        },
      });

      setUploadProgress(null);
      setFiles([]);
      setCaption("");
      setShowTextCard(false);
      setStoryForm({
        audience: "everyone",
        teamId: "",
        category: "general",
        format: "standard",
        tags: "",
        taggedUserIds: "",
        linkedEntityPath: "",
        eventLabel: "",
        ctaLabel: "",
        ctaUrl: "",
        stickerType: "poll",
        stickerPrompt: "",
        stickerChoices: "",
        stickerDeadlineLabel: "",
      });
      setSportsMeta({ format: "standard" });
      setTextCard(buildStoryCardSuggestion("general"));
      await refreshStories();
    } catch (error) {
      console.error("Failed to create story:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const activeStoryResponses = activeStory?.sticker?.responsesByUser ?? {};
  const activeStoryResponseEntries = Object.entries(activeStoryResponses);
  const calloutProfile = useMemo(
    () => profiles.find((profile) => profile.uid === sportsMeta.calloutAthleteId) ?? null,
    [profiles, sportsMeta.calloutAthleteId]
  );

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Stories</h1>
            <p className="text-muted-foreground">
              Stories now support private audiences, highlights, archive, reactions, stickers, analytics, and team workflows.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/feed">
              <Button variant="outline">Back to feed</Button>
            </Link>
            <Button variant="outline" onClick={() => setIsPaused((current) => !current)}>
              {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          <button type="button" onClick={() => setActiveIndex(0)} className="flex min-w-[88px] flex-col items-center gap-2">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-500 p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-background">
                <img
                  src={user.photoURL || "https://placehold.co/80x80?text=Y"}
                  alt="Your story"
                  className="h-[70px] w-[70px] rounded-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                +
              </span>
            </div>
            <span className="max-w-[84px] truncate text-center text-xs font-medium">Your story</span>
          </button>

          {storyCreators.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => {
                const storyIndex = stories.findIndex((candidate) => candidate.id === story.id);
                if (storyIndex >= 0) {
                  setActiveIndex(storyIndex);
                }
              }}
              className="flex min-w-[88px] flex-col items-center gap-2"
            >
              <div className="rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-500 p-[2px]">
                <div className="rounded-full bg-background p-[2px]">
                  <img
                    src={story.authorAvatar || "https://placehold.co/80x80?text=S"}
                    alt={story.authorName}
                    className={`h-[70px] w-[70px] rounded-full object-cover ${story.seenBy?.includes(user.uid) ? "opacity-70" : ""}`}
                  />
                </div>
              </div>
              <div className="text-center">
                <span className="block max-w-[84px] truncate text-xs font-medium">{story.authorName}</span>
                <span className="text-[11px] text-muted-foreground">{formatStoryTime(story.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr,1.1fr,0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Story Studio</CardTitle>
              <CardDescription>
                Batch uploads, text cards, mentions, CTA links, private audience, and interactive stickers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                {uploadProgress && (
                  <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                    {uploadProgress}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Media slides</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(event) => {
                      const selectedFiles = Array.from(event.target.files ?? []);
                      const maxSize = 50 * 1024 * 1024; // 50MB
                      const validFiles = selectedFiles.filter((file) => {
                        if (file.size > maxSize) {
                          alert(`File "${file.name}" is too large. Maximum size is 50MB.`);
                          return false;
                        }
                        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
                          alert(`File "${file.name}" is not a valid image or video file.`);
                          return false;
                        }
                        return true;
                      });
                      setFiles(validFiles);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {files.length ? `${files.length} file(s) selected for one story session.` : "Upload multiple files to create several slides at once."}
                  </p>
                </div>

                <textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="Caption, recruiting note, team update, wellness check-in, or promo copy"
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Audience</label>
                    <select
                      value={storyForm.audience}
                      onChange={(event) =>
                        setStoryForm((current) => ({
                          ...current,
                          audience: event.target.value as StoryAudience,
                        }))
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="followers">Followers</option>
                      <option value="close_friends">Close friends</option>
                      <option value="team">Team only</option>
                      <option value="scouts">Scouts only</option>
                      <option value="coaches">Coaches only</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Category</label>
                    <select
                      value={storyForm.category}
                      onChange={(event) => {
                        const category = event.target.value as StoryCategory;
                        setStoryForm((current) => ({ ...current, category }));
                        setTextCard(buildStoryCardSuggestion(category));
                      }}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {(Object.keys(categoryLabels) as StoryCategory[]).map((category) => (
                        <option key={category} value={category}>
                          {categoryLabels[category]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Story format</label>
                  <select
                    value={storyForm.format}
                    onChange={(event) => {
                      const format = event.target.value as StoryFormat;
                      setStoryForm((current) => ({ ...current, format }));
                      setSportsMeta((current) => ({ ...current, format }));
                      if (format === "game_day") {
                        setStoryForm((current) => ({
                          ...current,
                          category: "event",
                          eventLabel: current.eventLabel || "Game day",
                          ctaLabel: current.ctaLabel || "Open event",
                          ctaUrl: current.ctaUrl || "/events",
                        }));
                      }
                      if (format === "recruiting_spotlight") {
                        setStoryForm((current) => ({
                          ...current,
                          category: "recruiting",
                          audience: current.audience === "everyone" ? "scouts" : current.audience,
                          ctaLabel: current.ctaLabel || "Watch highlights",
                        }));
                      }
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {(Object.keys(storyFormatLabels) as StoryFormat[]).map((format) => (
                      <option key={format} value={format}>
                        {storyFormatLabels[format]}
                      </option>
                    ))}
                  </select>
                </div>

                {storyForm.audience === "team" ? (
                  <select
                    value={storyForm.teamId}
                    onChange={(event) => setStoryForm((current) => ({ ...current, teamId: event.target.value }))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Choose team</option>
                    {availableTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                ) : null}

                {storyForm.format !== "standard" ? (
                  <div className="rounded-xl border p-3">
                    <p className="mb-3 text-sm font-medium">Sports story details</p>
                    {storyForm.format === "challenge" ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={sportsMeta.challengeTitle ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, challengeTitle: event.target.value }))}
                          placeholder="Challenge title"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.challengeSkill ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, challengeSkill: event.target.value }))}
                          placeholder="Skill focus"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <textarea
                          value={sportsMeta.challengePrompt ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, challengePrompt: event.target.value }))}
                          placeholder="What should people attempt and reply with?"
                          className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2"
                        />
                      </div>
                    ) : null}
                    {storyForm.format === "coach_callout" ? (
                      <div className="space-y-3">
                        <input
                          value={tagSearch}
                          onChange={(event) => setTagSearch(event.target.value)}
                          placeholder="Search athlete for coach callout"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        {calloutProfile ? (
                          <div className="rounded-lg bg-muted p-3 text-sm">
                            Callout athlete: {calloutProfile.displayName}
                          </div>
                        ) : null}
                        {tagSearch.trim() ? (
                          <div className="max-h-36 space-y-2 overflow-y-auto rounded-xl border p-2">
                            {tagMatches.slice(0, 6).map((profile) => (
                              <button
                                key={profile.uid}
                                type="button"
                                onClick={() => {
                                  setSportsMeta((current) => ({
                                    ...current,
                                    calloutAthleteId: profile.uid,
                                    calloutAthleteName: profile.displayName,
                                  }));
                                  setTagSearch("");
                                }}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                              >
                                <span>{profile.displayName}</span>
                                <span className="text-xs text-muted-foreground">{profile.role?.sport || profile.role?.type || "athlete"}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                        <textarea
                          value={sportsMeta.coachNote ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, coachNote: event.target.value }))}
                          placeholder="Coach note, cue, or public callout"
                          className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    ) : null}
                    {storyForm.format === "progression" ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={sportsMeta.progressionTitle ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, progressionTitle: event.target.value }))}
                          placeholder="Progression title"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.progressionStepLabel ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, progressionStepLabel: event.target.value }))}
                          placeholder="Current step label"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.progressionStepIndex ? String(sportsMeta.progressionStepIndex) : ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, progressionStepIndex: Number(event.target.value || 0) || undefined }))}
                          placeholder="Step number"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.progressionTotalSteps ? String(sportsMeta.progressionTotalSteps) : ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, progressionTotalSteps: Number(event.target.value || 0) || undefined }))}
                          placeholder="Total steps"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                      </div>
                    ) : null}
                    {storyForm.format === "game_day" ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={sportsMeta.gameDayStage ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, gameDayStage: event.target.value }))}
                          placeholder="Stage: arrival, warmup, locker room..."
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.opponent ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, opponent: event.target.value }))}
                          placeholder="Opponent"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.venue ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, venue: event.target.value }))}
                          placeholder="Venue"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm md:col-span-2"
                        />
                      </div>
                    ) : null}
                    {storyForm.format === "recruiting_spotlight" ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={sportsMeta.recruitingProfile?.position ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, recruitingProfile: { ...current.recruitingProfile, position: event.target.value } }))}
                          placeholder="Position"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.recruitingProfile?.gradYear ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, recruitingProfile: { ...current.recruitingProfile, gradYear: event.target.value } }))}
                          placeholder="Grad year"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.recruitingProfile?.location ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, recruitingProfile: { ...current.recruitingProfile, location: event.target.value } }))}
                          placeholder="Location"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.recruitingProfile?.offerStatus ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, recruitingProfile: { ...current.recruitingProfile, offerStatus: event.target.value } }))}
                          placeholder="Offer status"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                      </div>
                    ) : null}
                    {storyForm.format === "scoreboard" ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={sportsMeta.scoreboard?.teamScore ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, scoreboard: { ...current.scoreboard, teamScore: event.target.value } }))}
                          placeholder="Team score"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.scoreboard?.opponentScore ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, scoreboard: { ...current.scoreboard, opponentScore: event.target.value } }))}
                          placeholder="Opponent score"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.scoreboard?.period ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, scoreboard: { ...current.scoreboard, period: event.target.value } }))}
                          placeholder="Quarter / half / set"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.scoreboard?.statLine ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, scoreboard: { ...current.scoreboard, statLine: event.target.value } }))}
                          placeholder="Stat line"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                      </div>
                    ) : null}
                    {storyForm.format === "training_streak" ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={sportsMeta.trainingStreakDays ? String(sportsMeta.trainingStreakDays) : ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, trainingStreakDays: Number(event.target.value || 0) || null }))}
                          placeholder="Streak days"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          value={sportsMeta.challengeSkill ?? ""}
                          onChange={(event) => setSportsMeta((current) => ({ ...current, challengeSkill: event.target.value }))}
                          placeholder="Training focus"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={storyForm.tags}
                    onChange={(event) => setStoryForm((current) => ({ ...current, tags: event.target.value }))}
                    placeholder="Tags: gameday, visit, recovery"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <input
                    value={tagSearch}
                    onChange={(event) => setTagSearch(event.target.value)}
                    placeholder="Search profiles to tag"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>

                {taggedProfiles.length ? (
                  <div className="flex flex-wrap gap-2">
                    {taggedProfiles.map((profile) => (
                      <button
                        key={profile.uid}
                        type="button"
                        onClick={() =>
                          setStoryForm((current) => ({
                            ...current,
                            taggedUserIds: current.taggedUserIds
                              .split(",")
                              .map((value) => value.trim())
                              .filter(Boolean)
                              .filter((uid) => uid !== profile.uid)
                              .join(", "),
                          }))
                        }
                        className="rounded-full border px-3 py-1.5 text-sm hover:bg-muted/40"
                      >
                        {profile.displayName} x
                      </button>
                    ))}
                  </div>
                ) : null}

                {tagSearch.trim() ? (
                  <div className="max-h-36 space-y-2 overflow-y-auto rounded-xl border p-2">
                    {tagMatches.slice(0, 6).map((profile) => (
                      <button
                        key={profile.uid}
                        type="button"
                        onClick={() => {
                          const nextIds = Array.from(
                            new Set([
                              ...storyForm.taggedUserIds.split(",").map((value) => value.trim()).filter(Boolean),
                              profile.uid,
                            ])
                          );
                          setStoryForm((current) => ({ ...current, taggedUserIds: nextIds.join(", ") }));
                          setTagSearch("");
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span>{profile.displayName}</span>
                        <span className="text-xs text-muted-foreground">{profile.role?.type || "member"}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={storyForm.linkedEntityPath}
                    onChange={(event) => setStoryForm((current) => ({ ...current, linkedEntityPath: event.target.value }))}
                    placeholder="Deep link path: /bookings or /events"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <input
                    value={storyForm.eventLabel}
                    onChange={(event) => setStoryForm((current) => ({ ...current, eventLabel: event.target.value }))}
                    placeholder="Event or game label"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>

                <div className="rounded-xl border p-3">
                  <p className="mb-3 text-sm font-medium">Story CTA</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setStoryForm((current) => ({ ...current, ctaLabel: "Open bookings", ctaUrl: "/bookings" }))}>Bookings</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setStoryForm((current) => ({ ...current, ctaLabel: "Open events", ctaUrl: "/events" }))}>Events</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setStoryForm((current) => ({ ...current, ctaLabel: "Open inbox", ctaUrl: "/messages" }))}>Inbox</Button>
                    {storyForm.audience === "team" && storyForm.teamId ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled
                      >
                        Team CTA unavailable
                      </Button>
                    ) : null}
                  </div>
                  <input
                    value={ctaSearch}
                    onChange={(event) => setCtaSearch(event.target.value)}
                    placeholder="Search a profile for CTA"
                    className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                  {ctaSearch.trim() ? (
                    <div className="mt-2 max-h-36 space-y-2 overflow-y-auto rounded-xl border p-2">
                      {ctaProfileMatches.slice(0, 6).map((profile) => (
                        <button
                          key={profile.uid}
                          type="button"
                          onClick={() => {
                            setStoryForm((current) => ({
                              ...current,
                              ctaLabel: `View ${profile.displayName}`,
                              ctaUrl: `/profile/${profile.uid}`,
                            }));
                            setCtaSearch("");
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <span>{profile.displayName}</span>
                          <span className="text-xs text-muted-foreground">{profile.username ? `@${profile.username}` : profile.role?.type || "profile"}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                      value={storyForm.ctaLabel}
                      onChange={(event) => setStoryForm((current) => ({ ...current, ctaLabel: event.target.value }))}
                      placeholder="CTA label"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <input
                      value={storyForm.ctaUrl}
                      onChange={(event) => setStoryForm((current) => ({ ...current, ctaUrl: event.target.value }))}
                      placeholder="CTA path or URL"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Auto-generated text card</p>
                      <p className="text-xs text-muted-foreground">Create a story card without uploading media.</p>
                    </div>
                    <input type="checkbox" checked={showTextCard} onChange={(event) => setShowTextCard(event.target.checked)} />
                  </div>
                  {showTextCard ? (
                    <div className="space-y-3">
                      <input
                        value={textCard.title}
                        onChange={(event) => setTextCard((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Card title"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      />
                      <textarea
                        value={textCard.subtitle}
                        onChange={(event) => setTextCard((current) => ({ ...current, subtitle: event.target.value }))}
                        placeholder="Card subtitle"
                        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                      <div className={`rounded-2xl p-5 text-white ${themeClasses(textCard.theme)}`}>
                        <p className="text-xs uppercase tracking-[0.24em] opacity-75">{categoryLabels[storyForm.category]}</p>
                        <p className="mt-4 text-2xl font-semibold">{textCard.title}</p>
                        <p className="mt-2 text-sm text-white/80">{textCard.subtitle}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-xl border p-3">
                  <p className="mb-3 text-sm font-medium">Interactive sticker</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      value={storyForm.stickerType}
                      onChange={(event) =>
                        setStoryForm((current) => ({
                          ...current,
                          stickerType: event.target.value as StorySticker["type"],
                        }))
                      }
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="poll">Poll</option>
                      <option value="qa">Q&amp;A</option>
                      <option value="countdown">Countdown</option>
                      <option value="availability">Availability</option>
                      <option value="mvp_vote">MVP vote</option>
                    </select>
                    <input
                      value={storyForm.stickerDeadlineLabel}
                      onChange={(event) => setStoryForm((current) => ({ ...current, stickerDeadlineLabel: event.target.value }))}
                      placeholder="Countdown / deadline label"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </div>
                  <input
                    value={storyForm.stickerPrompt}
                    onChange={(event) => setStoryForm((current) => ({ ...current, stickerPrompt: event.target.value }))}
                    placeholder="Sticker prompt"
                    className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <input
                    value={storyForm.stickerChoices}
                    onChange={(event) => setStoryForm((current) => ({ ...current, stickerChoices: event.target.value }))}
                    placeholder="Choices (comma separated)"
                    className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>

                <Button type="submit" disabled={saving || (files.length === 0 && !showTextCard)}>
                  {saving ? "Publishing..." : "Publish story set"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[28px]">
            <CardContent className="p-0">
              {!activeStory ? (
                <div className="flex aspect-[9/16] items-center justify-center bg-muted p-6 text-sm text-muted-foreground">
                  No active stories yet.
                </div>
              ) : (
                <div className="relative aspect-[9/16] bg-black text-white">
                  <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-3">
                    {activeCreatorStories.map((story, index) => (
                      <div key={story.id} className="h-1 flex-1 rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-white transition-all"
                          style={{
                            width:
                              index < activeCreatorStoryIndex
                                ? "100%"
                                : index === activeCreatorStoryIndex
                                  ? `${progress}%`
                                  : "0%",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="absolute inset-0 z-10 flex">
                    <button
                      type="button"
                      className="h-full w-1/2"
                      onMouseDown={() => setIsPaused(true)}
                      onMouseUp={() => setIsPaused(false)}
                      onMouseLeave={() => setIsPaused(false)}
                      onTouchStart={() => setIsPaused(true)}
                      onTouchEnd={() => setIsPaused(false)}
                      onClick={() => navigateStory("back")}
                      aria-label="Previous story"
                    />
                    <button
                      type="button"
                      className="h-full w-1/2"
                      onMouseDown={() => setIsPaused(true)}
                      onMouseUp={() => setIsPaused(false)}
                      onMouseLeave={() => setIsPaused(false)}
                      onTouchStart={() => setIsPaused(true)}
                      onTouchEnd={() => setIsPaused(false)}
                      onClick={() => navigateStory("forward")}
                      aria-label="Next story"
                    />
                  </div>

                  {activeStory.mediaType === "video" ? (
                    <video
                      ref={videoRef}
                      src={activeStory.mediaUrl}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : activeStory.mediaType === "text" ? (
                    <div className={`flex h-full w-full flex-col justify-end p-6 ${themeClasses(activeStory.textCard?.theme)}`}>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/70">{categoryLabels[activeStory.category]}</p>
                      <h2 className="mt-4 text-4xl font-semibold">{activeStory.textCard?.title || activeStory.caption}</h2>
                      <p className="mt-3 max-w-md text-base text-white/80">
                        {activeStory.textCard?.subtitle || activeStory.caption}
                      </p>
                    </div>
                  ) : (
                    <img src={activeStory.mediaUrl} alt={activeStory.caption || "Story"} className="h-full w-full object-cover" />
                  )}

                  <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/35 to-transparent p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                        {categoryLabels[activeStory.category]}
                      </Badge>
                      <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                        {audienceLabels[activeStory.audience]}
                      </Badge>
                      {activeStory.eventLabel ? (
                        <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                          {activeStory.eventLabel}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{activeStory.authorName}</p>
                        <p className="text-xs text-white/70">{formatStoryTime(activeStory.createdAt)}</p>
                      </div>
                      {activeStory.userId === user.uid ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                          onClick={async () => {
                            await deleteStory(activeStory.id);
                            await refreshStories();
                            setActiveIndex(0);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                          onClick={async () => {
                            await toggleMuteStoryCreator(activeStory.userId, mutedUserIds.includes(activeStory.userId));
                            await refreshStories();
                          }}
                        >
                          {mutedUserIds.includes(activeStory.userId) ? "Unmute" : "Mute"}
                        </Button>
                      )}
                    </div>

                    <p className="mt-3 text-sm text-white/85">{activeStory.caption || "No caption"}</p>

                    {activeStory.sportsMeta?.format && activeStory.sportsMeta.format !== "standard" ? (
                      <div className="mt-3 rounded-2xl border border-white/15 bg-white/10 p-3 text-sm">
                        <p className="font-medium">{storyFormatLabels[activeStory.sportsMeta.format]}</p>
                        {activeStory.sportsMeta.challengeTitle ? <p className="mt-1">{activeStory.sportsMeta.challengeTitle}</p> : null}
                        {activeStory.sportsMeta.challengePrompt ? <p className="mt-1 text-white/75">{activeStory.sportsMeta.challengePrompt}</p> : null}
                        {activeStory.sportsMeta.coachNote ? <p className="mt-1 text-white/75">Coach note: {activeStory.sportsMeta.coachNote}</p> : null}
                        {activeStory.sportsMeta.calloutAthleteName ? <p className="mt-1 text-white/75">Athlete: {activeStory.sportsMeta.calloutAthleteName}</p> : null}
                        {activeStory.sportsMeta.progressionTitle ? <p className="mt-1 text-white/75">{activeStory.sportsMeta.progressionTitle}</p> : null}
                        {activeStory.sportsMeta.progressionStepLabel ? (
                          <p className="mt-1 text-white/75">
                            Step {activeStory.sportsMeta.progressionStepIndex || "?"}/{activeStory.sportsMeta.progressionTotalSteps || "?"}: {activeStory.sportsMeta.progressionStepLabel}
                          </p>
                        ) : null}
                        {activeStory.sportsMeta.gameDayStage || activeStory.sportsMeta.opponent || activeStory.sportsMeta.venue ? (
                          <p className="mt-1 text-white/75">
                            {[activeStory.sportsMeta.gameDayStage, activeStory.sportsMeta.opponent, activeStory.sportsMeta.venue].filter(Boolean).join(" ΓÇó ")}
                          </p>
                        ) : null}
                        {activeStory.sportsMeta.recruitingProfile ? (
                          <p className="mt-1 text-white/75">
                            {[
                              activeStory.sportsMeta.recruitingProfile.position,
                              activeStory.sportsMeta.recruitingProfile.gradYear,
                              activeStory.sportsMeta.recruitingProfile.location,
                              activeStory.sportsMeta.recruitingProfile.offerStatus,
                            ].filter(Boolean).join(" ΓÇó ")}
                          </p>
                        ) : null}
                        {activeStory.sportsMeta.scoreboard ? (
                          <p className="mt-1 text-white/75">
                            {[
                              `${activeStory.sportsMeta.scoreboard.teamScore || "0"}-${activeStory.sportsMeta.scoreboard.opponentScore || "0"}`,
                              activeStory.sportsMeta.scoreboard.period,
                              activeStory.sportsMeta.scoreboard.statLine,
                              activeStory.sportsMeta.scoreboard.gameStatus,
                            ].filter(Boolean).join(" ΓÇó ")}
                          </p>
                        ) : null}
                        {activeStory.sportsMeta.trainingStreakDays ? (
                          <p className="mt-1 text-white/75">Training streak: {activeStory.sportsMeta.trainingStreakDays} days</p>
                        ) : null}
                      </div>
                    ) : null}

                    {activeStory.tags.length ? (
                      <p className="mt-2 text-xs text-white/65">Tags: {activeStory.tags.join(", ")}</p>
                    ) : null}

                    {activeStory.cta ? (
                      <div className="mt-3">
                        <Link href={activeStory.cta.url}>
                          <Button size="sm">{activeStory.cta.label}</Button>
                        </Link>
                      </div>
                    ) : activeStory.linkedEntityPath ? (
                      <div className="mt-3">
                        <Link href={activeStory.linkedEntityPath}>
                          <Button size="sm">Open linked destination</Button>
                        </Link>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {STORY_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => void toggleStoryReaction(activeStory.id, emoji).then(refreshStories)}
                          className={`rounded-full border px-3 py-1.5 text-sm ${activeStory.reactionsByUser[user.uid] === emoji ? "border-white bg-white text-black" : "border-white/20 bg-white/10 text-white"}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {activeStory.reactionCounts.length ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                        {activeStory.reactionCounts.map((entry) => (
                          <span key={entry.emoji} className="rounded-full bg-white/10 px-2 py-1">
                            {entry.emoji} {entry.count}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {activeStory.sticker ? (
                      <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-3">
                        <p className="text-sm font-medium">{activeStory.sticker.prompt}</p>
                        {activeStory.sticker.deadlineLabel ? (
                          <p className="mt-1 text-xs text-white/70">{activeStory.sticker.deadlineLabel}</p>
                        ) : null}

                        {activeStory.sticker.type === "qa" ? (
                          <div className="mt-3 flex gap-2">
                            <input
                              value={stickerReply}
                              onChange={(event) => setStickerReply(event.target.value)}
                              placeholder="Write your answer"
                              className="h-10 w-full rounded-md border border-white/20 bg-black/30 px-3 text-sm text-white placeholder:text-white/60"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                void respondToStorySticker(activeStory.id, stickerReply).then(async () => {
                                  setStickerReply("");
                                  await refreshStories();
                                })
                              }
                            >
                              Send
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {activeStory.sticker.choices.map((choice) => (
                              <Button
                                key={choice}
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                                onClick={() => void respondToStorySticker(activeStory.id, choice).then(refreshStories)}
                              >
                                {choice}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}

                    {activeStory.userId !== user.uid ? (
                      <div className="mt-4 flex gap-2">
                        <input
                          value={replyText}
                          onChange={(event) => setReplyText(event.target.value)}
                          placeholder="Reply to this story"
                          className="h-10 w-full rounded-md border border-white/20 bg-black/30 px-3 text-sm text-white placeholder:text-white/60"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={async () => {
                            await sendStoryReply(activeStory, replyText || activeStory.caption || "Reacted to your story.");
                            setReplyText("");
                            await refreshStories();
                          }}
                        >
                          Reply
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    onClick={() => navigateStory("back")}
                    disabled={activeIndex === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    onClick={() => navigateStory("forward")}
                    disabled={activeIndex === stories.length - 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Creator Controls</CardTitle>
                <CardDescription>Highlights, viewer list, archive, close friends, and analytics.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border p-3">
                  <p className="text-sm font-medium">Close friends</p>
                  <p className="mb-3 text-xs text-muted-foreground">Search and select the people who can see close-friends stories.</p>
                  <input
                    value={closeFriendSearch}
                    onChange={(event) => setCloseFriendSearch(event.target.value)}
                    placeholder="Search profiles"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                  {closeFriendIds.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {closeFriendIds.map((uid) => {
                        const profile = profiles.find((entry) => entry.uid === uid);
                        return (
                          <button
                            key={uid}
                            type="button"
                            onClick={() => setCloseFriendIds((current) => current.filter((value) => value !== uid))}
                            className="rounded-full border px-3 py-1.5 text-sm hover:bg-muted/40"
                          >
                            {profile?.displayName || uid} x
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {closeFriendSearch.trim() ? (
                    <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-xl border p-2">
                      {closeFriendMatches.slice(0, 8).map((profile) => (
                        <button
                          key={profile.uid}
                          type="button"
                          onClick={() => {
                            setCloseFriendIds((current) => Array.from(new Set([...current, profile.uid])));
                            setCloseFriendSearch("");
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <span>{profile.displayName}</span>
                          <span className="text-xs text-muted-foreground">{profile.role?.team || profile.role?.type || "profile"}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3"
                    onClick={async () => {
                      await updateCloseFriendIds(closeFriendIds);
                      await refreshStories();
                    }}
                  >
                    Save close friends
                  </Button>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-sm font-medium">Highlights</p>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={newHighlightTitle}
                      onChange={(event) => setNewHighlightTitle(event.target.value)}
                      placeholder="New highlight collection"
                      className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        await createStoryHighlightCollection(newHighlightTitle);
                        setNewHighlightTitle("");
                        await refreshStories();
                      }}
                    >
                      Create
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {highlightCollections.length ? (
                      highlightCollections.map((collection) => (
                        <div key={collection.id} className="rounded-lg bg-muted p-3 text-sm">
                          <p className="font-medium">{collection.title}</p>
                          <p className="text-xs text-muted-foreground">{collection.storyIds.length} saved stories</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No highlight collections yet.</p>
                    )}
                  </div>
                </div>

                {activeStory && activeStory.userId === user.uid ? (
                  <div className="rounded-xl border p-3">
                    <p className="text-sm font-medium">Live analytics</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium">{activeStory.viewerCount}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium">{activeStory.analytics.completionCount}</p>
                        <p className="text-xs text-muted-foreground">Completions</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium">{activeStory.analytics.replyCount}</p>
                        <p className="text-xs text-muted-foreground">Replies</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium">{activeStory.analytics.reactionCount}</p>
                        <p className="text-xs text-muted-foreground">Reactions</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium">{activeStory.analytics.tapsForward}</p>
                        <p className="text-xs text-muted-foreground">Taps forward</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium">{activeStory.analytics.tapsBack}</p>
                        <p className="text-xs text-muted-foreground">Taps back</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium">Viewer list</p>
                      <div className="mt-2 space-y-2">
                        {activeStory.viewers.length ? (
                          activeStory.viewers.map((viewer) => (
                            <div key={viewer.uid} className="flex items-center gap-3 rounded-lg bg-muted p-2 text-sm">
                              <img
                                src={viewer.avatar || "https://placehold.co/40x40?text=V"}
                                alt={viewer.name}
                                className="h-9 w-9 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-medium">{viewer.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Viewed {formatStoryTime(viewer.viewedAt)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No viewers yet.</p>
                        )}
                      </div>
                    </div>

                    {activeStory.sticker ? (
                      <div className="mt-4">
                        <p className="text-sm font-medium">Sticker responses</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg bg-muted p-3 text-sm">
                            <p className="font-medium">{activeStoryResponseEntries.length}</p>
                            <p className="text-xs text-muted-foreground">Total responses</p>
                          </div>
                          <div className="rounded-lg bg-muted p-3 text-sm">
                            <p className="font-medium">{activeStory.sticker.type}</p>
                            <p className="text-xs text-muted-foreground">Sticker type</p>
                          </div>
                        </div>
                        {activeStory.sticker.type !== "qa" && activeStory.sticker.choices.length ? (
                          <div className="mt-3 space-y-2">
                            {activeStory.sticker.choices.map((choice) => {
                              const count = Object.values(activeStoryResponses).filter((value) => value === choice).length;
                              return (
                                <div key={choice} className="rounded-lg bg-muted p-2 text-sm">
                                  <div className="flex items-center justify-between gap-3">
                                    <span>{choice}</span>
                                    <span className="text-xs text-muted-foreground">{count} votes</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                        <div className="mt-2 space-y-2">
                          {activeStoryResponseEntries.length ? (
                            activeStoryResponseEntries.map(([viewerId, value]) => (
                              <div key={viewerId} className="rounded-lg bg-muted p-2 text-sm">
                                <span className="font-medium">{viewerId}</span>: {value}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No sticker responses yet.</p>
                          )}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4">
                      <p className="text-sm font-medium">Save this story to highlights</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {highlightCollections.map((collection) => (
                          <Button
                            key={collection.id}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void saveStoryToHighlightCollection(activeStory.id, collection.id).then(refreshStories)}
                          >
                            {collection.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-xl border p-3">
                  <p className="text-sm font-medium">Story archive</p>
                  <p className="text-xs text-muted-foreground">Expired and active stories you can reuse, delete, or save to highlights.</p>
                  <div className="mt-3 space-y-3">
                    {archive.length ? (
                      archive.slice(0, 8).map((story) => (
                        <div key={story.id} className="rounded-xl border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{story.caption || story.textCard?.title || "Untitled story"}</p>
                              <p className="text-xs text-muted-foreground">
                                {categoryLabels[story.category]} x {audienceLabels[story.audience]} x {formatStoryTime(story.createdAt)}
                              </p>
                            </div>
                            <Button type="button" size="sm" variant="ghost" onClick={() => void deleteStory(story.id).then(refreshStories)}>
                              Delete
                            </Button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {highlightCollections.map((collection) => (
                              <Button
                                key={collection.id}
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void saveStoryToHighlightCollection(story.id, collection.id).then(refreshStories)}
                              >
                                Save to {collection.title}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Your archive is empty.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stories.map((story, index) => (
            <button
              key={story.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`rounded-xl border p-3 text-left ${index === activeIndex ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
            >
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{categoryLabels[story.category]}</Badge>
                <Badge variant="secondary">{story.viewerCount} views</Badge>
                {activeCreatorStoryIds.has(story.id) ? <Badge variant="secondary">Creator stack</Badge> : null}
              </div>
              <p className="mt-3 font-medium">{story.authorName}</p>
              <p className="text-sm text-muted-foreground">{story.caption || story.textCard?.title || "No caption"}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {story.seenBy?.includes(user.uid) ? "Seen" : "New"} x {audienceLabels[story.audience]}
              </p>
            </button>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function StoriesPage() {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <StoriesPageContent />
      </Suspense>
    </AuthProvider>
  );
} 
