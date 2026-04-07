import { collection, getDocs, query, where, doc, getDoc, arrayUnion, arrayRemove, writeBatch, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface FollowStats {
  followers: number;
  following: number;
  mutualFollowers: number;
  isFollowedByCurrentUser: boolean;
}

export interface FollowSuggestion {
  uid: string;
  displayName: string;
  photoURL?: string;
  role?: {
    type: string;
    sport?: string;
    position?: string;
  };
  followers: number;
  mutualFollowers: number;
}

/**
 * Get comprehensive follow statistics for a user
 */
export async function getFollowStats(targetUid: string): Promise<FollowStats> {
  if (!auth.currentUser) {
    throw new Error("User must be authenticated");
  }

  try {
    const userDoc = await getDoc(doc(db, "users", targetUid));
    if (!userDoc.exists()) {
      return {
        followers: 0,
        following: 0,
        mutualFollowers: 0,
        isFollowedByCurrentUser: false,
      };
    }

    const userData = userDoc.data();
    const followers = (userData.followers as string[]) || [];
    const following = (userData.following as string[]) || [];
    const currentUserFollowing = (userData.following as string[]) || [];

    const currentUserDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const currentUserData = currentUserDoc.data();
    const myFollowing = (currentUserData?.following as string[]) || [];

    // Mutual followers are people who both users follow
    const mutualFollowers = followers.filter((uid) => myFollowing.includes(uid)).length;

    return {
      followers: followers.length,
      following: following.length,
      mutualFollowers,
      isFollowedByCurrentUser: followers.includes(auth.currentUser.uid),
    };
  } catch (error) {
    console.error("Error getting follow stats:", error);
    throw error;
  }
}

/**
 * Get mutual followers between current user and target user
 */
export async function getMutualFollowers(targetUid: string): Promise<string[]> {
  if (!auth.currentUser) {
    throw new Error("User must be authenticated");
  }

  try {
    const [targetUserDoc, currentUserDoc] = await Promise.all([
      getDoc(doc(db, "users", targetUid)),
      getDoc(doc(db, "users", auth.currentUser.uid)),
    ]);

    const targetFollowers = (targetUserDoc.data()?.followers as string[]) || [];
    const currentUserFollowing = (currentUserDoc.data()?.following as string[]) || [];

    return targetFollowers.filter((uid) => currentUserFollowing.includes(uid));
  } catch (error) {
    console.error("Error getting mutual followers:", error);
    return [];
  }
}

/**
 * Get follow suggestions based on user's following habits
 * Suggests users that the user's followers are following but user isn't
 */
export async function getFollowSuggestions(limit: number = 10): Promise<FollowSuggestion[]> {
  if (!auth.currentUser) {
    throw new Error("User must be authenticated");
  }

  try {
    const currentUserDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const currentUserData = currentUserDoc.data();
    const myFollowing = new Set((currentUserData?.following as string[]) || []);
    const myFollowers = (currentUserData?.followers as string[]) || [];

    // Collect all users that my followers are following
    const suggestedUids = new Map<string, number>();
    const mutualCounts = new Map<string, number>();

    for (const followerId of myFollowers.slice(0, 50)) {
      try {
        const followerDoc = await getDoc(doc(db, "users", followerId));
        const followerData = followerDoc.data();
        const followerFollowing = (followerData?.following as string[]) || [];

        for (const uid of followerFollowing) {
          if (uid !== auth.currentUser.uid && !myFollowing.has(uid)) {
            suggestedUids.set(uid, (suggestedUids.get(uid) || 0) + 1);
            // Track mutual connections
            const userDoc = await getDoc(doc(db, "users", uid));
            const userData = userDoc.data();
            const userFollowers = (userData?.followers as string[]) || [];
            mutualCounts.set(uid, userFollowers.filter((u) => myFollowers.includes(u)).length);
          }
        }
      } catch (error) {
        console.error(`Error processing follower ${followerId}:`, error);
      }
    }

    // Sort by recommendation strength and fetch user details
    const sortedSuggestions = Array.from(suggestedUids.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, limit);

    const suggestions: FollowSuggestion[] = [];
    for (const [uid] of sortedSuggestions) {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          suggestions.push({
            uid,
            displayName: userData.displayName || "HoopLink User",
            photoURL: userData.photoURL,
            role: userData.role,
            followers: (userData.followers as string[])?.length || 0,
            mutualFollowers: mutualCounts.get(uid) || 0,
          });
        }
      } catch (error) {
        console.error(`Error fetching suggestion ${uid}:`, error);
      }
    }

    return suggestions;
  } catch (error) {
    console.error("Error getting follow suggestions:", error);
    return [];
  }
}

