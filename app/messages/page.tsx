"use client";

import { ChangeEvent, FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImagePlus, Search, SendHorizontal, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  createOrGetConversation, deleteConversationMessage, markConversationRead,
  reactToConversationMessage, sendConversationMessage, setConversationPresence,
  setConversationTyping, subscribeToConversationMessages, subscribeToConversations,
  updateConversationMessage, type ConversationMessage, type ConversationReplyPreview,
  type ConversationSummary,
} from "@/lib/messaging";
import { formatTimeAgo } from "@/lib/posts";

const REACTIONS = ["🔥", "👏", "💯"];

function MessagesPageContent() {
  const { user } = useAuthContext();
  const currentUserId = user?.uid ?? "";
  const starterUser = useSearchParams().get("user");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [replyTo, setReplyTo] = useState<ConversationReplyPreview | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => { if (!user) return; return subscribeToConversations(user.uid, setConversations); }, [user]);
  useEffect(() => { if (!user || !starterUser || starterUser === user.uid) return; void createOrGetConversation(starterUser).then(setActiveId); }, [starterUser, user]);
  useEffect(() => {
    if (!activeId) return;
    void markConversationRead(activeId);
    void setConversationPresence(activeId, "online");
    const unsub = subscribeToConversationMessages(activeId, setMessages);
    return () => { unsub(); void setConversationPresence(activeId, "offline"); };
  }, [activeId]);
  useEffect(() => { if (!activeId && conversations.length) setActiveId(conversations[0].id); }, [activeId, conversations]);

  const activeConversation = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [activeId, conversations]);
  const otherUser = activeConversation?.participantProfiles.find((p) => p.uid !== currentUserId) ?? activeConversation?.participantProfiles[0] ?? null;
  const blocked = activeConversation?.blockedBy.includes(currentUserId) ?? false;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations
      .filter((c) => !c.archivedBy.includes(currentUserId))
      .filter((c) => c.requestStatus !== "spam")
      .filter((c) => {
        const other = c.participantProfiles.find((p) => p.uid !== currentUserId) ?? c.participantProfiles[0];
        return !q || other?.displayName?.toLowerCase().includes(q) || c.lastMessage?.toLowerCase().includes(q);
      });
  }, [conversations, currentUserId, search]);

  if (!user) return null;

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeId || blocked || (!draft.trim() && !attachment)) return;
    await sendConversationMessage(activeId, draft, attachment, { replyTo });
    setDraft(""); setAttachment(null); setReplyTo(null);
    await setConversationTyping(activeId, false);
  };

  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-5xl overflow-hidden">
          {/* Sidebar */}
          <div className={`${activeConversation ? "hidden md:flex" : "flex"} w-full flex-col border-r md:w-80`}>
            <div className="flex items-center justify-between border-b p-4">
              <h1 className="text-lg font-bold">Messages</h1>
              <Button size="sm" asChild><Link href="/search">New DM</Link></Button>
            </div>
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="h-9 w-full rounded-full border bg-muted/50 pl-9 pr-3 text-sm" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {visible.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No conversations yet.{" "}
                  <Link href="/search" className="text-primary underline">Find people</Link>
                </div>
              ) : visible.map((c) => {
                const other = c.participantProfiles.find((p) => p.uid !== currentUserId) ?? c.participantProfiles[0];
                const unread = c.unreadBy.includes(currentUserId);
                return (
                  <button key={c.id} type="button" onClick={() => setActiveId(c.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 ${activeId === c.id ? "bg-muted/80" : ""}`}>
                    <img src={other?.photoURL || "https://placehold.co/48x48?text=U"} alt={other?.displayName} className="h-11 w-11 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-semibold">{other?.displayName}</p>
                        <span className="text-xs text-muted-foreground">{c.updatedAt ? formatTimeAgo(c.updatedAt) : ""}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm text-muted-foreground">{c.typingBy.includes(other?.uid || "") ? "Typing..." : c.lastMessage || "Open chat"}</p>
                        {unread && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat area */}
          <div className={`${!activeConversation ? "hidden md:flex" : "flex"} flex-1 flex-col`}>
            {activeConversation ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveId(null)}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <img src={otherUser?.photoURL || "https://placehold.co/40x40?text=U"} alt={otherUser?.displayName} className="h-9 w-9 rounded-full object-cover" />
                  <div>
                    <Link href={otherUser ? `/profile/${otherUser.uid}` : "#"} className="font-semibold hover:underline">{otherUser?.displayName}</Link>
                    <p className="text-xs text-muted-foreground">
                      {activeConversation.typingBy.includes(otherUser?.uid || "") ? "Typing..." :
                        activeConversation.presenceBy?.[otherUser?.uid || ""] === "online" ? "Online" : ""}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Say hello 👋</div>
                  ) : messages.map((msg) => {
                    const own = msg.senderId === currentUserId;
                    return (
                      <div key={msg.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[75%] space-y-1">
                          {msg.replyTo && (
                            <div className="rounded-xl border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">↩ {msg.replyTo.text}</div>
                          )}
                          {msg.attachmentUrl && msg.attachmentType?.startsWith("image/") && (
                            <img src={msg.attachmentUrl} alt="img" className="max-h-56 rounded-2xl object-cover" />
                          )}
                          {editingId === msg.id ? (
                            <div className="flex gap-2">
                              <input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="h-9 flex-1 rounded-full border px-3 text-sm" />
                              <Button size="sm" onClick={() => void updateConversationMessage(msg.id, editingText).then(() => setEditingId(null))}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <div className={`rounded-2xl px-4 py-2.5 text-sm ${own ? "bg-primary text-primary-foreground" : "border bg-background"}`}>
                              {msg.deleted ? <span className="italic opacity-60">Message deleted</span> : msg.text}
                            </div>
                          )}
                          {msg.reactions.length > 0 && (
                            <div className="flex gap-1">
                              {msg.reactions.map((r) => (
                                <button key={r.emoji} type="button" onClick={() => void reactToConversationMessage(msg.id, r.emoji)}
                                  className="rounded-full border bg-background px-2 py-0.5 text-xs">{r.emoji} {r.userIds.length}</button>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{msg.createdAt ? formatTimeAgo(msg.createdAt) : ""}</span>
                            {own && !msg.deleted && <span>· Read by {Math.max(msg.readBy.length - 1, 0)}</span>}
                            <button type="button" onClick={() => setReplyTo({ messageId: msg.id, senderId: msg.senderId, text: msg.text || "Message" })}>Reply</button>
                            {REACTIONS.map((e) => <button key={e} type="button" onClick={() => void reactToConversationMessage(msg.id, e)}>{e}</button>)}
                            {own && !msg.deleted && (
                              <>
                                <button type="button" onClick={() => { setEditingId(msg.id); setEditingText(msg.text); }}><Pencil className="h-3 w-3" /></button>
                                <button type="button" onClick={() => void deleteConversationMessage(msg.id)}><Trash2 className="h-3 w-3" /></button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Composer */}
                <form onSubmit={handleSend} className="border-t p-3">
                  {replyTo && (
                    <div className="mb-2 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-xs">
                      <span className="truncate">↩ {replyTo.text}</span>
                      <button type="button" onClick={() => setReplyTo(null)} className="ml-2 text-muted-foreground">✕</button>
                    </div>
                  )}
                  {attachment && (
                    <div className="mb-2 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-xs">
                      <span className="truncate">{attachment.name}</span>
                      <button type="button" onClick={() => setAttachment(null)} className="ml-2 text-muted-foreground">✕</button>
                    </div>
                  )}
                  {blocked && <p className="mb-2 rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-900">This conversation is blocked.</p>}
                  <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-2">
                    <label className="cursor-pointer text-muted-foreground">
                      <ImagePlus className="h-5 w-5" />
                      <input type="file" accept="image/*,video/*,.pdf" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => setAttachment(e.target.files?.[0] ?? null)} />
                    </label>
                    <input
                      value={draft}
                      onChange={async (e) => { setDraft(e.target.value); if (activeId) await setConversationTyping(activeId, Boolean(e.target.value.trim())); }}
                      placeholder="Message..."
                      className="h-9 flex-1 bg-transparent text-sm outline-none"
                    />
                    <Button type="submit" size="icon" className="rounded-full" disabled={blocked || (!draft.trim() && !attachment)}>
                      <SendHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center">
                <div>
                  <p className="text-lg font-semibold">Select a conversation</p>
                  <p className="mt-1 text-sm text-muted-foreground">or <Link href="/search" className="text-primary underline">search for someone</Link> to message</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default function MessagesPage() {
  return <Suspense fallback={null}><MessagesPageContent /></Suspense>;
}
