import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import { addPoints } from "@/lib/gamification";
import type {
  LiveStream,
  LiveStreamChat,
  LiveStreamReaction,
  StreamAnalytics,
} from "@/types/live-stream";

export async function createLiveStream(streamData: Omit<LiveStream, 'id' | 'hostId' | 'hostName' | 'hostAvatar' | 'viewerCount' | 'createdAt' | 'updatedAt'>) {
  if (!auth?.currentUser) {
    throw new Error("You must be signed in to create a live stream.");
  }

  const user = auth.currentUser;
  const streamKey = generateStreamKey();

  const stream: Omit<LiveStream, 'id'> = {
    ...streamData,
    hostId: user.uid,
    hostName: user.displayName || "HoopLink User",
    hostAvatar: user.photoURL || "",
    viewerCount: 0,
    streamKey,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, "liveStreams"), stream);

  // Award points for creating a live stream
  await addPoints(user.uid, 25, "created_live_stream");

  return { id: docRef.id, ...stream };
}

export async function updateLiveStream(streamId: string, updates: Partial<LiveStream>) {
  if (!auth?.currentUser) {
    throw new Error("You must be signed in to update a live stream.");
  }

  const streamRef = doc(db, "liveStreams", streamId);
  await updateDoc(streamRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function startLiveStream(streamId: string) {
  if (!auth?.currentUser) {
    throw new Error("You must be signed in to start a live stream.");
  }

  const streamRef = doc(db, "liveStreams", streamId);
  await updateDoc(streamRef, {
    status: 'live',
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Notify followers about the live stream
  const stream = await getLiveStreamById(streamId);
  if (stream) {
    await notifyFollowersOfLiveStream(stream);
  }
}

export async function endLiveStream(streamId: string) {
  if (!auth?.currentUser) {
    throw new Error("You must be signed in to end a live stream.");
  }

  const streamRef = doc(db, "liveStreams", streamId);
  const streamDoc = await getDoc(streamRef);

  if (!streamDoc.exists()) {
    throw new Error("Stream not found.");
  }

  const streamData = streamDoc.data() as LiveStream;
  const duration = streamData.startedAt
    ? Math.floor((Date.now() - streamData.startedAt.getTime()) / (1000 * 60))
    : 0;

  await updateDoc(streamRef, {
    status: 'ended',
    endedAt: serverTimestamp(),
    duration,
    updatedAt: serverTimestamp(),
  });

  // Award points for completing a live stream
  await addPoints(auth.currentUser.uid, 50, "completed_live_stream");
}

export async function getLiveStreamById(streamId: string): Promise<LiveStream | null> {
  const streamDoc = await getDoc(doc(db, "liveStreams", streamId));
  if (!streamDoc.exists()) return null;

  const data = streamDoc.data();
  return {
    id: streamDoc.id,
    ...data,
    scheduledFor: data.scheduledFor?.toDate(),
    startedAt: data.startedAt?.toDate(),
    endedAt: data.endedAt?.toDate(),
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as LiveStream;
}

export async function getLiveStreams(options: {
  status?: LiveStream['status'];
  sport?: string;
  category?: LiveStream['category'];
  hostId?: string;
  limit?: number;
} = {}) {
  const constraints = [];

  if (options.status) {
    constraints.push(where("status", "==", options.status));
  }

  if (options.sport) {
    constraints.push(where("sport", "==", options.sport));
  }

  if (options.category) {
    constraints.push(where("category", "==", options.category));
  }

  if (options.hostId) {
    constraints.push(where("hostId", "==", options.hostId));
  }

  constraints.push(orderBy("createdAt", "desc"));

  if (options.limit) {
    constraints.push(limit(options.limit));
  }

  const q = query(collection(db, "liveStreams"), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
    scheduledFor: doc.data().scheduledFor?.toDate(),
    startedAt: doc.data().startedAt?.toDate(),
    endedAt: doc.data().endedAt?.toDate(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as LiveStream[];
}

export function subscribeToLiveStreams(callback: (streams: LiveStream[]) => void) {
  const q = query(
    collection(db, "liveStreams"),
    where("status", "in", ["scheduled", "live"]),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot: any) => {
    const streams = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      scheduledFor: doc.data().scheduledFor?.toDate(),
      startedAt: doc.data().startedAt?.toDate(),
      endedAt: doc.data().endedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as LiveStream[];

    callback(streams);
  });
}

export async function joinLiveStream(streamId: string) {
  if (!auth?.currentUser) {
    throw new Error("You must be signed in to join a live stream.");
  }

  const streamRef = doc(db, "liveStreams", streamId);
  await updateDoc(streamRef, {
    viewerCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  // Award points for watching a live stream
  await addPoints(auth.currentUser.uid, 5, "watched_live_stream");
}

export async function leaveLiveStream(streamId: string) {
  const streamRef = doc(db, "liveStreams", streamId);
  await updateDoc(streamRef, {
    viewerCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
}

// Chat functions
export async function sendChatMessage(streamId: string, message: string) {
  if (!auth?.currentUser) {
    throw new Error("You must be signed in to send messages.");
  }

  const chatMessage: Omit<LiveStreamChat, 'id'> = {
    streamId,
    userId: auth.currentUser.uid,
    userName: auth.currentUser.displayName || "HoopLink User",
    userAvatar: auth.currentUser.photoURL || "",
    message: message.trim(),
    timestamp: new Date(),
    type: 'message',
  };

  await addDoc(collection(db, "liveStreamChat"), chatMessage);
}

export function subscribeToChatMessages(streamId: string, callback: (messages: LiveStreamChat[]) => void) {
  const q = query(
    collection(db, "liveStreamChat"),
    where("streamId", "==", streamId),
    orderBy("timestamp", "desc"),
    limit(100)
  );

  return onSnapshot(q, (snapshot: any) => {
    const messages = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    })) as LiveStreamChat[];

    callback(messages.reverse()); // Reverse to show oldest first
  });
}

// Reaction functions
export async function sendReaction(streamId: string, reaction: LiveStreamReaction['reaction']) {
  if (!auth?.currentUser) {
    throw new Error("You must be signed in to send reactions.");
  }

  const reactionData: Omit<LiveStreamReaction, 'id'> = {
    streamId,
    userId: auth.currentUser.uid,
    reaction,
    timestamp: new Date(),
  };

  await addDoc(collection(db, "liveStreamReactions"), reactionData);
}

export function subscribeToReactions(streamId: string, callback: (reactions: LiveStreamReaction[]) => void) {
  const q = query(
    collection(db, "liveStreamReactions"),
    where("streamId", "==", streamId),
    orderBy("timestamp", "desc"),
    limit(50)
  );

  return onSnapshot(q, (snapshot: any) => {
    const reactions = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    })) as LiveStreamReaction[];

    callback(reactions.reverse());
  });
}

// Analytics
export async function recordStreamAnalytics(streamId: string, analytics: Partial<StreamAnalytics>) {
  const analyticsRef = doc(db, "streamAnalytics", streamId);
  await updateDoc(analyticsRef, {
    ...analytics,
    updatedAt: serverTimestamp(),
  });
}

export async function getStreamAnalytics(streamId: string): Promise<StreamAnalytics | null> {
  const analyticsDoc = await getDoc(doc(db, "streamAnalytics", streamId));
  if (!analyticsDoc.exists()) return null;

  return analyticsDoc.data() as StreamAnalytics;
}

// Utility functions
function generateStreamKey(): string {
  return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function notifyFollowersOfLiveStream(stream: LiveStream) {
  // This would typically involve getting the host's followers and sending notifications
  // For now, we'll create a system notification
  await createNotification({
    type: "system",
    recipientId: stream.hostId, // This should be sent to followers instead
    actorId: stream.hostId,
    actorName: stream.hostName,
    actorAvatar: stream.hostAvatar,
    message: `${stream.hostName} is now live streaming: ${stream.title}`,
  });
}