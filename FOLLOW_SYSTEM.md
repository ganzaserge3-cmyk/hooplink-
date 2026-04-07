# HoopLink Follow/Unfollow System

## Overview

Your HoopLink app has a complete, production-ready follow system built on Firebase/Firestore. Here's everything you need to know.

---

## System Architecture

### Core Data Structure
Users have two arrays in Firestore:
- **`followers`**: Array of UIDs that follow this user
- **`following`**: Array of UIDs this user is following

### Key Features
✅ Mutual following detection  
✅ Follow suggestions based on network  
✅ Bulk follow operations (for teams/rosters)  
✅ Real-time follower/following counts  
✅ Follow notifications  
✅ Prevents self-follows  
✅ Block integration  

---

## Components

### 1. **FollowButton** Component
The main reusable button component for follow/unfollow actions.

**Location**: `components/FollowButton.tsx`

**Usage**:
```tsx
import { FollowButton } from "@/components/FollowButton";

export function ProfileCard({ userId, displayName }) {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <FollowButton
      targetUid={userId}
      isFollowing={isFollowing}
      displayName={displayName}
      onFollowChange={(newStatus) => setIsFollowing(newStatus)}
      variant="default"
      size="default"
    />
  );
}
```

**Props**:
- `targetUid` (string, required): UID of user to follow
- `isFollowing` (boolean, required): Current follow state
- `displayName` (string, optional): User's display name for error messages
- `onFollowChange` (function, optional): Callback when follow state changes
- `variant` (default|outline|ghost|secondary, default: "default")
- `showFollowing` (boolean, default: true): Show "Following" text vs "Unfollow"
- `size` (default|sm|lg, default: "default")
- `className` (string, optional): Additional CSS classes

---

### 2. **FollowList** Component
Display list of followers or following users.

**Location**: `components/FollowList.tsx`

**Usage**:
```tsx
import { FollowList } from "@/components/FollowList";

export function FollowersTab({ userId }) {
  return (
    <FollowList 
      userId={userId} 
      type="followers" 
      limit={50}
    />
  );
}
```

**Props**:
- `userId` (string, required): UID of user
- `type` ("followers"|"following", required): Which list to show
- `limit` (number, default: 50): Max number to fetch

---

### 3. **FollowSuggestions** Component
Smart recommendations based on follower network.

**Location**: `components/FollowSuggestions.tsx`

**Usage**:
```tsx
import { FollowSuggestions } from "@/components/FollowSuggestions";

export function DiscoverPage() {
  return (
    <div>
      <FollowSuggestions 
        limit={6}
        title="Suggested For You"
      />
    </div>
  );
}
```

**Props**:
- `limit` (number, default: 6): Number of suggestions to show
- `title` (string, default: "Suggested For You"): Section title

---

## Utility Functions

### From `lib/follow-system.ts`

#### `getFollowStats(targetUid)`
Get follower/following counts and mutual follower info.

```tsx
const stats = await getFollowStats(userId);
console.log(stats);
// {
//   followers: 150,
//   following: 45,
//   mutualFollowers: 12,
//   isFollowedByCurrentUser: true
// }
```

#### `getMutualFollowers(targetUid)`
Get array of UIDs that both users follow.

```tsx
const mutualFollowers = await getMutualFollowers(coachUid);
// ["uid1", "uid2", "uid3"]
```

#### `getFollowSuggestions(limit?)`
Get smart recommendations to follow.

```tsx
const suggestions = await getFollowSuggestions(10);
// [{uid, displayName, photoURL, role, followers, mutualFollowers}, ...]
```

#### `bulkFollowUsers(userIds)`
Follow multiple users at once (e.g., team roster).

```tsx
const result = await bulkFollowUsers(teamMemberIds);
// { success: 15, failed: 0 }
```

#### `bulkUnfollowUsers(userIds)`
Unfollow multiple users at once.

```tsx
const result = await bulkUnfollowUsers(teamMemberIds);
```

#### `getFollowersList(targetUid, limit?)`
Get specific follower user objects.

```tsx
const followers = await getFollowersList(userId, 50);
// [{uid, displayName, photoURL}, ...]
```

#### `getFollowingList(targetUid, limit?)`
Get specific following user objects.

```tsx
const following = await getFollowingList(userId, 50);
// [{uid, displayName, photoURL}, ...]
```

### From `lib/user-profile.ts`

#### `toggleFollowUser(targetUid, isFollowing)`
Low-level toggle function. Used by FollowButton internally.

```tsx
// To follow
await toggleFollowUser(userId, false);

// To unfollow
await toggleFollowUser(userId, true);
```

---

## Common Implementations

### Team Roster Follow
```tsx
async function suggestTeamFollow(teamMembersData) {
  const result = await bulkFollowUsers(
    teamMembersData.map(m => m.uid)
  );
  console.log(`Followed ${result.success} team members`);
}
```

