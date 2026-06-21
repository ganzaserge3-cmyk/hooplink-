"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, X, Send } from "lucide-react";

import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
    deleteStory,
    markStorySeen,
    recordStoryCompletion,
    recordStoryExit,
    recordStoryNavigation,
    toggleMuteStoryCreator,
    toggleStoryReaction,
    type StoryItem,
} from "@/lib/stories";

const STORY_DURATION_MS = 5000;
const STORY_REACTIONS = ["🏀", "🔥", "💪", "⭐", "🎯"];

const storyFormatLabels: Record<string, string> = {
    standard: "Standard",
    challenge: "Challenge",
    coach_callout: "Coach Callout",
    progression: "Progression",
    game_day: "Game Day",
    recruiting_spotlight: "Recruiting Spotlight",
    scoreboard: "Scoreboard",
    training_streak: "Training Streak",
};

function themeClasses(theme: string | undefined) {
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

interface StoryViewerProps {
    stories: StoryItem[];
    initialIndex: number;
    onClose: () => void;
    onStoryChange?: (index: number) => void;
}

export function StoryViewer({ stories, initialIndex, onClose, onStoryChange }: StoryViewerProps) {
    const { user } = useAuthContext();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [mutedUserIds, setMutedUserIds] = useState<string[]>([]);
    const progressRef = useRef(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const currentStory = stories[currentIndex];
    const currentUserStories = stories.filter((story) => story.userId === currentStory?.userId);
    const currentUserStoryIndex = currentUserStories.findIndex((story) => story.id === currentStory?.id);

    useEffect(() => {
        if (!currentStory) return;

        void markStorySeen(currentStory.id);
        setProgress(0);
        progressRef.current = 0;

        const startedAt = Date.now();
        const interval = window.setInterval(() => {
            if (isPaused) return;

            const nextProgress = Math.min(((Date.now() - startedAt) / STORY_DURATION_MS) * 100, 100);
            setProgress(nextProgress);
            progressRef.current = nextProgress;

            if (nextProgress >= 100) {
                void recordStoryCompletion(currentStory.id);
                goToNext();
            }
        }, 100);

        return () => {
            window.clearInterval(interval);
            if (progressRef.current > 5 && progressRef.current < 95) {
                void recordStoryExit(currentStory.id);
            }
        };
    }, [currentStory, isPaused]);

    useEffect(() => {
        if (!videoRef.current) return;
        if (isPaused) {
            void videoRef.current.pause();
        } else {
            void videoRef.current.play().catch(() => undefined);
        }
    }, [currentStory?.id, isPaused]);

    const goToNext = () => {
        if (currentIndex < stories.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            onStoryChange?.(nextIndex);
        } else {
            onClose();
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            onStoryChange?.(prevIndex);
        }
    };

    const handleDelete = async () => {
        if (!currentStory) return;
        await deleteStory(currentStory.id);
        if (currentIndex < stories.length - 1) {
            const nextIndex = currentIndex;
            setCurrentIndex(nextIndex);
            onStoryChange?.(nextIndex);
        } else {
            onClose();
        }
    };

    const handleMuteToggle = async () => {
        if (!currentStory) return;
        await toggleMuteStoryCreator(currentStory.userId, mutedUserIds.includes(currentStory.userId));
        setMutedUserIds((current) =>
            current.includes(currentStory.userId)
                ? current.filter((id) => id !== currentStory.userId)
                : [...current, currentStory.userId]
        );
    };

    const handleReaction = async (emoji: string) => {
        if (!currentStory) return;
        await toggleStoryReaction(currentStory.id, emoji);
    };

    const handleReply = async () => {
        if (!currentStory || !replyText.trim()) return;
        // Send reply logic here
        setReplyText("");
    };

    if (!currentStory || !user) return null;

    const isOwnStory = currentStory.userId === user.uid;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
            <div className="relative h-full w-full max-w-md">
                {/* Progress bars */}
                <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-3">
                    {currentUserStories.map((story, index) => (
                        <div key={story.id} className="h-1 flex-1 rounded-full bg-white/20">
                            <div
                                className="h-full rounded-full bg-white transition-all"
                                style={{
                                    width:
                                        index < currentUserStoryIndex
                                            ? "100%"
                                            : index === currentUserStoryIndex
                                                ? `${progress}%`
                                                : "0%",
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute left-3 top-3 z-20 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Navigation zones */}
                <div className="absolute inset-0 z-10 flex">
                    <button
                        type="button"
                        className="h-full w-1/2"
                        onMouseDown={() => setIsPaused(true)}
                        onMouseUp={() => setIsPaused(false)}
                        onMouseLeave={() => setIsPaused(false)}
                        onTouchStart={() => setIsPaused(true)}
                        onTouchEnd={() => setIsPaused(false)}
                        onClick={goToPrevious}
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
                        onClick={goToNext}
                        aria-label="Next story"
                    />
                </div>

                {/* Story content */}
                <div className="relative h-full w-full">
                    {currentStory.mediaType === "video" ? (
                        <video
                            ref={videoRef}
                            src={currentStory.mediaUrl}
                            autoPlay
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                        />
                    ) : currentStory.mediaType === "text" ? (
                        <div className={`flex h-full w-full items-center justify-center p-6 ${themeClasses(currentStory.textCard?.theme)}`}>
                            <div className="text-center text-white">
                                <p className="text-xs uppercase tracking-[0.24em] opacity-75">HoopLink</p>
                                <h2 className="mt-4 text-4xl font-bold">{currentStory.textCard?.title || currentStory.caption}</h2>
                                <p className="mt-3 max-w-md text-base text-white/80">
                                    {currentStory.textCard?.subtitle || currentStory.caption}
                                </p>
                                {currentStory.sportsMeta?.format && currentStory.sportsMeta.format !== "standard" ? (
                                    <div className="mt-4 rounded-xl border border-white/20 bg-white/10 p-3 text-sm">
                                        <p className="font-medium">{storyFormatLabels[currentStory.sportsMeta.format]}</p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <img
                            src={currentStory.mediaUrl}
                            alt={currentStory.caption || "Story"}
                            className="h-full w-full object-cover"
                        />
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent p-4">
                        {/* Author info */}
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img
                                    src={currentStory.authorAvatar || "https://placehold.co/48x48?text=U"}
                                    alt={currentStory.authorName}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                                <div>
                                    <p className="font-semibold text-white">{currentStory.authorName}</p>
                                    <p className="text-xs text-white/70">{currentStory.createdAt?.seconds ? new Date(currentStory.createdAt.seconds * 1000).toLocaleDateString() : ""}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {isOwnStory ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                                        onClick={handleMuteToggle}
                                    >
                                        {mutedUserIds.includes(currentStory.userId) ? "Unmute" : "Mute"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Caption */}
                        {currentStory.caption && (
                            <p className="mb-3 text-sm text-white/85">{currentStory.caption}</p>
                        )}

                        {/* Reactions */}
                        <div className="mb-3 flex flex-wrap gap-2">
                            {STORY_REACTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleReaction(emoji)}
                                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        {/* Reply input (for non-own stories) */}
                        {!isOwnStory && (
                            <div className="flex gap-2">
                                <input
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            void handleReply();
                                        }
                                    }}
                                    placeholder="Reply to story..."
                                    className="h-10 flex-1 rounded-full border border-white/20 bg-black/30 px-4 text-sm text-white placeholder:text-white/60"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleReply}
                                    className="rounded-full"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation arrows */}
                {currentIndex > 0 && (
                    <button
                        type="button"
                        onClick={goToPrevious}
                        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                        aria-label="Previous story"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                )}
                {currentIndex < stories.length - 1 && (
                    <button
                        type="button"
                        onClick={goToNext}
                        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                        aria-label="Next story"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    );
}