"use client";

import { ChangeEvent, FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarPlus, ImagePlus, Pencil, Search, SendHorizontal, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  createOrGetConversation,
  deleteConversationMessage,
  markConversationRead,
  reactToConversationMessage,
  sendConversationMessage,
  setConversationPresence,
  setConversationTyping,
  subscribeToConversationMessages,
  subscribeToConversations,
  updateConversationMessage,
  type ConversationMessage,
  type ConversationReplyPreview,
  type ConversationSummary,
} from "@/lib/messaging";
import { formatTimeAgo } from "@/lib/posts";

const REACTIONS = ["??", "??", "??"];

function MessagesPageContent() {
  const { user } = useAuthContext();
  const currentUserId = user?.uid ?? "";
  const starterUser = useSearchParams().get("user");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [replyTo, setReplyTo] = useState<ConversationReplyPreview | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showTrainingInvite, setShowTrainingInvite] = useState(false);
  const [trainingDate, setTrainingDate] = useState("");
  const [trainingTime, setTrainingTime] = useState("");
  const [trainingLocation, setTrainingLocation] = useState("");
  const [trainingNotes, setTrainingNotes] = useState("");

  useEffect(() => {
    if (!user) return;
    return subscribeToConversations(user.uid, setConversations);
  }, [user]);

  useEffect(() => {
    if (!user || !starterUser || starterUser === user.uid) return;
    void createOrGetConversation(starterUser).then(setActiveId);
  }, [starterUser, user]);

  useEffect(() => {
    if (!activeId) return;
    void markConversationRead(activeId);
    void setConversationPresence(activeId, "online");
    const unsubscribe = subscribeToConversationMessages(activeId, setMessages);
    return () => {
      unsubscribe();
      void setConversationPresence(activeId, "offline");
    };
  }, [activeId]);

  useEffect(() => {
    if (!activeId && conversations.length) setActiveId(conversations[0].id);
  }, [activeId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activeId]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [activeId, conversations]
  );
  const otherUser = activeConversation?.participantProfiles.find((profile) => profile.uid !== currentUserId) ?? activeConversation?.participantProfiles[0] ?? null;
  const blocked = activeConversation?.blockedBy.includes(currentUserId) ?? false;

  const visibleConversations = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    return conversations
      .filter((conversation) => !conversation.archivedBy.includes(currentUserId))
      .filter((conversation) => conversation.requestStatus !== "spam")
      .filter((conversation) => {
        const other = conversation.participantProfiles.find((profile) => profile.uid !== currentUserId) ?? conversation.participantProfiles[0];
        return !queryText || other?.displayName?.toLowerCase().includes(queryText) || conversation.lastMessage?.toLowerCase().includes(queryText);
      });
  }, [conversations, currentUserId, search]);

  if (!user) return null;

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!activeId || blocked || (!draft.trim() && !attachment)) return;

    const nextDraft = draft;
    const nextAttachment = attachment;
    const nextReply = replyTo;
    setDraft("");
    setAttachment(null);
    setReplyTo(null);
    setImagePreview(null);
    await setConversationTyping(activeId, false);

    try {
      await sendConversationMessage(activeId, nextDraft, nextAttachment, { replyTo: nextReply });
    } catch (error) {
      setDraft(nextDraft);
      setAttachment(nextAttachment);
      setReplyTo(nextReply);
      throw error;
    }
  };

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAttachment(file);
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSendTrainingInvite = async () => {
    if (!activeId || !trainingDate || !trainingTime) return;

    const trainingMessage = `🏀 Training Session Invite\n\n📅 Date: ${trainingDate}\n⏰ Time: ${trainingTime}\n📍 Location: ${trainingLocation || "TBD"}\n📝 Notes: ${trainingNotes || "No additional notes"}\n\nClick to accept or decline this invite.`;

    setDraft("");
    setAttachment(null);
    setReplyTo(null);
    setImagePreview(null);
    setShowTrainingInvite(false);
    setTrainingDate("");
    setTrainingTime("");
    setTrainingLocation("");
    setTrainingNotes("");
    await setConversationTyping(activeId, false);

    try {
      await sendConversationMessage(activeId, trainingMessage, null, {
        messageType: "calendar",
        calendarItem: {
          title: "Training Session",
          date: `${trainingDate} at ${trainingTime}`,
          location: trainingLocation || "TBD",
        },
      });
    } catch (error) {
      console.error("Failed to send training invite:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-none border bg-background shadow-sm md:rounded-xl">
        <div className={`${activeConversation ? "hidden md:flex" : "flex"} w-full flex-col border-r md:w-96`}>
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h1 className="text-2xl font-bold leading-tight">Messages</h1>
              <p className="text-sm text-muted-foreground">Direct messages with your HoopLink network</p>
            </div>
            <Button size="sm" asChild>
              <Link href="/search">New DM</Link>
            </Button>
          </div>

          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search messages"
                className="h-12 w-full rounded-full border bg-muted/50 pl-11 pr-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {visibleConversations.length === 0 ? (
              <div className="p-8 text-center text-base text-muted-foreground">
                No conversations yet. <Link href="/search" className="font-semibold text-primary underline">Find people</Link>
              </div>
            ) : visibleConversations.map((conversation) => {
              const other = conversation.participantProfiles.find((profile) => profile.uid !== currentUserId) ?? conversation.participantProfiles[0];
              const unread = conversation.unreadBy.includes(currentUserId);
              const typing = conversation.typingBy.includes(other?.uid || "");
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveId(conversation.id)}
                  className={`flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-muted/60 ${activeId === conversation.id ? "bg-muted/80" : ""}`}
                >
                  <img src={other?.photoURL || "https://placehold.co/56x56?text=U"} alt={other?.displayName} className="h-14 w-14 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-base font-semibold">{other?.displayName}</p>
                      <span className="shrink-0 text-sm text-muted-foreground">{conversation.updatedAt ? formatTimeAgo(conversation.updatedAt) : ""}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className={`truncate text-base ${typing ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                        {typing ? "Typing..." : conversation.lastMessage || "Open chat"}
                      </p>
                      {unread ? <span className="h-3 w-3 shrink-0 rounded-full bg-primary" /> : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`${!activeConversation ? "hidden md:flex" : "flex"} min-w-0 flex-1 flex-col`}>
          {activeConversation ? (
            <>
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveId(null)} aria-label="Back to conversations">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <img src={otherUser?.photoURL || "https://placehold.co/48x48?text=U"} alt={otherUser?.displayName} className="h-12 w-12 rounded-full object-cover" />
                <div className="min-w-0">
                  <Link href={otherUser ? `/profile/${otherUser.uid}` : "#"} className="block truncate text-lg font-semibold hover:underline">
                    {otherUser?.displayName}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {activeConversation.typingBy.includes(otherUser?.uid || "") ? "Typing..." : activeConversation.presenceBy?.[otherUser?.uid || ""] === "online" ? "Online" : "Direct message"}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto bg-muted/20 p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-base text-muted-foreground">
                    <div>
                      <p className="text-lg font-semibold text-foreground">Start the conversation</p>
                      <p className="mt-1">Send a message directly.</p>
                    </div>
                  </div>
                ) : messages.map((message) => {
                  const own = message.senderId === currentUserId;
                  return (
                    <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[82%] space-y-2 sm:max-w-[70%] ${own ? "items-end" : "items-start"}`}>
                        {message.replyTo ? (
                          <div className="rounded-xl border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                            Replying to: {message.replyTo.text}
                          </div>
                        ) : null}
                        {message.attachmentUrl && message.attachmentType?.startsWith("image/") ? (
                          <img src={message.attachmentUrl} alt="Attachment" className="max-h-72 rounded-2xl object-cover cursor-pointer" onClick={() => message.attachmentUrl && window.open(message.attachmentUrl, "_blank")} />
                        ) : message.attachmentUrl ? (
                          <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border bg-background/80 px-3 py-2 text-sm hover:underline">
                            <ImagePlus className="h-4 w-4" />
                            <span>View attachment</span>
                          </a>
                        ) : null}
                        {editingId === message.id ? (
                          <div className="flex gap-2 rounded-2xl border bg-background p-2">
                            <input value={editingText} onChange={(event) => setEditingText(event.target.value)} className="h-10 flex-1 rounded-full border px-3 text-base outline-none" />
                            <Button size="sm" onClick={() => void updateConversationMessage(message.id, editingText).then(() => setEditingId(null))}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <div className={`rounded-2xl px-4 py-3 text-base leading-relaxed shadow-sm ${own ? "bg-primary text-primary-foreground" : "border bg-background"}`}>
                            {message.deleted ? <span className="italic opacity-70">Message deleted</span> : message.text}
                          </div>
                        )}
                        {message.reactions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {message.reactions.map((reaction) => (
                              <button key={reaction.emoji} type="button" onClick={() => void reactToConversationMessage(message.id, reaction.emoji)} className="rounded-full border bg-background px-2 py-1 text-sm shadow-sm">
                                {reaction.emoji} {reaction.userIds.length}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        <div className={`flex flex-wrap items-center gap-2 text-xs text-muted-foreground ${own ? "justify-end" : "justify-start"}`}>
                          <span>{message.createdAt ? formatTimeAgo(message.createdAt) : "Sending..."}</span>
                          {own && !message.deleted ? (
                            <span className="flex items-center gap-1">
                              {message.readBy.length > 1 ? (
                                <>
                                  <svg className="h-3 w-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  <span>Seen</span>
                                </>
                              ) : (
                                <>
                                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  <span>Sent</span>
                                </>
                              )}
                            </span>
                          ) : null}
                          {!message.deleted ? (
                            <button type="button" onClick={() => setReplyTo({ messageId: message.id, senderId: message.senderId, text: message.text || "Message" })} className="font-medium hover:text-foreground">
                              Reply
                            </button>
                          ) : null}
                          {!message.deleted ? (
                            <div className="flex gap-1">
                              {REACTIONS.map((emoji) => (
                                <button key={emoji} type="button" onClick={() => void reactToConversationMessage(message.id, emoji)} className="rounded-full bg-background/50 px-1.5 py-0.5 hover:bg-background">
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          ) : null}
                          {own && !message.deleted ? (
                            <div className="flex gap-1">
                              <button type="button" onClick={() => { setEditingId(message.id); setEditingText(message.text); }} className="rounded-full p-1 hover:bg-background/50" aria-label="Edit message"><Pencil className="h-3 w-3" /></button>
                              <button type="button" onClick={() => void deleteConversationMessage(message.id)} className="rounded-full p-1 hover:bg-background/50 text-destructive" aria-label="Delete message"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="border-t bg-background p-3">
                {replyTo ? (
                  <div className="mb-2 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
                    <span className="truncate">Replying to: {replyTo.text}</span>
                    <button type="button" onClick={() => setReplyTo(null)} className="ml-2 text-muted-foreground" aria-label="Cancel reply"><X className="h-4 w-4" /></button>
                  </div>
                ) : null}
                {attachment ? (
                  <div className="mb-2 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
                    <span className="truncate">{attachment.name}</span>
                    <button type="button" onClick={() => setAttachment(null)} className="ml-2 text-muted-foreground" aria-label="Remove attachment"><X className="h-4 w-4" /></button>
                  </div>
                ) : null}
                {imagePreview ? (
                  <div className="mb-2 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="max-h-32 rounded-xl object-cover" />
                    <button type="button" onClick={() => { setAttachment(null); setImagePreview(null); }} className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground" aria-label="Remove image"><X className="h-4 w-4" /></button>
                  </div>
                ) : null}
                {blocked ? <p className="mb-2 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900">This conversation is blocked.</p> : null}
                {showTrainingInvite ? (
                  <div className="mb-2 rounded-xl border bg-background p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">🏀 Training Session Invite</h3>
                      <button type="button" onClick={() => setShowTrainingInvite(false)} className="text-muted-foreground hover:text-foreground" aria-label="Cancel"><X className="h-4 w-4" /></button>
                    </div>
                    <input
                      type="date"
                      value={trainingDate}
                      onChange={(e) => setTrainingDate(e.target.value)}
                      className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    />
                    <input
                      type="time"
                      value={trainingTime}
                      onChange={(e) => setTrainingTime(e.target.value)}
                      className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    />
                    <input
                      type="text"
                      value={trainingLocation}
                      onChange={(e) => setTrainingLocation(e.target.value)}
                      placeholder="Location (optional)"
                      className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <textarea
                      value={trainingNotes}
                      onChange={(e) => setTrainingNotes(e.target.value)}
                      placeholder="Additional notes (optional)"
                      rows={2}
                      className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <Button type="button" size="sm" onClick={handleSendTrainingInvite} disabled={!trainingDate || !trainingTime} className="w-full">
                      Send Training Invite
                    </Button>
                  </div>
                ) : null}
                <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-2 shadow-sm">
                  <button type="button" onClick={() => setShowTrainingInvite(true)} className="text-muted-foreground hover:text-foreground" aria-label="Send training invite">
                    <CalendarPlus className="h-6 w-6" />
                  </button>
                  <label className="cursor-pointer text-muted-foreground" aria-label="Attach media">
                    <ImagePlus className="h-6 w-6" />
                    <input type="file" accept="image/*,video/*,.pdf" className="hidden" onChange={handleAttachmentChange} />
                  </label>
                  <input
                    value={draft}
                    onChange={async (event) => {
                      setDraft(event.target.value);
                      if (activeId) await setConversationTyping(activeId, Boolean(event.target.value.trim()));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Message..."
                    className="h-11 flex-1 bg-transparent text-base outline-none"
                  />
                  <Button type="submit" size="icon" className="rounded-full" disabled={blocked || (!draft.trim() && !attachment)} aria-label="Send message">
                    <SendHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center">
              <div>
                <p className="text-2xl font-semibold">Select a conversation</p>
                <p className="mt-2 text-base text-muted-foreground">Or <Link href="/search" className="font-semibold text-primary underline">search for someone</Link> to message directly.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function MessagesPage() {
  return <Suspense fallback={null}><MessagesPageContent /></Suspense>;
}