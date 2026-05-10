import { useState, useEffect, useMemo } from "react";
import { FeedPost } from "@/lib/posts";

export interface FeedFilters {
  search: string;
  view: "for_you" | "following" | "recruiting" | "saved";
  sport: string;
  topic: string;
  extra: "all" | "nearby" | "team" | "creator" | "coach" | "polls" | "qa";
}

export function useFeedFilters(
  posts: FeedPost[],
  userUid: string,
  currentUserLocation: string,
  currentUserTeam: string,
  followingIds: string[]
) {
  const [activeFilters, setActiveFilters] = useState<FeedFilters>({
    search: "",
    view: "for_you",
    sport: "all",
    topic: "all",
    extra: "all",
  });

  const [hiddenAuthorIds, setHiddenAuthorIds] = useState<string[]>([]);
  const [hiddenSports, setHiddenSports] = useState<string[]>([]);
  const [hiddenTopics, setHiddenTopics] = useState<string[]>([]);
  const [hiddenPostTypes, setHiddenPostTypes] = useState<string[]>([]);

  useEffect(() => {
    try {
      setHiddenAuthorIds(JSON.parse(window.localStorage.getItem("feed:hiddenAuthors") || "[]"));
      setHiddenSports(JSON.parse(window.localStorage.getItem("feed:hiddenSports") || "[]"));
      setHiddenTopics(JSON.parse(window.localStorage.getItem("feed:hiddenTopics") || "[]"));
      setHiddenPostTypes(JSON.parse(window.localStorage.getItem("feed:hiddenPostTypes") || "[]"));
    } catch {
      // Ignore localStorage parse issues
    }
  }, []);

  const persistHiddenState = (key: string, values: string[]) => {
    window.localStorage.setItem(key, JSON.stringify(values));
  };

  const hideAuthor = (userId: string) => {
    setHiddenAuthorIds((current) => {
      const next = Array.from(new Set([...current, userId]));
      persistHiddenState("feed:hiddenAuthors", next);
      return next;
    });
  };

  const hideSport = (sport: string) => {
    setHiddenSports((current) => {
      const next = Array.from(new Set([...current, sport.toLowerCase()]));
      persistHiddenState("feed:hiddenSports", next);
      return next;
    });
  };

  const hideTopic = (topic: string) => {
    setHiddenTopics((current) => {
      const next = Array.from(new Set([...current, topic.toLowerCase()]));
      persistHiddenState("feed:hiddenTopics", next);
      return next;
    });
  };

  const hidePostType = (postType: string) => {
    setHiddenPostTypes((current) => {
      const next = Array.from(new Set([...current, postType]));
      persistHiddenState("feed:hiddenPostTypes", next);
      return next;
    });
  };

  const resetFilters = () => {
    setHiddenAuthorIds([]);
    setHiddenSports([]);
    setHiddenTopics([]);
    setHiddenPostTypes([]);
    setActiveFilters({ search: "", view: "for_you", sport: "all", topic: "all", extra: "all" });
    persistHiddenState("feed:hiddenAuthors", []);
    persistHiddenState("feed:hiddenSports", []);
    persistHiddenState("feed:hiddenTopics", []);
    persistHiddenState("feed:hiddenPostTypes", []);
  };

  const visiblePosts = useMemo(() => {
    const normalizedSearch = activeFilters.search.trim().toLowerCase();
    const following = new Set<string>(followingIds);
    const normalizedLocation = currentUserLocation.trim().toLowerCase();
    const normalizedTeam = currentUserTeam.trim().toLowerCase();

    return posts.filter((post) => {
      if (hiddenAuthorIds.includes(post.userId)) return false;
      if (hiddenSports.includes(post.sport.toLowerCase())) return false;
      if (post.hashtags.some((tag) => hiddenTopics.includes(tag.toLowerCase()))) return false;
      if (hiddenPostTypes.includes(post.postType || "standard")) return false;

      if (activeFilters.view === "following" && !following.has(post.userId)) return false;
      if (activeFilters.extra === "nearby" && (!normalizedLocation || post.author.location?.toLowerCase() !== normalizedLocation)) return false;
      if (activeFilters.extra === "team" && (!normalizedTeam || post.author.team?.toLowerCase() !== normalizedTeam)) return false;
      if (activeFilters.view === "recruiting" && !post.author.recruitingAvailable) return false;
      if (activeFilters.extra === "creator" && post.author.role !== "creator") return false;
      if (activeFilters.extra === "coach" && post.author.role !== "coach") return false;
      if (activeFilters.extra === "polls" && post.postType !== "poll") return false;
      if (activeFilters.extra === "qa" && post.postType !== "qa") return false;
      if (activeFilters.view === "saved" && (!userUid || !post.saves.includes(userUid))) return false;
      if (activeFilters.sport !== "all" && post.sport.toLowerCase() !== activeFilters.sport.toLowerCase()) return false;
      if (activeFilters.topic !== "all" && !post.hashtags.includes(activeFilters.topic)) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        post.caption,
        post.sport,
        post.author.name,
        post.author.username,
        post.author.location ?? "",
        post.author.team ?? "",
        post.author.role ?? "",
        ...(post.hashtags ?? []),
      ].join(" ").toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [currentUserLocation, currentUserTeam, activeFilters, followingIds, hiddenAuthorIds, hiddenPostTypes, hiddenSports, hiddenTopics, posts, userUid]);

  return {
    activeFilters,
    setActiveFilters,
    visiblePosts,
    hideAuthor,
    hideSport,
    hideTopic,
    hidePostType,
    resetFilters,
  };
}