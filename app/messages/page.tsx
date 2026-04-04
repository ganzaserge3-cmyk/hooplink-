"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Archive, ArrowLeft, Bell, Bookmark, CalendarDays, Clock3, FileText, Forward, Hand, ImagePlus, MapPin, MessageCircleReply, Mic, Pencil, Phone, Pin, Search, SendHorizontal, Sparkles, Star, Trash2, Video, Vote, ShieldAlert, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  createOrGetConversation, deleteConversationMessage, forwardConversationMessage, markConversationRead,
  reactToConversationMessage, sendConversationMessage, setConversationPresence, setConversationTyping,
  subscribeToConversationMessages, subscribeToConversations, toggleConversationMessageFlag,
  toggleConversationPinnedMessage, toggleConversationTaskItem, updateConversationMessage,
  updateConversationMetadata, updateConversationPreferences, updateConversationState, voteConversationPoll,
  type ConversationMessage, type ConversationNotificationLevel, type ConversationPoll,
  type ConversationReplyPreview, type ConversationSummary, type ConversationTaskItem, type ReminderKind,
} from "@/lib/messaging";
import { getPlatformPreferences, translateMessagePreview } from "@/lib/phase9";
import { formatTimeAgo } from "@/lib/posts";

type InboxFilter = "all" | "unread" | "pinned" | "vip" | "requests" | "spam";
type ComposerMode = "text" | "poll" | "tasks" | "voice" | "video" | "calendar" | "reminder";
type Panel = "chat" | "media" | "tasks" | "saved" | "starred";

const QUICK_REACTIONS = ["🔥", "👏", "💯"];
const QUIET_HOURS = ["off", "10pm-7am", "practice-only"];
const NOTIFY: ConversationNotificationLevel[] = ["all", "mentions", "silent"];
const ICEBREAKERS = ["What are you training for this week?", "Share one recent win from your season.", "What should this group focus on first?", "Drop your next content idea here."];
const ROOM_PRESETS: Array<{ label: string; type: NonNullable<ConversationSummary["conversationType"]>; topic: string; roleAccess?: string; announcementOnly?: boolean; broadcastOnly?: boolean; }> = [
  { label: "Team", type: "team", topic: "Practice updates", roleAccess: "players and coaches" },
  { label: "Event", type: "event", topic: "Tournament plans" },
  { label: "Recruiting", type: "recruiting", topic: "Recruiting follow-ups" },
  { label: "Office Hours", type: "office-hours", topic: "Coach office hours", roleAccess: "coach and athletes" },
  { label: "AMA", type: "ama", topic: "Open fan questions", announcementOnly: true },
  { label: "Topic", type: "topic", topic: "Basketball IQ" },
  { label: "Local", type: "local", topic: "Local hoop community" },
  { label: "Mastermind", type: "mastermind", topic: "Private growth room" },
  { label: "Collab", type: "creator-collab", topic: "Brand collab planning" },
  { label: "Mentor", type: "mentor", topic: "Mentor check-ins", roleAccess: "mentor-only" },
  { label: "Announcement", type: "announcement", topic: "Official updates", announcementOnly: true },
  { label: "Broadcast", type: "broadcast", topic: "One-way channel", broadcastOnly: true },
];

function badgeLabel(conversation: ConversationSummary) { return conversation.roomLabel || conversation.conversationType || "direct"; }
function formatLastSeen(value?: string) { return value ? `Last seen ${new Date(value).toLocaleString()}` : "No recent activity"; }
function nextNotify(current: ConversationNotificationLevel) { return NOTIFY[(NOTIFY.indexOf(current) + 1) % NOTIFY.length]; }
function buildPoll(question: string, options: string[]): ConversationPoll { return { question, options: options.map((label, index) => ({ id: `opt-${index + 1}`, label: label.trim(), votes: [] })).filter((entry) => entry.label) }; }
function buildTasks(tasks: string[]): ConversationTaskItem[] { return tasks.map((text, index) => ({ id: `task-${index + 1}`, text: text.trim(), completedBy: [] })).filter((entry) => entry.text); }

