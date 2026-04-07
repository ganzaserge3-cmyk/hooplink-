# Follow System Integration Guide

Quick reference for adding follow features to your pages.

## Quick Start Examples

### 1. Add Follow Button to Any Profile Card

```tsx
import { FollowButton } from "@/components/FollowButton";

export function UserCard({ user }) {
  return (
    <div>
      <h2>{user.displayName}</h2>
      <FollowButton
        targetUid={user.uid}
        isFollowing={user.isFollowedByMe}
        displayName={user.displayName}
      />
    </div>
  );
}
```

### 2. Add Follow Suggestions to Sidebar

```tsx
import { FollowSuggestions } from "@/components/FollowSuggestions";

export function Sidebar() {
  return (
    <aside>
      <FollowSuggestions limit={5} title="Who to Follow" />
    </aside>
  );
}
```

### 3. Add Followers Tab to Profile

```tsx
import { FollowList } from "@/components/FollowList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ProfileTabs({ userId }) {
  return (
    <Tabs defaultValue="posts">
      <TabsList>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="followers">Followers</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
      </TabsList>
      
      <TabsContent value="followers">
        <FollowList userId={userId} type="followers" limit={50} />
      </TabsContent>
      
      <TabsContent value="following">
        <FollowList userId={userId} type="following" limit={50} />
      </TabsContent>
    </Tabs>
  );
}
```

### 4. Bulk Follow Team Members

```tsx
import { bulkFollowUsers } from "@/lib/follow-system";
import { Button } from "@/components/ui/button";

export function TeamCard({ team }) {
  const handleFollowTeam = async () => {
    const result = await bulkFollowUsers(team.memberIds);
    alert(`Followed ${result.success} team members!`);
  };

  return (
    <div>
      <h2>{team.name}</h2>
      <Button onClick={handleFollowTeam}>
        Follow All ({team.memberIds.length})
      </Button>
    </div>
  );
}
```

### 5. Show Mutual Connection Count

```tsx
import { getFollowStats } from "@/lib/follow-system";
import { useEffect, useState } from "react";

export function MutualCount({ userId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getFollowStats(userId).then(setStats);
  }, [userId]);

  if (!stats) return null;

  return (
    <p>
      {stats.followers} followers • {stats.mutualFollowers} mutual
    </p>
  );
}
```

### 6. Smart Search with Instant Follow

```tsx
import { searchProfiles } from "@/lib/user-profile";
import { FollowButton } from "@/components/FollowButton";
import { useState } from "react";

export function SearchUsers() {
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");

  const handleSearch = async (term) => {
    if (!term) return;
    const users = await searchProfiles(term, 20);
    setResults(users);
  };

  return (
    <div>
      <input
        placeholder="Search users..."
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
      />
      
      {results.map((user) => (
        <div key={user.uid} className="flex items-center justify-between p-3">
          <span>{user.displayName}</span>
          <FollowButton
            targetUid={user.uid}
            isFollowing={false}
            displayName={user.displayName}
            size="sm"
          />
        </div>
      ))}
    </div>
  );
}
```

---

## Available Files

### Components
- `components/FollowButton.tsx` - Main follow/unfollow button
- `components/FollowList.tsx` - Display followers/following lists
- `components/FollowSuggestions.tsx` - Smart recommendations

### Utilities
- `lib/follow-system.ts` - Advanced follow operations
  - `getFollowStats()`
  - `getMutualFollowers()`
  - `getFollowSuggestions()`
  - `bulkFollowUsers()`
  - `bulkUnfollowUsers()`
  - `getFollowersList()`
  - `getFollowingList()`

- `lib/user-profile.ts` - Core follow function
  - `toggleFollowUser()`
  - `toggleFollowTopic()`
  - `searchProfiles()`

### Documentation
- `FOLLOW_SYSTEM.md` - Complete system documentation
- `INTEGRATION_GUIDE.md` - Quick integration examples (you're reading this)

---

## Pages That Already Have Follow System

✅ `/profile/[uid]` - Published profiles with follow button  
✅ `/profile` - Your own profile section  
✅ All user cards shown in feed/leaderboards  

---

## Common Patterns

### Pattern 1: Profile Header with Stats
```tsx
const stats = await getFollowStats(userId);

<div className="flex gap-6">
  <div>
    <p className="font-bold">{stats.followers}</p>
    <p className="text-sm text-muted">Followers</p>
  </div>
  <div>
    <p className="font-bold">{stats.following}</p>
    <p className="text-sm text-muted">Following</p>
  </div>
  {stats.mutualFollowers > 0 && (
    <div>
      <p className="font-bold text-primary">{stats.mutualFollowers}</p>
      <p className="text-sm text-muted">Mutual</p>
    </div>
  )}
</div>
```

### Pattern 2: Infinite Scroll Follow List
```tsx
import { useInfiniteQuery } from "@tanstack/react-query";
import { getFollowersList } from "@/lib/follow-system";

export function FollowersInfinite({ userId }) {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["followers", userId],
    queryFn: ({ pageParam = 0 }) =>
      getFollowersList(userId, 50).then(u => u.slice(pageParam, pageParam + 50)),
    getNextPageParam: (lastPage, pages) => pages.length * 50,
  });

  return <InfiniteScroll loadMore={fetchNextPage} hasMore={hasNextPage} />;
}
```

### Pattern 3: Follow Suggestion Widget
```tsx
<FollowSuggestions 
  limit={4}
  title="Recommended Athletes"
/>
```

---

## Troubleshooting

**Q: Follow button not updating?**  
A: Make sure you're calling `onFollowChange` callback to update parent state.

**Q: Follow counts wrong?**  
A: Run `recordFollowerGrowth()` to sync stats after bulk operations.

**Q: Suggestions empty?**  
A: They're based on follower network. Need more followers first.

**Q: Slow performance?**  
A: Use `getFollowStats()` (2 docs) instead of fetching full lists.

---

## Next Steps

1. **Add to your pages:**
   - Copy FollowButton to profile cards
   - Add FollowSuggestions to sidebar/footer
   - Integrate FollowList into profile tabs

2. **Customize as needed:**
   - Adjust button styling/text
   - Change suggestion limit
   - Add your own filtering logic

3. **Monitor:**
   - Track follower growth with analytics
   - Monitor notification delivery
   - Ensure suggestions are engaging

4. **Expand:**
   - Create "Trending" page with `getFollowStats()` sorted
   - Build "People You may Know" powered by `getFollowSuggestions()`
   - Add "Follow Team" bulk operations

---

## API Reference Quick Look

```typescript
// Get stats about a user
await getFollowStats(uid)
// Returns: { followers, following, mutualFollowers, isFollowedByCurrentUser }

// Follow/unfollow one user
await toggleFollowUser(uid, isFollowing)

// Get smart recommendations
await getFollowSuggestions(limit)
// Returns: [{ uid, displayName, photoURL, followers, mutualFollowers }, ...]

// Follow multiple users
await bulkFollowUsers(uids)
// Returns: { success, failed }

// Get follower/following lists
await getFollowersList(uid, limit)
await getFollowingList(uid, limit)
```

All functions are type-safe and error-handled. Ready for production.