### Athlete Discovery Page
```tsx
export function DiscoverPage() {
  const [athletes, setAthletes] = useState([]);

  useEffect(() => {
    // Your search/filter logic
    setAthletes(filteredAthletes);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {athletes.map(athlete => (
        <Card key={athlete.uid}>
          <img src={athlete.photoURL} />
          <h3>{athlete.displayName}</h3>
          <p>{athlete.role.sport} • {athlete.role.position}</p>
          <FollowButton
            targetUid={athlete.uid}
            isFollowing={athlete.isFollowedByMe}
            displayName={athlete.displayName}
          />
        </Card>
      ))}
    </div>
  );
}
```

### Profile Mutual Connections
```tsx
export function ProfileMutuals({ userId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getFollowStats(userId).then(setStats);
  }, [userId]);

  if (!stats) return null;

  return (
    <div className="space-y-2">
      <p>{stats.followers} followers</p>
      <p>{stats.following} following</p>
      {stats.mutualFollowers > 0 && (
        <p className="text-primary font-bold">
          {stats.mutualFollowers} mutual connections
        </p>
      )}
    </div>
  );
}
```

### Connect to Coach Network
```tsx
export function CoachNetworkFlow({ athleteUid }) {
  const handleConnectToCoaches = async () => {
    const coachList = await searchProfiles("coach");
    const topCoaches = coachList.slice(0, 10);
    
    const result = await bulkFollowUsers(
      topCoaches.map(c => c.uid)
    );
    
    alert(`Connected to ${result.success} coaches!`);
  };

  return (
    <Button onClick={handleConnectToCoaches}>
      Connect to Top Coaches
    </Button>
  );
}
```

---

## Integration Checklist

✅ **Core Follow System** — Uses `toggleFollowUser()` from `lib/user-profile.ts`

✅ **Profile Pages** — Click "Follow" button on `/profile/[uid]`

✅ **Follower/Following Lists** — Use `FollowList` component

✅ **Suggestions** — Use `FollowSuggestions` on discover/home page

✅ **Team Features** — Use `bulkFollowUsers()` for rosters

✅ **Analytics** — `recordFollowerGrowth()` tracks changes

✅ **Notifications** — Auto-sends when someone follows

---

## Best Practices

1. **Always check auth before following**
   ```tsx
   if (!user) {
     router.push('/login');
     return;
   }
   ```

2. **Handle errors gracefully**
   ```tsx
   try {
     await toggleFollowUser(uid, isFollowing);
   } catch (error) {
     console.error("Follow failed:", error);
     // Show error toast
   }
   ```

3. **Refresh profile data after changes**
   ```tsx
   await toggleFollowUser(uid, isFollowing);
   const updated = await getUserProfileById(uid);
   setProfile(updated);
   ```

4. **Show loading state**
   ```tsx
   const [pending, setPending] = useState(false);
   <FollowButton disabled={pending} ... />
   ```

5. **Use bulk operations for teams**
   ```tsx
   // Good for 10+ users
   await bulkFollowUsers(teamIds);
   
   // Not good — separate calls
   for (const id of teamIds) {
     await toggleFollowUser(id, false);
   }
   ```

---

## Data Flow

```
User clicks "Follow" button
        ↓
FollowButton component
        ↓
toggleFollowUser(targetUid, isFollowing)
        ↓
Add/remove from both users' arrays in Firestore
        ↓
recordFollowerGrowth() - track analytics
        ↓
createNotification() - notify if follow (not unfollow)
        ↓
Component updates local state
```

---

## Testing the System

```tsx
// Test follow
await toggleFollowUser("uid123", false);
const stats = await getFollowStats("uid123");
assert(stats.followers > 0);

// Test suggestions
const suggestions = await getFollowSuggestions(5);
assert(suggestions.length > 0);

// Test mutual followers
const mutuals = await getMutualFollowers("uid123");
console.log(mutuals);
```

---

## Performance Tips

- `getFollowStats()` loads 2 documents — very fast
- `getMutualFollowers()` loads 2 documents — fast
- `getFollowSuggestions()` can be slow with large networks — use pagination
- `getFollowersList()` / `getFollowingList()` use 1 + N page lookups — batching helps
- Bulk operations use batch writes — more efficient than loops

---

## Need Help?

The follow system is battle-tested and production-ready. All files are properly typed with TypeScript, handle errors, and integrate with your existing Firebase setup.

Key files:
- `lib/user-profile.ts` - Core toggle function
- `lib/follow-system.ts` - Advanced utilities
- `components/FollowButton.tsx` - UI component
- `components/FollowList.tsx` - List display
- `components/FollowSuggestions.tsx` - Recommendations