function MessagesPageContent() {
  const { user } = useAuthContext();
  const currentUserId = user?.uid ?? "";
  const starterUser = useSearchParams().get("user");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [dmLanguage, setDmLanguage] = useState("en");
  const [showArchived, setShowArchived] = useState(false);
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all");
  const [panel, setPanel] = useState<Panel>("chat");
  const [composerMode, setComposerMode] = useState<ComposerMode>("text");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [taskDraft, setTaskDraft] = useState(["", ""]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ConversationReplyPreview | null>(null);
  const [calendarDraft, setCalendarDraft] = useState({ title: "", date: "", location: "" });
  const [reminderDraft, setReminderDraft] = useState<{ label: string; kind: ReminderKind; dueAt: string }>({ label: "", kind: "general", dueAt: "" });
  const [roomLocationDraft, setRoomLocationDraft] = useState("");
  const [roleAccessDraft, setRoleAccessDraft] = useState("");
  const [roomDescriptionDraft, setRoomDescriptionDraft] = useState("");
  const [topicTagsDraft, setTopicTagsDraft] = useState("");
  const [postingPermissionDraft, setPostingPermissionDraft] = useState<"everyone" | "admins" | "moderators">("everyone");
  const [messageSenderFilter, setMessageSenderFilter] = useState("all");
  const [messageDateFilter, setMessageDateFilter] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [urgentDraft, setUrgentDraft] = useState(false);
  const [voiceTranscriptDraft, setVoiceTranscriptDraft] = useState("");
  const [translationSummaryDraft, setTranslationSummaryDraft] = useState("");
  const [templateDraft, setTemplateDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [quoteTarget, setQuoteTarget] = useState<ConversationReplyPreview | null>(null);
  const [sharedNotesDraft, setSharedNotesDraft] = useState("");
  const [attendanceDraft, setAttendanceDraft] = useState("");

  useEffect(() => { if (!user) return; return subscribeToConversations(user.uid, setConversations); }, [user]);
  useEffect(() => { void getPlatformPreferences().then((p) => { setAutoTranslate(p.autoTranslateDms); setDmLanguage(p.dmTranslationLanguage); }); }, []);
  useEffect(() => { if (!user || !starterUser || starterUser === user.uid) return; void createOrGetConversation(starterUser).then(setActiveConversationId); }, [starterUser, user]);
  useEffect(() => {
    if (!activeConversationId) return;
    void markConversationRead(activeConversationId);
    void setConversationPresence(activeConversationId, "online");
    const unsubscribe = subscribeToConversationMessages(activeConversationId, setMessages);
    return () => { unsubscribe(); void setConversationPresence(activeConversationId, "offline"); };
  }, [activeConversationId]);
  useEffect(() => { if (!activeConversationId && conversations.length) setActiveConversationId(conversations[0].id); }, [activeConversationId, conversations]);

  const visibleConversations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return conversations
      .filter((c) => showArchived ? c.archivedBy.includes(currentUserId) : !c.archivedBy.includes(currentUserId))
      .filter((c) => inboxFilter === "pinned" ? c.pinnedBy.includes(currentUserId) : inboxFilter === "vip" ? c.vipBy.includes(currentUserId) : inboxFilter === "requests" ? c.requestStatus === "request" : inboxFilter === "spam" ? c.requestStatus === "spam" : inboxFilter === "unread" ? c.unreadBy.includes(currentUserId) : c.requestStatus !== "spam")
      .filter((c) => `${badgeLabel(c)} ${c.lastMessage} ${c.roomTopic || ""} ${c.roomLocation || ""}`.toLowerCase().includes(q));
  }, [conversations, currentUserId, inboxFilter, searchTerm, showArchived]);

  const activeConversation = useMemo(() => conversations.find((c) => c.id === activeConversationId) ?? null, [activeConversationId, conversations]);
  const activeOtherUser = activeConversation?.participantProfiles.find((p) => p.uid !== currentUserId) ?? activeConversation?.participantProfiles[0] ?? null;
  useEffect(() => {
    setRoomLocationDraft(activeConversation?.roomLocation || "");
    setRoleAccessDraft(activeConversation?.roleAccess || "");
    setRoomDescriptionDraft(activeConversation?.roomDescription || "");
    setTopicTagsDraft((activeConversation?.roomTopicTags ?? []).join(", "));
    setPostingPermissionDraft(activeConversation?.postingPermission || "everyone");
    setSharedNotesDraft(activeConversation?.sharedNotes || "");
    setAttendanceDraft(activeConversation?.attendancePrompt || "");
  }, [activeConversation?.id, activeConversation?.roomLocation, activeConversation?.roleAccess, activeConversation?.roomDescription, activeConversation?.roomTopicTags, activeConversation?.postingPermission, activeConversation?.sharedNotes, activeConversation?.attendancePrompt]);

  const filteredMessages = useMemo(() => {
    const q = messageSearch.trim().toLowerCase();
    return messages.filter((m) => {
      if (q && !`${m.text} ${m.poll?.question || ""} ${m.reminder?.label || ""} ${m.calendarItem?.title || ""}`.toLowerCase().includes(q)) return false;
      if (messageSenderFilter !== "all" && m.senderId !== messageSenderFilter) return false;
      if (messageDateFilter) {
        const stamp = m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toISOString().slice(0, 10) : "";
        if (stamp !== messageDateFilter) return false;
      }
      if (fileTypeFilter !== "all") {
        if (fileTypeFilter === "image" && !m.attachmentType?.startsWith("image/")) return false;
        if (fileTypeFilter === "video" && !m.videoMessageUrl && !m.attachmentType?.startsWith("video/")) return false;
        if (fileTypeFilter === "audio" && !m.voiceNoteUrl && !m.attachmentType?.startsWith("audio/")) return false;
        if (fileTypeFilter === "doc" && m.attachmentType?.startsWith("image/")) return false;
      }
      return true;
    });
  }, [fileTypeFilter, messageDateFilter, messageSearch, messageSenderFilter, messages]);
  const mediaMessages = useMemo(() => messages.filter((m) => m.attachmentUrl || m.voiceNoteUrl || m.videoMessageUrl), [messages]);
  const taskMessages = useMemo(() => messages.filter((m) => m.taskList?.length), [messages]);
  const savedMessages = useMemo(() => messages.filter((m) => m.savedBy.includes(currentUserId)), [currentUserId, messages]);
  const starredMessages = useMemo(() => messages.filter((m) => m.starredBy.includes(currentUserId)), [currentUserId, messages]);
  const pinnedMessages = useMemo(() => messages.filter((m) => activeConversation?.pinnedMessageIds?.includes(m.id)), [activeConversation?.pinnedMessageIds, messages]);
  const analytics = useMemo(() => ({ total: messages.length, media: mediaMessages.length, tasks: taskMessages.length, saved: savedMessages.length, starred: starredMessages.length }), [mediaMessages.length, messages.length, savedMessages.length, starredMessages.length, taskMessages.length]);
  const activeMessages = panel === "media" ? mediaMessages : panel === "tasks" ? taskMessages : panel === "saved" ? savedMessages : panel === "starred" ? starredMessages : filteredMessages;
  const notificationLevel = activeConversation?.notificationLevelBy?.[currentUserId] ?? "all";
  const quietHours = activeConversation?.quietHoursBy?.[currentUserId] ?? "off";
  const blocked = activeConversation?.blockedBy.includes(currentUserId) ?? false;
  const roleMembers = activeConversation?.roleMembers;
  const isAdmin = roleMembers?.admins.includes(currentUserId) ?? false;
  const isModerator = roleMembers?.moderators.includes(currentUserId) ?? false;
  const canPost =
    !activeConversation
      ? false
      : activeConversation.postingPermission === "admins"
        ? isAdmin
        : activeConversation.postingPermission === "moderators"
          ? isAdmin || isModerator
          : !(activeConversation.announcementOnly || activeConversation.broadcastOnly) || isAdmin || isModerator;
  const filesVault = activeConversation?.filesVault ?? [];
  const officeHoursQueue = activeConversation?.officeHoursQueue ?? [];
  const reactionLeaders = useMemo(
    () =>
      Object.entries(
        messages.reduce<Record<string, number>>((acc, message) => {
          message.reactions.forEach((reaction) => {
            reaction.userIds.forEach((userId) => {
              acc[userId] = (acc[userId] ?? 0) + 1;
            });
          });
          return acc;
        }, {}),
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3),
    [messages],
  );

  if (!user) return null;

  const resetComposer = () => {
    setDraft(""); setAttachment(null); setPollQuestion(""); setPollOptions(["", ""]); setTaskDraft(["", ""]);
    setScheduledAt(""); setReplyTarget(null); setCalendarDraft({ title: "", date: "", location: "" });
    setReminderDraft({ label: "", kind: "general", dueAt: "" }); setComposerMode("text");
    setUrgentDraft(false); setVoiceTranscriptDraft(""); setTranslationSummaryDraft(""); setTemplateDraft(""); setLocationDraft(""); setQuoteTarget(null);
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeConversationId || blocked || !canPost) return;
    const scheduledFor = scheduledAt ? new Date(scheduledAt) : null;
    if (composerMode === "poll") {
      const poll = buildPoll(pollQuestion, pollOptions); if (!poll.question.trim() || poll.options.length < 2) return;
      await sendConversationMessage(activeConversationId, poll.question, null, { messageType: "poll", poll, scheduledFor, replyTo: replyTarget, threadRootId: replyTarget?.messageId ?? null });
    } else if (composerMode === "tasks") {
      const taskList = buildTasks(taskDraft); if (!taskList.length) return;
      await sendConversationMessage(activeConversationId, "Shared a task list", null, { messageType: "task-list", taskList, scheduledFor, replyTo: replyTarget, threadRootId: replyTarget?.messageId ?? null });
    } else if (composerMode === "calendar") {
      if (!calendarDraft.title.trim() || !calendarDraft.date.trim()) return;
      await sendConversationMessage(activeConversationId, calendarDraft.title, null, { messageType: "calendar", scheduledFor, replyTo: replyTarget, threadRootId: replyTarget?.messageId ?? null, calendarItem: { title: calendarDraft.title.trim(), date: calendarDraft.date, location: calendarDraft.location.trim() || null } });
    } else if (composerMode === "reminder") {
      if (!reminderDraft.label.trim() || !reminderDraft.dueAt.trim()) return;
      await sendConversationMessage(activeConversationId, reminderDraft.label, null, { messageType: "reminder", scheduledFor, replyTo: replyTarget, threadRootId: replyTarget?.messageId ?? null, reminder: { label: reminderDraft.label.trim(), kind: reminderDraft.kind, dueAt: reminderDraft.dueAt } });
    } else {
      await sendConversationMessage(activeConversationId, draft || templateDraft, attachment, {
        messageType: composerMode === "voice" ? "voice-note" : composerMode === "video" ? "video-message" : "text",
        scheduledFor,
        replyTo: replyTarget,
        quoteReplyTo: quoteTarget,
        threadRootId: replyTarget?.messageId ?? null,
        voiceTranscription: composerMode === "voice" ? voiceTranscriptDraft : "",
        aiTranslationSummary: translationSummaryDraft,
        urgent: urgentDraft,
        locationShare: locationDraft.trim() ? { label: locationDraft.trim() } : null,
      });
    }
    resetComposer();
    await setConversationTyping(activeConversationId, false);
    if (activeConversation?.autoReplyBy?.includes(currentUserId)) await sendConversationMessage(activeConversationId, "Auto reply: I saw this and will follow up soon.", null, { messageType: "system" });
  };

  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Messages & Community</h1>
              <p className="text-sm text-muted-foreground">Real-time chat for teams, recruiting, creators, moderation, reminders, and community rooms.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowArchived((v) => !v)}><Archive className="mr-2 h-4 w-4" />{showArchived ? "Inbox" : "Archived"}</Button>
              <Button variant="outline" size="sm" onClick={() => setInboxFilter("unread")}><Bell className="mr-2 h-4 w-4" />Unread</Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[320px,1fr]">
            <div className={`${activeConversation ? "hidden md:block" : ""} space-y-3`}>
              <div className="relative"><Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search people and rooms" className="h-11 w-full rounded-full border border-input bg-muted/50 pl-11 pr-4 text-sm" /></div>
              <div className="flex flex-wrap gap-2 text-xs">{(["all", "unread", "pinned", "vip", "requests", "spam"] as InboxFilter[]).map((name) => <button key={name} type="button" onClick={() => setInboxFilter(name)} className={`rounded-full px-3 py-1.5 ${inboxFilter === name ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{name}</button>)}</div>
              <div className="rounded-3xl border p-3">
                <p className="mb-2 text-sm font-semibold">Room presets</p>
                <div className="flex flex-wrap gap-2">{ROOM_PRESETS.map((preset) => <button key={preset.label} type="button" disabled={!activeConversation} onClick={() => activeConversation && void updateConversationMetadata(activeConversation.id, { conversationType: preset.type, roomLabel: preset.label, roomTopic: preset.topic, roleAccess: preset.roleAccess ?? null, announcementOnly: preset.announcementOnly ?? false, broadcastOnly: preset.broadcastOnly ?? false })} className="rounded-full bg-muted px-3 py-1.5 text-xs disabled:opacity-50">{preset.label}</button>)}</div>
              </div>
              <div className="rounded-3xl border p-3">
                <p className="mb-2 text-sm font-semibold">Smart suggestions</p>
                <div className="flex flex-wrap gap-2">{conversations.slice(0, 4).map((c) => <button key={c.id} type="button" onClick={() => setActiveConversationId(c.id)} className="rounded-full border px-3 py-1.5 text-xs"><Sparkles className="mr-1 inline h-3 w-3" />{c.roomTopic || badgeLabel(c)}</button>)}</div>
                <p className="mb-2 mt-4 text-sm font-semibold">Icebreakers</p>
                <div className="flex flex-wrap gap-2">{ICEBREAKERS.map((prompt) => <button key={prompt} type="button" onClick={() => { setComposerMode("text"); setDraft(prompt); }} className="rounded-full border px-3 py-1.5 text-xs">{prompt}</button>)}</div>
              </div>
              <div className="space-y-2">
                {visibleConversations.length === 0 ? <div className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">No conversations yet.</div> : visibleConversations.map((conversation) => {
                  const other = conversation.participantProfiles.find((p) => p.uid !== currentUserId) ?? conversation.participantProfiles[0];
                  return <button key={conversation.id} type="button" onClick={() => setActiveConversationId(conversation.id)} className={`w-full rounded-3xl border p-3 text-left ${activeConversationId === conversation.id ? "border-primary/20 bg-muted/80" : "border-transparent hover:bg-muted/60"}`}><div className="flex items-center gap-3"><img src={other?.photoURL || "https://placehold.co/64x64?text=M"} alt={other?.displayName || "Conversation"} className="h-12 w-12 rounded-full object-cover" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate font-semibold">{other?.displayName || badgeLabel(conversation)}</p><span className="text-xs text-muted-foreground">{conversation.updatedAt ? formatTimeAgo(conversation.updatedAt) : ""}</span></div><p className="truncate text-xs text-primary">{badgeLabel(conversation)}</p><p className="truncate text-sm text-muted-foreground">{conversation.typingBy.includes(other?.uid || "") ? "Typing..." : conversation.lastMessage || "Open chat"}</p><p className="mt-1 text-[11px] text-muted-foreground">{conversation.presenceBy?.[other?.uid || ""] === "online" ? "Online" : formatLastSeen(conversation.lastSeenBy?.[other?.uid || ""])}</p></div></div></button>;
                })}
              </div>
            </div>

            <div className={`${!activeConversation ? "hidden md:flex" : "flex"} min-h-[720px] flex-col overflow-hidden rounded-[32px] border bg-background shadow-sm`}>
              {activeConversation ? (
                <>
                  <div className="border-b p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveConversationId(null)}><ArrowLeft className="h-5 w-5" /></Button>
                        <img src={activeOtherUser?.photoURL || "https://placehold.co/64x64?text=C"} alt={activeOtherUser?.displayName || "Conversation"} className="h-10 w-10 rounded-full object-cover" />
                        <div>
                          <Link href={activeOtherUser ? `/profile/${activeOtherUser.uid}` : "#"} className="font-semibold hover:underline">{activeOtherUser?.displayName || badgeLabel(activeConversation)}</Link>
                          <p className="text-xs text-muted-foreground">{activeConversation.typingBy.includes(activeOtherUser?.uid || "") ? "Typing..." : activeConversation.presenceBy?.[activeOtherUser?.uid || ""] === "online" ? "Online now" : formatLastSeen(activeConversation.lastSeenBy?.[activeOtherUser?.uid || ""])}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border px-2 py-1 text-xs">{badgeLabel(activeConversation)}</span>
                        <span className="rounded-full border px-2 py-1 text-xs">Notify {notificationLevel}</span>
                        <span className="rounded-full border px-2 py-1 text-xs">Quiet {quietHours}</span>
                        <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["chat", "media", "tasks", "saved", "starred"] as Panel[]).map((name) => <button key={name} type="button" onClick={() => setPanel(name)} className={`rounded-full px-3 py-1.5 text-xs ${panel === name ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{name}</button>)}
                      <button type="button" onClick={() => void updateConversationState(activeConversation.id, "pinnedBy", !activeConversation.pinnedBy.includes(currentUserId))} className="rounded-full bg-muted px-3 py-1.5 text-xs">Pin chat</button>
                      <button type="button" onClick={() => void updateConversationState(activeConversation.id, "vipBy", !activeConversation.vipBy.includes(currentUserId))} className="rounded-full bg-muted px-3 py-1.5 text-xs">VIP</button>
                      <button type="button" onClick={() => void updateConversationState(activeConversation.id, "autoReplyBy", !activeConversation.autoReplyBy.includes(currentUserId))} className="rounded-full bg-muted px-3 py-1.5 text-xs">Auto reply</button>
                      <button type="button" onClick={() => void updateConversationState(activeConversation.id, "mutedBy", !activeConversation.mutedBy.includes(currentUserId))} className="rounded-full bg-muted px-3 py-1.5 text-xs">Mute</button>
                      <button type="button" onClick={() => void updateConversationState(activeConversation.id, "archivedBy", !activeConversation.archivedBy.includes(currentUserId))} className="rounded-full bg-muted px-3 py-1.5 text-xs">Archive</button>
                      <button type="button" onClick={() => void updateConversationState(activeConversation.id, "reportedBy", !activeConversation.reportedBy.includes(currentUserId))} className="rounded-full bg-muted px-3 py-1.5 text-xs">Report</button>
                      <button type="button" onClick={() => void updateConversationState(activeConversation.id, "blockedBy", !activeConversation.blockedBy.includes(currentUserId))} className="rounded-full bg-muted px-3 py-1.5 text-xs">Block</button>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-4">
                      <div className="rounded-2xl border p-3 text-sm"><BarChart3 className="mb-1 h-4 w-4" />{analytics.total} messages</div>
                      <div className="rounded-2xl border p-3 text-sm">{analytics.media} media</div>
                      <div className="rounded-2xl border p-3 text-sm">{analytics.saved} saved</div>
                      <div className="rounded-2xl border p-3 text-sm">{analytics.starred} starred</div>
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-4">
                      <div className="rounded-2xl border p-3 text-sm">Posting: {activeConversation.postingPermission || "everyone"}</div>
                      <div className="rounded-2xl border p-3 text-sm">Queue: {officeHoursQueue.length}</div>
                      <div className="rounded-2xl border p-3 text-sm">Vault: {filesVault.length} files</div>
                      <div className="rounded-2xl border p-3 text-sm">Slow mode: {activeConversation.slowModeSeconds || 0}s</div>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <input value={roomLocationDraft} onChange={(e) => setRoomLocationDraft(e.target.value)} placeholder="Room location" className="h-10 rounded-full border border-input bg-muted/40 px-4 text-sm" />
                      <input value={roleAccessDraft} onChange={(e) => setRoleAccessDraft(e.target.value)} placeholder="Role access" className="h-10 rounded-full border border-input bg-muted/40 px-4 text-sm" />
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <input value={roomDescriptionDraft} onChange={(e) => setRoomDescriptionDraft(e.target.value)} placeholder="Room description" className="h-10 rounded-full border border-input bg-muted/40 px-4 text-sm" />
                      <input value={topicTagsDraft} onChange={(e) => setTopicTagsDraft(e.target.value)} placeholder="Topic tags comma separated" className="h-10 rounded-full border border-input bg-muted/40 px-4 text-sm" />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <select value={postingPermissionDraft} onChange={(e) => setPostingPermissionDraft(e.target.value as "everyone" | "admins" | "moderators")} className="rounded-full border border-input px-3 py-1.5 text-xs">
                        <option value="everyone">Everyone posts</option>
                        <option value="moderators">Moderators post</option>
                        <option value="admins">Admins post</option>
                      </select>
                      <button type="button" onClick={() => void updateConversationMetadata(activeConversation.id, { roomLocation: roomLocationDraft.trim() || null, roleAccess: roleAccessDraft.trim() || null, roomDescription: roomDescriptionDraft.trim() || null, roomTopicTags: topicTagsDraft.split(",").map((item) => item.trim()).filter(Boolean), postingPermission: postingPermissionDraft })} className="rounded-full bg-muted px-3 py-1.5 text-xs">Save room details</button>
                      <button type="button" onClick={() => void updateConversationPreferences({ conversationId: activeConversation.id, notificationLevel: nextNotify(notificationLevel) })} className="rounded-full bg-muted px-3 py-1.5 text-xs">Cycle notifications</button>
                      <button type="button" onClick={() => void updateConversationPreferences({ conversationId: activeConversation.id, quietHours: QUIET_HOURS[(QUIET_HOURS.indexOf(quietHours) + 1) % QUIET_HOURS.length] })} className="rounded-full bg-muted px-3 py-1.5 text-xs">Cycle quiet hours</button>
                      <button type="button" onClick={() => setComposerMode("calendar")} className="rounded-full bg-muted px-3 py-1.5 text-xs">Calendar item</button>
                      <button type="button" onClick={() => setComposerMode("reminder")} className="rounded-full bg-muted px-3 py-1.5 text-xs">Reminder</button>
                      <button type="button" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/messages?room=${activeConversation.inviteLinkCode || activeConversation.id}`)} className="rounded-full bg-muted px-3 py-1.5 text-xs">Copy invite link</button>
                      <button type="button" onClick={() => void updateConversationMetadata(activeConversation.id, { recruiterVerified: !activeConversation.recruiterVerified, coachVerified: !activeConversation.coachVerified, calendarSyncEnabled: !activeConversation.calendarSyncEnabled, liveRoomRecording: !activeConversation.liveRoomRecording, amaApprovalRequired: !activeConversation.amaApprovalRequired })} className="rounded-full bg-muted px-3 py-1.5 text-xs">Toggle room flags</button>
                      <button type="button" onClick={() => void updateConversationMetadata(activeConversation.id, { slowModeSeconds: activeConversation.slowModeSeconds ? 0 : 30, antiSpamCooldownSeconds: activeConversation.antiSpamCooldownSeconds ? 0 : 10 })} className="rounded-full bg-muted px-3 py-1.5 text-xs">Slow mode</button>
                      {activeOtherUser ? <button type="button" onClick={() => void updateConversationMetadata(activeConversation.id, { bannedUserIds: activeConversation.bannedUserIds?.includes(activeOtherUser.uid) ? (activeConversation.bannedUserIds ?? []).filter((uid) => uid !== activeOtherUser.uid) : Array.from(new Set([...(activeConversation.bannedUserIds ?? []), activeOtherUser.uid])) })} className="rounded-full bg-muted px-3 py-1.5 text-xs">{activeConversation.bannedUserIds?.includes(activeOtherUser.uid) ? "Unban user" : "Ban user"}</button> : null}
                    </div>
                    <div className="mt-3"><input value={messageSearch} onChange={(e) => setMessageSearch(e.target.value)} placeholder="Search inside this conversation" className="h-10 w-full rounded-full border border-input bg-muted/40 px-4 text-sm" /></div>
                    <div className="mt-2 grid gap-2 md:grid-cols-3">
                      <select value={messageSenderFilter} onChange={(e) => setMessageSenderFilter(e.target.value)} className="h-10 rounded-full border border-input bg-muted/40 px-4 text-sm"><option value="all">All senders</option>{activeConversation.participantProfiles.map((person) => <option key={person.uid} value={person.uid}>{person.displayName}</option>)}</select>
                      <input value={messageDateFilter} onChange={(e) => setMessageDateFilter(e.target.value)} type="date" className="h-10 rounded-full border border-input bg-muted/40 px-4 text-sm" />
                      <select value={fileTypeFilter} onChange={(e) => setFileTypeFilter(e.target.value)} className="h-10 rounded-full border border-input bg-muted/40 px-4 text-sm"><option value="all">All file types</option><option value="image">Images</option><option value="video">Videos</option><option value="audio">Audio</option><option value="doc">Docs</option></select>
                    </div>
                  </div>

                  {pinnedMessages.length > 0 ? <div className="border-b bg-muted/30 p-4"><div className="mb-2 text-sm font-semibold">Pinned announcements</div><div className="space-y-2">{pinnedMessages.map((m) => <div key={m.id} className="rounded-2xl border bg-background px-3 py-2 text-sm">{m.text || m.calendarItem?.title || m.reminder?.label || "Pinned item"}</div>)}</div></div> : null}
                  {activeConversation.roomDescription || activeConversation.roomTopicTags?.length || activeConversation.trustSignals?.length ? <div className="border-b bg-muted/20 p-4 text-sm"><p className="font-semibold">{activeConversation.roomDescription || "Room details"}</p><div className="mt-2 flex flex-wrap gap-2">{(activeConversation.roomTopicTags ?? []).map((tag) => <span key={tag} className="rounded-full border px-2 py-1 text-xs">#{tag}</span>)}{activeConversation.recruiterVerified ? <span className="rounded-full border px-2 py-1 text-xs">Recruiter verified</span> : null}{activeConversation.coachVerified ? <span className="rounded-full border px-2 py-1 text-xs">Coach verified</span> : null}{activeConversation.calendarSyncEnabled ? <span className="rounded-full border px-2 py-1 text-xs">Calendar sync on</span> : null}{activeConversation.liveRoomRecording ? <span className="rounded-full border px-2 py-1 text-xs">Recording enabled</span> : null}{activeConversation.amaApprovalRequired ? <span className="rounded-full border px-2 py-1 text-xs">AMA approval required</span> : null}{(activeConversation.trustSignals ?? []).map((signal) => <span key={signal} className="rounded-full border px-2 py-1 text-xs">{signal}</span>)}</div></div> : null}
                  {filesVault.length > 0 ? <div className="border-b p-4"><div className="mb-2 text-sm font-semibold">Shared files vault</div><div className="grid gap-2 md:grid-cols-2">{filesVault.map((file) => <a key={`${file.url}-${file.label}`} href={file.url} target="_blank" rel="noreferrer" className="rounded-2xl border px-3 py-2 text-sm hover:bg-muted/30"><FileText className="mr-2 inline h-4 w-4" />{file.label} <span className="text-xs text-muted-foreground">({file.type})</span></a>)}</div></div> : null}
                  <div className="border-b p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <textarea value={sharedNotesDraft} onChange={(e) => setSharedNotesDraft(e.target.value)} placeholder="Shared notes pad" className="min-h-24 rounded-2xl border border-input bg-muted/20 px-4 py-3 text-sm" />
                      <textarea value={attendanceDraft} onChange={(e) => setAttendanceDraft(e.target.value)} placeholder="Attendance check or office-hours queue note" className="min-h-24 rounded-2xl border border-input bg-muted/20 px-4 py-3 text-sm" />
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border p-3 text-sm">
                        <p className="font-semibold">Office-hours queue</p>
                        <div className="mt-2 space-y-1 text-muted-foreground">{officeHoursQueue.length ? officeHoursQueue.map((entry) => <p key={entry}>{entry}</p>) : <p>No one queued yet.</p>}</div>
                      </div>
                      <div className="rounded-2xl border p-3 text-sm">
                        <p className="font-semibold">Reaction leaderboard</p>
                        <div className="mt-2 space-y-1 text-muted-foreground">{reactionLeaders.length ? reactionLeaders.map(([userId, total]) => <p key={userId}>{userId} · {total} reactions</p>) : <p>No reactions yet.</p>}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" onClick={() => void updateConversationMetadata(activeConversation.id, { sharedNotes: sharedNotesDraft.trim() || null, attendancePrompt: attendanceDraft.trim() || null })} className="rounded-full bg-muted px-3 py-1.5 text-xs">Save notes</button>
                      <button type="button" onClick={() => void updateConversationMetadata(activeConversation.id, { officeHoursQueue: Array.from(new Set([...(activeConversation.officeHoursQueue ?? []), user.displayName || user.uid])) })} className="rounded-full bg-muted px-3 py-1.5 text-xs"><Hand className="mr-1 inline h-3 w-3" />Join office-hours queue</button>
                      <button type="button" onClick={() => void updateConversationMetadata(activeConversation.id, { trustSignals: Array.from(new Set([...(activeConversation.trustSignals ?? []), "community-reviewed"])) })} className="rounded-full bg-muted px-3 py-1.5 text-xs">Add trust signal</button>
                      <button type="button" onClick={() => { const printable = window.open("", "_blank"); if (!printable) return; printable.document.write(`<pre>${messages.map((m) => `${m.senderId}: ${m.text || m.calendarItem?.title || ""}`).join("\n\n")}</pre>`); printable.document.close(); printable.print(); }} className="rounded-full bg-muted px-3 py-1.5 text-xs">Export PDF</button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {activeMessages.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No messages for this view yet.</div> : activeMessages.map((message) => {
                      const own = message.senderId === currentUserId;
                      return <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}><div className="max-w-[88%] space-y-2">
                        {message.replyTo ? <div className="rounded-2xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">Replying to: {message.replyTo.text}</div> : null}
                        {message.quoteReplyTo ? <div className="rounded-2xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">Quote reply: {message.quoteReplyTo.text}</div> : null}
                        {message.forwardedFrom ? <div className="rounded-2xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">Forwarded by {message.forwardedFrom.senderName}</div> : null}
                        {message.voiceNoteUrl ? <audio controls className="w-full"><source src={message.voiceNoteUrl} /></audio> : null}
                        {message.videoMessageUrl ? <video controls className="max-h-64 w-full rounded-3xl bg-black"><source src={message.videoMessageUrl} /></video> : null}
                        {message.attachmentUrl && !message.voiceNoteUrl && !message.videoMessageUrl ? (message.attachmentType?.startsWith("image/") ? <img src={message.attachmentUrl} alt="Attachment" className="max-h-64 rounded-3xl object-cover" /> : <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm underline"><FileText className="h-4 w-4" />Open file or document</a>) : null}
                        <div className={`rounded-[24px] px-4 py-3 text-sm ${own ? "bg-primary text-primary-foreground" : "border bg-white"}`}>
                          {editingMessageId === message.id ? <div className="space-y-2"><input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="h-9 w-full rounded-full border border-input bg-background px-3 text-sm text-foreground" /><div className="flex gap-2"><Button size="sm" type="button" onClick={() => void updateConversationMessage(message.id, editingText).then(() => setEditingMessageId(null))}>Save</Button><Button size="sm" variant="outline" type="button" onClick={() => setEditingMessageId(null)}>Cancel</Button></div></div> : <>
                            {message.messageType === "poll" && message.poll ? <div className="space-y-2"><div className="text-xs font-semibold uppercase"><Vote className="mr-1 inline h-3 w-3" />Poll</div><p className="font-medium">{message.poll.question}</p>{message.poll.options.map((option) => <button key={option.id} type="button" onClick={() => void voteConversationPoll(message.id, option.id)} className="flex w-full justify-between rounded-2xl bg-background/10 px-3 py-2 text-left"><span>{option.label}</span><span className="text-xs">{option.votes.length} votes</span></button>)}</div> : null}
                            {message.taskList?.length ? <div className="space-y-2"><div className="text-xs font-semibold uppercase"><ShieldAlert className="mr-1 inline h-3 w-3" />Tasks</div>{message.taskList.map((task) => <button key={task.id} type="button" onClick={() => void toggleConversationTaskItem(message.id, task.id)} className="flex w-full justify-between rounded-2xl bg-background/10 px-3 py-2 text-left"><span className={task.completedBy.includes(currentUserId) ? "line-through" : ""}>{task.text}</span><span className="text-xs">{task.completedBy.length}</span></button>)}</div> : null}
                            {message.calendarItem ? <div className="mb-2 rounded-2xl bg-background/10 px-3 py-2 text-xs"><CalendarDays className="mr-1 inline h-3 w-3" />{message.calendarItem.title} | {message.calendarItem.date}{message.calendarItem.location ? ` | ${message.calendarItem.location}` : ""}</div> : null}
                            {message.reminder ? <div className="mb-2 rounded-2xl bg-background/10 px-3 py-2 text-xs"><Clock3 className="mr-1 inline h-3 w-3" />{message.reminder.label} | {message.reminder.kind} | {message.reminder.dueAt}</div> : null}
                            {message.linkPreview ? <a href={message.linkPreview.url} target="_blank" rel="noreferrer" className="mb-2 block rounded-2xl bg-background/10 px-3 py-2 text-xs no-underline">Link preview: {message.linkPreview.domain}</a> : null}
                            {message.urgent ? <p className="mb-2 text-[11px] font-semibold uppercase">Urgent</p> : null}
                            {message.text && message.messageType !== "poll" ? <p>{message.text}</p> : null}
                            {message.voiceTranscription ? <p className="mt-2 text-xs opacity-80">Transcript: {message.voiceTranscription}</p> : null}
                            {message.aiTranslationSummary ? <p className="mt-2 text-xs opacity-80">AI summary: {message.aiTranslationSummary}</p> : null}
                            {message.locationShare ? <p className="mt-2 text-xs opacity-80"><MapPin className="mr-1 inline h-3 w-3" />{message.locationShare.label}</p> : null}
                            {message.mentions.length ? <p className="mt-2 text-xs opacity-80">Mentions: {message.mentions.join(", ")}</p> : null}
                            {message.hashtags.length ? <p className="mt-2 text-xs opacity-80">Tags: {message.hashtags.join(", ")}</p> : null}
                            {message.threadRootId ? <p className="mt-2 text-xs opacity-80">Feedback thread</p> : null}
                            {autoTranslate && !own && message.text ? <p className="mt-2 text-xs text-muted-foreground">{translateMessagePreview(message.text, dmLanguage)}</p> : null}
                          </>}
                        </div>
                        {message.reactions.length ? <div className="flex flex-wrap gap-2">{message.reactions.map((reaction) => <button key={`${message.id}-${reaction.emoji}`} type="button" onClick={() => void reactToConversationMessage(message.id, reaction.emoji)} className="rounded-full border px-2 py-1 text-xs">{reaction.emoji} {reaction.userIds.length}</button>)}</div> : null}
                        <div className="text-xs text-muted-foreground">{message.createdAt ? formatTimeAgo(message.createdAt) : ""}{own ? ` | Read by ${Math.max(message.readBy.length - 1, 0)}` : message.readBy.includes(currentUserId) ? " | Seen" : ""}</div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><button type="button" onClick={() => setReplyTarget({ messageId: message.id, senderId: message.senderId, text: message.text || message.calendarItem?.title || message.reminder?.label || "Message" })}><MessageCircleReply className="mr-1 inline h-3 w-3" />Reply</button><button type="button" onClick={() => setQuoteTarget({ messageId: message.id, senderId: message.senderId, text: message.text || message.calendarItem?.title || message.reminder?.label || "Message" })}><MessageCircleReply className="mr-1 inline h-3 w-3" />Quote</button><button type="button" onClick={() => void forwardConversationMessage(activeConversation.id, message, "Forwarded message")}><Forward className="mr-1 inline h-3 w-3" />Forward</button><button type="button" onClick={() => void toggleConversationMessageFlag(message.id, "starredBy")}><Star className="mr-1 inline h-3 w-3" />Star</button><button type="button" onClick={() => void toggleConversationMessageFlag(message.id, "savedBy")}><Bookmark className="mr-1 inline h-3 w-3" />Save</button><button type="button" onClick={() => void toggleConversationPinnedMessage(activeConversation.id, message.id)}><Pin className="mr-1 inline h-3 w-3" />Pin</button>{QUICK_REACTIONS.map((emoji) => <button key={`${message.id}-${emoji}`} type="button" onClick={() => void reactToConversationMessage(message.id, emoji)}>{emoji}</button>)}{own && !message.deleted ? <><button type="button" onClick={() => { setEditingMessageId(message.id); setEditingText(message.text); }}><Pencil className="mr-1 inline h-3 w-3" />Edit</button><button type="button" onClick={() => void deleteConversationMessage(message.id)}><Trash2 className="mr-1 inline h-3 w-3" />Delete</button></> : null}</div>
                      </div></div>;
                    })}
                  </div>

                  <form className="border-t p-4" onSubmit={handleSend}>
                    {replyTarget ? <div className="mb-3 flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm"><span className="truncate">Replying to: {replyTarget.text}</span><button type="button" className="text-xs text-muted-foreground" onClick={() => setReplyTarget(null)}>Clear</button></div> : null}
                    {quoteTarget ? <div className="mb-3 flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm"><span className="truncate">Quote reply: {quoteTarget.text}</span><button type="button" className="text-xs text-muted-foreground" onClick={() => setQuoteTarget(null)}>Clear</button></div> : null}
                    {attachment ? <div className="mb-3 flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm"><span className="truncate">Ready to send: {attachment.name}</span><button type="button" className="text-xs text-muted-foreground" onClick={() => setAttachment(null)}>Remove</button></div> : null}
                    {blocked ? <div className="mb-3 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">This conversation is blocked. Unblock it to send more messages.</div> : null}
                    {!blocked && !canPost ? <div className="mb-3 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Posting is limited in this room right now. Only approved roles can send updates.</div> : null}
                    {activeConversation?.antiSpamCooldownSeconds ? <div className="mb-3 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">Anti-spam cooldown is on: {activeConversation.antiSpamCooldownSeconds}s between fast follow-ups.</div> : null}
                    {activeConversation?.attendancePrompt ? <div className="mb-3 rounded-2xl bg-muted px-4 py-3 text-sm">{activeConversation.attendancePrompt}</div> : null}
                    <div className="mb-3 flex flex-wrap gap-2 text-xs">{([["text","Text"],["poll","Poll"],["tasks","Tasks"],["voice","Voice"],["video","Video"],["calendar","Calendar"],["reminder","Reminder"]] as Array<[ComposerMode, string]>).map(([mode,label]) => <button key={mode} type="button" onClick={() => setComposerMode(mode)} className={`rounded-full px-3 py-1.5 ${composerMode === mode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{label}</button>)}<button type="button" onClick={() => setTemplateDraft("Quick follow-up: checking in on this thread.")} className="rounded-full bg-muted px-3 py-1.5">Template</button><button type="button" onClick={() => setUrgentDraft((v) => !v)} className={`rounded-full px-3 py-1.5 ${urgentDraft ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Urgent</button><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-full border border-input px-3 py-1.5 text-xs" /></div>
                    {composerMode === "poll" ? <div className="mb-3 space-y-2 rounded-3xl border bg-muted/30 p-3"><input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Poll question" className="h-10 w-full rounded-full border border-input bg-background px-4 text-sm" />{pollOptions.map((option, index) => <input key={`poll-${index}`} value={option} onChange={(e) => setPollOptions((current) => current.map((entry, entryIndex) => entryIndex === index ? e.target.value : entry))} placeholder={`Option ${index + 1}`} className="h-10 w-full rounded-full border border-input bg-background px-4 text-sm" />)}<button type="button" onClick={() => setPollOptions((current) => [...current, ""])} className="text-xs text-primary">Add poll option</button></div> : null}
                    {composerMode === "tasks" ? <div className="mb-3 space-y-2 rounded-3xl border bg-muted/30 p-3">{taskDraft.map((task, index) => <input key={`task-${index}`} value={task} onChange={(e) => setTaskDraft((current) => current.map((entry, entryIndex) => entryIndex === index ? e.target.value : entry))} placeholder={`Task ${index + 1}`} className="h-10 w-full rounded-full border border-input bg-background px-4 text-sm" />)}<button type="button" onClick={() => setTaskDraft((current) => [...current, ""])} className="text-xs text-primary">Add task</button></div> : null}
                    {composerMode === "calendar" ? <div className="mb-3 grid gap-2 rounded-3xl border bg-muted/30 p-3 md:grid-cols-2"><input value={calendarDraft.title} onChange={(e) => setCalendarDraft((current) => ({ ...current, title: e.target.value }))} placeholder="Calendar title" className="h-10 rounded-full border border-input bg-background px-4 text-sm" /><input value={calendarDraft.date} onChange={(e) => setCalendarDraft((current) => ({ ...current, date: e.target.value }))} type="datetime-local" className="h-10 rounded-full border border-input bg-background px-4 text-sm" /><input value={calendarDraft.location} onChange={(e) => setCalendarDraft((current) => ({ ...current, location: e.target.value }))} placeholder="Location" className="h-10 rounded-full border border-input bg-background px-4 text-sm md:col-span-2" /></div> : null}
                    {composerMode === "reminder" ? <div className="mb-3 grid gap-2 rounded-3xl border bg-muted/30 p-3 md:grid-cols-2"><input value={reminderDraft.label} onChange={(e) => setReminderDraft((current) => ({ ...current, label: e.target.value }))} placeholder="Reminder label" className="h-10 rounded-full border border-input bg-background px-4 text-sm" /><select value={reminderDraft.kind} onChange={(e) => setReminderDraft((current) => ({ ...current, kind: e.target.value as ReminderKind }))} className="h-10 rounded-full border border-input bg-background px-4 text-sm"><option value="general">General</option><option value="practice">Practice</option><option value="recruiting">Recruiting</option><option value="follow-up">Follow-up</option><option value="coach-feedback">Coach feedback</option></select><input value={reminderDraft.dueAt} onChange={(e) => setReminderDraft((current) => ({ ...current, dueAt: e.target.value }))} type="datetime-local" className="h-10 rounded-full border border-input bg-background px-4 text-sm md:col-span-2" /></div> : null}
                    {composerMode === "voice" ? <div className="mb-3 space-y-2 rounded-3xl border bg-muted/30 p-3"><input value={voiceTranscriptDraft} onChange={(e) => setVoiceTranscriptDraft(e.target.value)} placeholder="Voice transcription" className="h-10 w-full rounded-full border border-input bg-background px-4 text-sm" /><input value={translationSummaryDraft} onChange={(e) => setTranslationSummaryDraft(e.target.value)} placeholder="AI translation summary" className="h-10 w-full rounded-full border border-input bg-background px-4 text-sm" /></div> : null}
                    <div className="mb-3 grid gap-2 md:grid-cols-2">
                      <input value={templateDraft} onChange={(e) => setTemplateDraft(e.target.value)} placeholder="Message template" className="h-10 rounded-full border border-input bg-muted/30 px-4 text-sm" />
                      <input value={locationDraft} onChange={(e) => setLocationDraft(e.target.value)} placeholder="Location share label" className="h-10 rounded-full border border-input bg-muted/30 px-4 text-sm" />
                    </div>
                    <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-2">
                      <label className="flex cursor-pointer items-center justify-center text-muted-foreground">{composerMode === "voice" ? <Mic className="h-5 w-5" /> : composerMode === "video" ? <Video className="h-5 w-5" /> : composerMode === "calendar" ? <CalendarDays className="h-5 w-5" /> : composerMode === "reminder" ? <Clock3 className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}<input type="file" accept={composerMode === "voice" ? "audio/*" : composerMode === "video" ? "video/*" : "image/*,video/*,.pdf,.doc,.docx,audio/*"} className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => setAttachment(event.target.files?.[0] ?? null)} /></label>
                      <input value={draft} onChange={async (e) => { setDraft(e.target.value); if (activeConversationId) await setConversationTyping(activeConversationId, Boolean(e.target.value.trim())); }} placeholder="Message with @mentions and #tags..." className="h-10 w-full bg-transparent px-1 text-sm outline-none" />
                      <Button type="submit" size="icon" className="rounded-full" disabled={blocked || !canPost || (composerMode === "poll" ? !pollQuestion.trim() : composerMode === "tasks" ? taskDraft.every((task) => !task.trim()) : composerMode === "calendar" ? !calendarDraft.title.trim() || !calendarDraft.date.trim() : composerMode === "reminder" ? !reminderDraft.label.trim() || !reminderDraft.dueAt.trim() : !draft.trim() && !attachment)}><SendHorizontal className="h-4 w-4" /></Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center px-6 text-center"><div><h2 className="text-xl font-semibold">Your community inbox</h2><p className="mt-2 text-sm text-muted-foreground">Open a chat to send direct messages, polls, reminders, calendar items, files, and community updates.</p></div></div>
              )}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default function MessagesPage() { return <MessagesPageContent />; }