/**
 * Bulk follow multiple users (e.g., for team roster)
 */
export async function bulkFollowUsers(userIds: string[]): Promise<{ success: number; failed: number }> {
  if (!auth.currentUser || !db) {
    throw new Error("User must be authenticated");
  }

  const currentUid = auth.currentUser.uid;
  let successCount = 0;
  let failedCount = 0;

  // Batch operations for efficiency
  const batch = writeBatch(db);

  for (const targetUid of userIds) {
    if (currentUid === targetUid) continue;

    try {
      // Add to current user's following
      batch.update(doc(db, "users", currentUid), {
        following: arrayUnion(targetUid),
        updatedAt: serverTimestamp(),
      });

      // Add to target user's followers
      batch.update(doc(db, "users", targetUid), {
        followers: arrayUnion(currentUid),
        updatedAt: serverTimestamp(),
      });

      successCount++;
    } catch (error) {
      console.error(`Failed to follow ${targetUid}:`, error);
      failedCount++;
    }
  }

  await batch.commit();
  return { success: successCount, failed: failedCount };
}

/**
 * Bulk unfollow multiple users
 */
export async function bulkUnfollowUsers(userIds: string[]): Promise<{ success: number; failed: number }> {
  if (!auth.currentUser || !db) {
    throw new Error("User must be authenticated");
  }

  const currentUid = auth.currentUser.uid;
  let successCount = 0;
  let failedCount = 0;

  const batch = writeBatch(db);

  for (const targetUid of userIds) {
    if (currentUid === targetUid) continue;

    try {
      batch.update(doc(db, "users", currentUid), {
        following: arrayRemove(targetUid),
        updatedAt: serverTimestamp(),
      });

      batch.update(doc(db, "users", targetUid), {
        followers: arrayRemove(currentUid),
        updatedAt: serverTimestamp(),
      });

      successCount++;
    } catch (error) {
      console.error(`Failed to unfollow ${targetUid}:`, error);
      failedCount++;
    }
  }

  await batch.commit();
  return { success: successCount, failed: failedCount };
}

/**
 * Get list of users following a specific user
 */
export async function getFollowersList(targetUid: string, limit: number = 50): Promise<Array<{ uid: string; displayName: string; photoURL?: string }>> {
  try {
    const userDoc = await getDoc(doc(db, "users", targetUid));
    if (!userDoc.exists()) return [];

    const followers = (userDoc.data().followers as string[]) || [];
    const followerDetails = [];

    for (const followerId of followers.slice(0, limit)) {
      try {
        const followerDoc = await getDoc(doc(db, "users", followerId));
        if (followerDoc.exists()) {
          const data = followerDoc.data();
          followerDetails.push({
            uid: followerId,
            displayName: data.displayName || "HoopLink User",
            photoURL: data.photoURL,
          });
        }
      } catch (error) {
        console.error(`Error fetching follower ${followerId}:`, error);
      }
    }

    return followerDetails;
  } catch (error) {
    console.error("Error getting followers list:", error);
    return [];
  }
}

/**
 * Get list of users that a user is following
 */
export async function getFollowingList(targetUid: string, limit: number = 50): Promise<Array<{ uid: string; displayName: string; photoURL?: string }>> {
  try {
    const userDoc = await getDoc(doc(db, "users", targetUid));
    if (!userDoc.exists()) return [];

    const following = (userDoc.data().following as string[]) || [];
    const followingDetails = [];

    for (const followingId of following.slice(0, limit)) {
      try {
        const followingDoc = await getDoc(doc(db, "users", followingId));
        if (followingDoc.exists()) {
          const data = followingDoc.data();
          followingDetails.push({
            uid: followingId,
            displayName: data.displayName || "HoopLink User",
            photoURL: data.photoURL,
          });
        }
      } catch (error) {
        console.error(`Error fetching following ${followingId}:`, error);
      }
    }

    return followingDetails;
  } catch (error) {
    console.error("Error getting following list:", error);
    return [];
  }
}
