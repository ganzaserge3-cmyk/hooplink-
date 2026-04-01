import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export async function recordProfileVisit(targetUid: string) {
  if (!auth?.currentUser || !db || auth.currentUser.uid === targetUid) {
    return;
  }

  const snapshot = await getDoc(doc(db, "users", targetUid));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const analytics = (data.analytics as Record<string, unknown> | undefined) ?? {};
  const seenVisitors = Array.isArray(analytics.seenVisitors) ? (analytics.seenVisitors as string[]) : [];
  const uniqueVisitors = Array.from(new Set([...seenVisitors, auth.currentUser.uid]));

  await setDoc(
    doc(db, "users", targetUid),
    {
      analytics: {
        ...analytics,
        seenVisitors: uniqueVisitors,
        profileVisitors: uniqueVisitors.length,
        lastVisitedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function recordFollowerGrowth(targetUid: string, nextFollowerCount: number) {
  if (!db) {
    return;
  }

  const snapshot = await getDoc(doc(db, "users", targetUid));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const analytics = (data.analytics as Record<string, unknown> | undefined) ?? {};
  const history = Array.isArray(analytics.followerHistory)
    ? (analytics.followerHistory as Array<Record<string, unknown>>)
    : [];
  const today = new Date().toISOString().slice(5, 10);
  const nextHistory = [
    ...history.filter((entry) => String(entry.label ?? "") !== today),
    { label: today, value: nextFollowerCount },
  ].slice(-14);

  await setDoc(
    doc(db, "users", targetUid),
    {
      analytics: {
        ...analytics,
        followerHistory: nextHistory,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
