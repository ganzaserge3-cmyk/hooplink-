import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export interface ViewedPostRecord {
  id: string;
  postId: string;
  viewedAt?: { seconds?: number; nanoseconds?: number } | null;
}

export async function recordViewedPost(postId: string) {
  if (!auth?.currentUser || !db) {
    return;
  }

  await setDoc(
    doc(db, "viewHistory", `${auth.currentUser.uid}__${postId}`),
    {
      userId: auth.currentUser.uid,
      postId,
      viewedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getViewedPosts() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(db, "viewHistory"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("viewedAt", "desc"),
      limit(50)
    )
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      postId: String(data.postId ?? ""),
      viewedAt:
        (data.viewedAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
    } satisfies ViewedPostRecord;
  });
}
