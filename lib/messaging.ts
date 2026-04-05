import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { uploadToCloudinary } from "@/lib/cloudinary";
import { auth, db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";

export type ConversationType =
  | "direct"
  | "team"
  | "event"
  | "recruiting"
  | "office-hours"
  | "ama"
  | "topic"
  | "local"
  | "mastermind"
  | "creator-collab"
  | "mentor"
  | "announcement"
  | "broadcast";

export type ConversationNotificationLevel = "all" | "mentions" | "silent";
export type ReminderKind = "practice" | "recruiting" | "follow-up" | "coach-feedback" | "general";

export interface ConversationRoleMembers {
  admins: string[];
  moderators: string[];
  members: string[];
}

export interface ConversationSummary {
  id: string;
  participantIds: string[];
  participantProfiles: Array<{
    uid: string;
    displayName: string;
    photoURL: string;
  }>;
  lastMessage: string;
  lastSenderId?: string | null;
  unreadBy: string[];
  typingBy: string[];
  mutedBy: string[];
  archivedBy: string[];
  pinnedBy: string[];
  vipBy: string[];
  blockedBy: string[];
  reportedBy: string[];
  requestStatus?: "inbox" | "request" | "spam";
  conversationType?: ConversationType;
  roomLabel?: string | null;
  roomTopic?: string | null;
  roomLocation?: string | null;
  roleAccess?: string | null;
  roleMembers?: ConversationRoleMembers | null;
  notificationLevelBy?: Record<string, ConversationNotificationLevel>;
  quietHoursBy?: Record<string, string>;
  presenceBy?: Record<string, "online" | "offline">;
  lastSeenBy?: Record<string, string>;
  pinnedMessageIds?: string[];
  announcementOnly?: boolean;
  broadcastOnly?: boolean;
  autoReplyBy?: string[];
  inviteLinkCode?: string | null;
  roomDescription?: string | null;
  roomTopicTags?: string[];
  postingPermission?: "everyone" | "admins" | "moderators";
  officeHoursQueue?: string[];
  amaApprovalRequired?: boolean;
  bannedUserIds?: string[];
  slowModeSeconds?: number;
  antiSpamCooldownSeconds?: number;
  sharedNotes?: string | null;
  filesVault?: Array<{ label: string; url: string; type: string }>;
  calendarSyncEnabled?: boolean;
  liveRoomRecording?: boolean;
  attendancePrompt?: string | null;
  recruiterVerified?: boolean;
  coachVerified?: boolean;
  trustSignals?: string[];
  updatedAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface ConversationPollOption {
  id: string;
  label: string;
  votes: string[];
}

export interface ConversationPoll {
  question: string;
  options: ConversationPollOption[];
}

export interface ConversationTaskItem {
  id: string;
  text: string;
  completedBy: string[];
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface ConversationLinkPreview {
  url: string;
  title: string;
  domain: string;
}

export interface ConversationCalendarItem {
  title: string;
  date: string;
  location?: string | null;
}

export interface ConversationReminder {
  label: string;
  kind: ReminderKind;
  dueAt: string;
}

export interface ConversationReplyPreview {
  messageId: string;
  senderId: string;
  text: string;
}

export interface ConversationForwardPreview {
  messageId: string;
  senderName: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  messageType?:
    | "text"
    | "poll"
    | "task-list"
    | "voice-note"
    | "video-message"
    | "calendar"
    | "reminder"
    | "system";
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  voiceNoteUrl?: string | null;
  videoMessageUrl?: string | null;
  poll?: ConversationPoll | null;
  taskList?: ConversationTaskItem[] | null;
  scheduledFor?: { seconds?: number; nanoseconds?: number } | null;
  starredBy: string[];
  savedBy: string[];
  mentions: string[];
  hashtags: string[];
  linkPreview?: ConversationLinkPreview | null;
  replyTo?: ConversationReplyPreview | null;
  quoteReplyTo?: ConversationReplyPreview | null;
  forwardedFrom?: ConversationForwardPreview | null;
  reactions: MessageReaction[];
  calendarItem?: ConversationCalendarItem | null;
  reminder?: ConversationReminder | null;
  threadRootId?: string | null;
  voiceTranscription?: string | null;
  aiTranslationSummary?: string | null;
  urgent?: boolean;
  locationShare?: { label: string; coordinates?: string | null } | null;
  deleted?: boolean;
  readBy: string[];
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

type ListenerCleanup = () => void;
type FirestoreDocSnapshot = {
  id: string;
  data: () => Record<string, unknown>;
};
type FirestoreQuerySnapshot = {
  docs: FirestoreDocSnapshot[];
};

function extractMentions(text: string) {
  return Array.from(new Set((text.match(/@\w+/g) ?? []).map((token) => token.slice(1).toLowerCase())));
}

function extractHashtags(text: string) {
  return Array.from(new Set((text.match(/#\w+/g) ?? []).map((token) => token.slice(1).toLowerCase())));
}

function buildLinkPreview(text: string): ConversationLinkPreview | null {
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  if (!urlMatch) {
    return null;
  }

  try {
    const url = new URL(urlMatch[0]);
    return {
      url: url.toString(),
      title: url.hostname.replace(/^www\./, ""),
      domain: url.hostname.replace(/^www\./, ""),
    };
  } catch {
    return null;
  }
}

async function getCurrentUserMiniProfile() {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const user = auth.currentUser;
  const profileSnapshot = await getDoc(doc(db, "users", user.uid));
  const profile = profileSnapshot.exists()
    ? (profileSnapshot.data() as Record<string, unknown>)
    : null;

  return {
    uid: user.uid,
    displayName: user.displayName || String(profile?.displayName ?? "HoopLink User"),
    photoURL: user.photoURL || String(profile?.photoURL ?? ""),
  };
}

function buildConversationKey(ids: string[]) {
  return [...ids].sort().join("__");
}

function mapTimestamp(data: Record<string, unknown>, key: string) {
  return (data[key] as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null;
}

function normalizeRoleMembers(input: unknown, participantIds: string[]): ConversationRoleMembers {
  const source = (input as Record<string, unknown> | null) ?? {};
  return {
    admins: Array.isArray(source.admins) ? (source.admins as string[]) : [],
    moderators: Array.isArray(source.moderators) ? (source.moderators as string[]) : [],
    members: Array.isArray(source.members) ? (source.members as string[]) : participantIds,
  };
}

function mapConversationMessage(
  id: string,
  data: Record<string, unknown>
): ConversationMessage {
  return {
    id,
    conversationId: String(data.conversationId ?? ""),
    senderId: String(data.senderId ?? ""),
    text: String(data.text ?? ""),
    messageType:
      data.messageType === "poll" ||
      data.messageType === "task-list" ||
      data.messageType === "voice-note" ||
      data.messageType === "video-message" ||
      data.messageType === "calendar" ||
      data.messageType === "reminder" ||
      data.messageType === "system"
        ? data.messageType
        : "text",
    attachmentUrl: data.attachmentUrl ? String(data.attachmentUrl) : null,
    attachmentType: data.attachmentType ? String(data.attachmentType) : null,
    voiceNoteUrl: data.voiceNoteUrl ? String(data.voiceNoteUrl) : null,
    videoMessageUrl: data.videoMessageUrl ? String(data.videoMessageUrl) : null,
    poll: data.poll ? (data.poll as ConversationPoll) : null,
    taskList: Array.isArray(data.taskList) ? (data.taskList as ConversationTaskItem[]) : null,
    scheduledFor: mapTimestamp(data, "scheduledFor"),
    starredBy: Array.isArray(data.starredBy) ? (data.starredBy as string[]) : [],
    savedBy: Array.isArray(data.savedBy) ? (data.savedBy as string[]) : [],
    mentions: Array.isArray(data.mentions) ? (data.mentions as string[]) : [],
    hashtags: Array.isArray(data.hashtags) ? (data.hashtags as string[]) : [],
    linkPreview: data.linkPreview ? (data.linkPreview as ConversationLinkPreview) : null,
    replyTo: data.replyTo ? (data.replyTo as ConversationReplyPreview) : null,
    quoteReplyTo: data.quoteReplyTo ? (data.quoteReplyTo as ConversationReplyPreview) : null,
    forwardedFrom: data.forwardedFrom ? (data.forwardedFrom as ConversationForwardPreview) : null,
    reactions: Array.isArray(data.reactions) ? (data.reactions as MessageReaction[]) : [],
    calendarItem: data.calendarItem ? (data.calendarItem as ConversationCalendarItem) : null,
    reminder: data.reminder ? (data.reminder as ConversationReminder) : null,
    threadRootId: data.threadRootId ? String(data.threadRootId) : null,
    voiceTranscription: data.voiceTranscription ? String(data.voiceTranscription) : null,
    aiTranslationSummary: data.aiTranslationSummary ? String(data.aiTranslationSummary) : null,
    urgent: data.urgent === true,
    locationShare: data.locationShare
      ? (data.locationShare as { label: string; coordinates?: string | null })
      : null,
    deleted: Boolean(data.deleted),
    readBy: Array.isArray(data.readBy) ? (data.readBy as string[]) : [],
    createdAt: mapTimestamp(data, "createdAt"),
  };
}

export async function createOrGetConversation(otherUserId: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const currentUserId = auth.currentUser.uid;
  const participantIds = [currentUserId, otherUserId].sort();
  const key = buildConversationKey(participantIds);

  const snapshot = await getDocs(
    query(collection(db, "conversations"), where("key", "==", key), limit(1))
  );
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  const currentUserProfile = await getCurrentUserMiniProfile();
  const otherUserSnapshot = await getDoc(doc(db, "users", otherUserId));
  const otherUser = otherUserSnapshot.exists()
    ? (otherUserSnapshot.data() as Record<string, unknown>)
    : null;

  const created = await addDoc(collection(db, "conversations"), {
    key,
    participantIds,
    participantProfiles: [
      currentUserProfile,
      {
        uid: otherUserId,
        displayName: String(otherUser?.displayName ?? "HoopLink User"),
        photoURL: String(otherUser?.photoURL ?? ""),
      },
    ],
    lastMessage: "",
    lastSenderId: null,
    unreadBy: [],
    typingBy: [],
    mutedBy: [],
    archivedBy: [],
    pinnedBy: [],
    vipBy: [],
    blockedBy: [],
    reportedBy: [],
    requestStatus: "inbox",
    conversationType: "direct",
    roomLabel: null,
    roomTopic: null,
    roomLocation: null,
    roleAccess: null,
    roleMembers: {
      admins: [currentUserId],
      moderators: [],
      members: [otherUserId],
    },
    notificationLevelBy: {
      [currentUserId]: "all",
      [otherUserId]: "all",
    },
    quietHoursBy: {},
    presenceBy: {
      [currentUserId]: "online",
      [otherUserId]: "offline",
    },
    lastSeenBy: {
      [currentUserId]: new Date().toISOString(),
    },
    pinnedMessageIds: [],
    announcementOnly: false,
    broadcastOnly: false,
    autoReplyBy: [],
    inviteLinkCode: `room-${Math.random().toString(36).slice(2, 8)}`,
    roomDescription: null,
    roomTopicTags: [],
    postingPermission: "everyone",
    officeHoursQueue: [],
    amaApprovalRequired: false,
    bannedUserIds: [],
    slowModeSeconds: 0,
    antiSpamCooldownSeconds: 0,
    sharedNotes: "",
    filesVault: [],
    calendarSyncEnabled: false,
    liveRoomRecording: false,
    attendancePrompt: null,
    recruiterVerified: false,
    coachVerified: false,
    trustSignals: [],
    updatedAt: serverTimestamp(),
  });

  return created.id;
}

export async function markConversationRead(conversationId: string) {
  if (!auth?.currentUser || !db) {
    return;
  }

  const snapshot = await getDoc(doc(db, "conversations", conversationId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const unreadBy = Array.isArray(data.unreadBy) ? (data.unreadBy as string[]) : [];
  if (!unreadBy.includes(auth.currentUser.uid)) {
    return;
  }

  const lastSeenBy = (data.lastSeenBy as Record<string, string> | undefined) ?? {};
  await setDoc(
    doc(db, "conversations", conversationId),
    {
      unreadBy: unreadBy.filter((uid) => uid !== auth.currentUser?.uid),
      lastSeenBy: { ...lastSeenBy, [auth.currentUser.uid]: new Date().toISOString() },
    },
    { merge: true }
  );
}

export async function setConversationTyping(conversationId: string, isTyping: boolean) {
  if (!auth?.currentUser || !db) {
    return;
  }

  const snapshot = await getDoc(doc(db, "conversations", conversationId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const typingBy = Array.isArray(data.typingBy) ? (data.typingBy as string[]) : [];
  const nextTypingBy = isTyping
    ? Array.from(new Set([...typingBy, auth.currentUser.uid]))
    : typingBy.filter((uid) => uid !== auth.currentUser?.uid);

  await setDoc(
    doc(db, "conversations", conversationId),
    { typingBy: nextTypingBy },
    { merge: true }
  );
}

export async function setConversationPresence(
  conversationId: string,
  status: "online" | "offline"
) {
  if (!auth?.currentUser || !db) {
    return;
  }

  const snapshot = await getDoc(doc(db, "conversations", conversationId));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const presenceBy = (data.presenceBy as Record<string, "online" | "offline"> | undefined) ?? {};
  const lastSeenBy = (data.lastSeenBy as Record<string, string> | undefined) ?? {};

  await setDoc(
    doc(db, "conversations", conversationId),
    {
      presenceBy: { ...presenceBy, [auth.currentUser.uid]: status },
      lastSeenBy: { ...lastSeenBy, [auth.currentUser.uid]: new Date().toISOString() },
    },
    { merge: true }
  );
}

export async function sendConversationMessage(
  conversationId: string,
  text: string,
  attachmentFile?: File | null,
  options?: {
    messageType?: ConversationMessage["messageType"];
    poll?: ConversationPoll | null;
    taskList?: ConversationTaskItem[] | null;
    scheduledFor?: Date | null;
    replyTo?: ConversationReplyPreview | null;
    forwardedFrom?: ConversationForwardPreview | null;
    quoteReplyTo?: ConversationReplyPreview | null;
    calendarItem?: ConversationCalendarItem | null;
    reminder?: ConversationReminder | null;
    threadRootId?: string | null;
    voiceTranscription?: string | null;
    aiTranslationSummary?: string | null;
    urgent?: boolean;
    locationShare?: { label: string; coordinates?: string | null } | null;
  }
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const trimmedText = text.trim();
  if (!trimmedText && !attachmentFile && !options?.calendarItem && !options?.reminder) {
    return;
  }

  const sender = await getCurrentUserMiniProfile();
  const conversationSnapshot = await getDoc(doc(db, "conversations", conversationId));
  const conversation = conversationSnapshot.exists()
    ? (conversationSnapshot.data() as Record<string, unknown>)
    : null;
  const participantIds = Array.isArray(conversation?.participantIds)
    ? (conversation?.participantIds as string[])
    : [];
  const recipientId = participantIds.find((id) => id !== sender.uid);
  const bannedUserIds = Array.isArray(conversation?.bannedUserIds)
    ? (conversation?.bannedUserIds as string[])
    : [];
  if (bannedUserIds.includes(sender.uid)) {
    throw new Error("You are banned from this room.");
  }

  let attachmentUrl = "";
  let attachmentType = "";

  if (attachmentFile) {
    const uploadedAttachment = await uploadToCloudinary(
      attachmentFile,
      `hooplink/messages/${conversationId}`
    );
    attachmentUrl = uploadedAttachment.url;
    attachmentType = attachmentFile.type || "file";
  }

  const linkPreview = buildLinkPreview(trimmedText);
  const mentions = extractMentions(trimmedText);
  const hashtags = extractHashtags(trimmedText);

  await addDoc(collection(db, "messages"), {
    conversationId,
    senderId: sender.uid,
    text: trimmedText,
    messageType: options?.messageType ?? "text",
    attachmentUrl: attachmentUrl || null,
    attachmentType: attachmentType || null,
    voiceNoteUrl: options?.messageType === "voice-note" ? attachmentUrl || null : null,
    videoMessageUrl: options?.messageType === "video-message" ? attachmentUrl || null : null,
    poll: options?.poll ?? null,
    taskList: options?.taskList ?? null,
    scheduledFor: options?.scheduledFor ?? null,
    starredBy: [],
    savedBy: [],
    mentions,
    hashtags,
    linkPreview,
    replyTo: options?.replyTo ?? null,
    quoteReplyTo: options?.quoteReplyTo ?? null,
    forwardedFrom: options?.forwardedFrom ?? null,
    reactions: [],
    calendarItem: options?.calendarItem ?? null,
    reminder: options?.reminder ?? null,
    threadRootId: options?.threadRootId ?? null,
    voiceTranscription: options?.voiceTranscription?.trim() || null,
    aiTranslationSummary: options?.aiTranslationSummary?.trim() || null,
    urgent: options?.urgent === true,
    locationShare: options?.locationShare ?? null,
    readBy: [sender.uid],
    createdAt: serverTimestamp(),
  });

  const nextVault =
    attachmentUrl && attachmentType
      ? arrayUnion({
          label: attachmentFile?.name || "Shared file",
          url: attachmentUrl,
          type: attachmentType,
        })
      : [];

  await setDoc(
    doc(db, "conversations", conversationId),
    {
      lastMessage: trimmedText || options?.calendarItem?.title || options?.reminder?.label || "Sent an attachment",
      lastSenderId: sender.uid,
      unreadBy: recipientId ? arrayUnion(recipientId) : [],
      typingBy: [],
      ...(attachmentUrl && attachmentType ? { filesVault: nextVault } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  if (recipientId) {
    await createNotification({
      type: "message",
      recipientId,
      actorId: sender.uid,
      actorName: sender.displayName,
      actorAvatar: sender.photoURL,
      message: `${sender.displayName} sent you a message.`,
    });
  }
}

export async function forwardConversationMessage(
  conversationId: string,
  message: ConversationMessage,
  note = ""
) {
  const sender = await getCurrentUserMiniProfile();
  await sendConversationMessage(conversationId, note || message.text || "Forwarded message", null, {
    messageType: message.messageType === "voice-note" || message.messageType === "video-message" ? "text" : message.messageType,
    poll: message.poll ?? null,
    taskList: message.taskList ?? null,
    forwardedFrom: {
      messageId: message.id,
      senderName: sender.displayName,
    },
    calendarItem: message.calendarItem ?? null,
    reminder: message.reminder ?? null,
    threadRootId: message.threadRootId ?? null,
  });
}

export async function updateConversationState(
  conversationId: string,
  field:
    | "mutedBy"
    | "archivedBy"
    | "pinnedBy"
    | "vipBy"
    | "autoReplyBy"
    | "blockedBy"
    | "reportedBy",
  enabled: boolean
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "conversations", conversationId));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  const current = Array.isArray(data?.[field]) ? (data?.[field] as string[]) : [];
  const nextValues = enabled
    ? Array.from(new Set([...current, auth.currentUser.uid]))
    : current.filter((uid) => uid !== auth.currentUser?.uid);

  await setDoc(doc(db, "conversations", conversationId), { [field]: nextValues }, { merge: true });
}

export async function updateConversationPreferences(input: {
  conversationId: string;
  notificationLevel?: ConversationNotificationLevel;
  quietHours?: string;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "conversations", input.conversationId));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const notificationLevelBy =
    (data.notificationLevelBy as Record<string, ConversationNotificationLevel> | undefined) ?? {};
  const quietHoursBy = (data.quietHoursBy as Record<string, string> | undefined) ?? {};

  await setDoc(
    doc(db, "conversations", input.conversationId),
    {
      notificationLevelBy:
        input.notificationLevel
          ? { ...notificationLevelBy, [auth.currentUser.uid]: input.notificationLevel }
          : notificationLevelBy,
      quietHoursBy:
        input.quietHours !== undefined
          ? { ...quietHoursBy, [auth.currentUser.uid]: input.quietHours }
          : quietHoursBy,
    },
    { merge: true }
  );
}

export async function updateConversationMessage(messageId: string, text: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(
    doc(db, "messages", messageId),
    {
      text: text.trim(),
      mentions: extractMentions(text),
      hashtags: extractHashtags(text),
      linkPreview: buildLinkPreview(text),
      editedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateConversationMetadata(
  conversationId: string,
  values: Partial<
    Pick<
      ConversationSummary,
      | "conversationType"
      | "roomLabel"
      | "roomTopic"
      | "roomLocation"
      | "roleAccess"
      | "roleMembers"
      | "requestStatus"
      | "announcementOnly"
      | "broadcastOnly"
      | "pinnedMessageIds"
      | "inviteLinkCode"
      | "roomDescription"
      | "roomTopicTags"
      | "postingPermission"
      | "officeHoursQueue"
      | "amaApprovalRequired"
      | "bannedUserIds"
      | "slowModeSeconds"
      | "antiSpamCooldownSeconds"
      | "sharedNotes"
      | "filesVault"
      | "calendarSyncEnabled"
      | "liveRoomRecording"
      | "attendancePrompt"
      | "recruiterVerified"
      | "coachVerified"
      | "trustSignals"
    >
  >
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(doc(db, "conversations", conversationId), values, { merge: true });
}

export async function deleteConversationMessage(messageId: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await setDoc(
    doc(db, "messages", messageId),
    {
      text: "Message deleted",
      attachmentUrl: null,
      attachmentType: null,
      deleted: true,
      deletedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function toggleConversationPinnedMessage(conversationId: string, messageId: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "conversations", conversationId));
  const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const current = Array.isArray(data.pinnedMessageIds) ? (data.pinnedMessageIds as string[]) : [];
  const next = current.includes(messageId)
    ? current.filter((id) => id !== messageId)
    : [...current, messageId];

  await setDoc(doc(db, "conversations", conversationId), { pinnedMessageIds: next }, { merge: true });
}

export async function toggleConversationMessageFlag(
  messageId: string,
  field: "starredBy" | "savedBy"
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "messages", messageId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const current = Array.isArray(data[field]) ? (data[field] as string[]) : [];
  const next = current.includes(auth.currentUser.uid)
    ? current.filter((uid) => uid !== auth.currentUser?.uid)
    : [...current, auth.currentUser.uid];

  await setDoc(doc(db, "messages", messageId), { [field]: next }, { merge: true });
}

export async function reactToConversationMessage(messageId: string, emoji: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "messages", messageId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const reactions = Array.isArray(data.reactions) ? (data.reactions as MessageReaction[]) : [];
  const nextReactions = reactions
    .map((reaction) => ({
      ...reaction,
      userIds: reaction.userIds.filter((uid) => uid !== auth.currentUser?.uid),
    }))
    .filter((reaction) => reaction.userIds.length > 0);

  const existing = nextReactions.find((reaction) => reaction.emoji === emoji);
  if (existing) {
    existing.userIds = [...existing.userIds, auth.currentUser.uid];
  } else {
    nextReactions.push({ emoji, userIds: [auth.currentUser.uid] });
  }

  await setDoc(doc(db, "messages", messageId), { reactions: nextReactions }, { merge: true });
}

export async function voteConversationPoll(messageId: string, optionId: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "messages", messageId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const poll = data.poll as ConversationPoll | undefined;
  if (!poll?.options?.length) {
    return;
  }

  const nextOptions = poll.options.map((option) => {
    const votes = Array.isArray(option.votes) ? option.votes : [];
    const cleanedVotes = votes.filter((uid) => uid !== auth.currentUser?.uid);
    return {
      ...option,
      votes: option.id === optionId ? [...cleanedVotes, auth.currentUser!.uid] : cleanedVotes,
    };
  });

  await setDoc(doc(db, "messages", messageId), { poll: { ...poll, options: nextOptions } }, { merge: true });
}

export async function toggleConversationTaskItem(messageId: string, taskId: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "messages", messageId));
  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const tasks = Array.isArray(data.taskList) ? (data.taskList as ConversationTaskItem[]) : [];
  const nextTasks = tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    const completedBy = Array.isArray(task.completedBy) ? task.completedBy : [];
    const nextCompletedBy = completedBy.includes(auth.currentUser!.uid)
      ? completedBy.filter((uid) => uid !== auth.currentUser?.uid)
      : [...completedBy, auth.currentUser!.uid];

    return {
      ...task,
      completedBy: nextCompletedBy,
    };
  });

  await setDoc(doc(db, "messages", messageId), { taskList: nextTasks }, { merge: true });
}

export function subscribeToConversations(
  userId: string,
  callback: (conversations: ConversationSummary[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  const conversationsQuery = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", userId),
    orderBy("updatedAt", "desc"),
    limit(30)
  );

  return onSnapshot(conversationsQuery, (snapshot: FirestoreQuerySnapshot) => {
    callback(
      snapshot.docs.map((docSnapshot: FirestoreDocSnapshot) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        const participantIds = Array.isArray(data.participantIds) ? (data.participantIds as string[]) : [];
        return {
          id: docSnapshot.id,
          participantIds,
          participantProfiles: Array.isArray(data.participantProfiles)
            ? (data.participantProfiles as ConversationSummary["participantProfiles"])
            : [],
          lastMessage: String(data.lastMessage ?? ""),
          lastSenderId: data.lastSenderId ? String(data.lastSenderId) : null,
          unreadBy: Array.isArray(data.unreadBy) ? (data.unreadBy as string[]) : [],
          typingBy: Array.isArray(data.typingBy) ? (data.typingBy as string[]) : [],
          mutedBy: Array.isArray(data.mutedBy) ? (data.mutedBy as string[]) : [],
          archivedBy: Array.isArray(data.archivedBy) ? (data.archivedBy as string[]) : [],
          pinnedBy: Array.isArray(data.pinnedBy) ? (data.pinnedBy as string[]) : [],
          vipBy: Array.isArray(data.vipBy) ? (data.vipBy as string[]) : [],
          blockedBy: Array.isArray(data.blockedBy) ? (data.blockedBy as string[]) : [],
          reportedBy: Array.isArray(data.reportedBy) ? (data.reportedBy as string[]) : [],
          requestStatus:
            data.requestStatus === "request" || data.requestStatus === "spam"
              ? data.requestStatus
              : "inbox",
          conversationType: data.conversationType
            ? (String(data.conversationType) as ConversationType)
            : "direct",
          roomLabel: data.roomLabel ? String(data.roomLabel) : null,
          roomTopic: data.roomTopic ? String(data.roomTopic) : null,
          roomLocation: data.roomLocation ? String(data.roomLocation) : null,
          roleAccess: data.roleAccess ? String(data.roleAccess) : null,
          roleMembers: normalizeRoleMembers(data.roleMembers, participantIds),
          notificationLevelBy: data.notificationLevelBy
            ? (data.notificationLevelBy as Record<string, ConversationNotificationLevel>)
            : {},
          quietHoursBy: data.quietHoursBy ? (data.quietHoursBy as Record<string, string>) : {},
          presenceBy: data.presenceBy ? (data.presenceBy as Record<string, "online" | "offline">) : {},
          lastSeenBy: data.lastSeenBy ? (data.lastSeenBy as Record<string, string>) : {},
          pinnedMessageIds: Array.isArray(data.pinnedMessageIds) ? (data.pinnedMessageIds as string[]) : [],
          announcementOnly: Boolean(data.announcementOnly),
          broadcastOnly: Boolean(data.broadcastOnly),
          autoReplyBy: Array.isArray(data.autoReplyBy) ? (data.autoReplyBy as string[]) : [],
          inviteLinkCode: data.inviteLinkCode ? String(data.inviteLinkCode) : null,
          roomDescription: data.roomDescription ? String(data.roomDescription) : null,
          roomTopicTags: Array.isArray(data.roomTopicTags) ? (data.roomTopicTags as string[]) : [],
          postingPermission:
            data.postingPermission === "admins" || data.postingPermission === "moderators"
              ? data.postingPermission
              : "everyone",
          officeHoursQueue: Array.isArray(data.officeHoursQueue) ? (data.officeHoursQueue as string[]) : [],
          amaApprovalRequired: Boolean(data.amaApprovalRequired),
          bannedUserIds: Array.isArray(data.bannedUserIds) ? (data.bannedUserIds as string[]) : [],
          slowModeSeconds: Number(data.slowModeSeconds ?? 0),
          antiSpamCooldownSeconds: Number(data.antiSpamCooldownSeconds ?? 0),
          sharedNotes: data.sharedNotes ? String(data.sharedNotes) : null,
          filesVault: Array.isArray(data.filesVault)
            ? (data.filesVault as Array<{ label: string; url: string; type: string }>)
            : [],
          calendarSyncEnabled: Boolean(data.calendarSyncEnabled),
          liveRoomRecording: Boolean(data.liveRoomRecording),
          attendancePrompt: data.attendancePrompt ? String(data.attendancePrompt) : null,
          recruiterVerified: Boolean(data.recruiterVerified),
          coachVerified: Boolean(data.coachVerified),
          trustSignals: Array.isArray(data.trustSignals) ? (data.trustSignals as string[]) : [],
          updatedAt: mapTimestamp(data, "updatedAt"),
        } satisfies ConversationSummary;
      })
    );
  });
}

export function subscribeToConversationMessages(
  conversationId: string,
  callback: (messages: ConversationMessage[]) => void
): ListenerCleanup {
  if (!db) {
    callback([]);
    return () => undefined;
  }

  const messagesQuery = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "asc"),
    limit(150)
  );

  return onSnapshot(messagesQuery, async (snapshot: FirestoreQuerySnapshot) => {
    const nextMessages = snapshot.docs.map((docSnapshot: FirestoreDocSnapshot) =>
      mapConversationMessage(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
    );

    callback(nextMessages);

    if (auth?.currentUser) {
      await Promise.all(
        nextMessages
          .filter(
            (message: ConversationMessage) =>
              message.senderId !== auth.currentUser?.uid &&
              !message.readBy.includes(auth.currentUser.uid)
          )
          .map((message: ConversationMessage) =>
            setDoc(
              doc(db, "messages", message.id),
              { readBy: [...message.readBy, auth.currentUser!.uid] },
              { merge: true }
            )
          )
      );
    }
  });
}
