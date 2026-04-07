"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Send,
  Share2,
  Users,
  Settings,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize,
  Minimize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import {
  joinLiveStream,
  leaveLiveStream,
  sendChatMessage,
  sendReaction,
  subscribeToChatMessages,
  subscribeToReactions,
} from "@/lib/live-stream";
import type { LiveStream, LiveStreamChat, LiveStreamReaction } from "@/types/live-stream";

interface LiveStreamViewerProps {
  stream: LiveStream;
  onClose?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function LiveStreamViewer({
  stream,
  onClose,
  isFullscreen = false,
  onToggleFullscreen,
}: LiveStreamViewerProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [chatMessages, setChatMessages] = useState<LiveStreamChat[]>([]);
  const [reactions, setReactions] = useState<LiveStreamReaction[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!user || !stream.id) return;

    // Join the stream
    joinLiveStream(stream.id).then(() => {
      setIsJoined(true);
    });

    // Subscribe to chat messages
    const unsubscribeChat = subscribeToChatMessages(stream.id, setChatMessages);

    // Subscribe to reactions
    const unsubscribeReactions = subscribeToReactions(stream.id, setReactions);

    return () => {
      if (isJoined) {
        leaveLiveStream(stream.id);
      }
      unsubscribeChat();
      unsubscribeReactions();
    };
  }, [user, stream.id, isJoined]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await sendChatMessage(stream.id, newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSendReaction = async (reaction: LiveStreamReaction['reaction']) => {
    if (!user) return;

    try {
      await sendReaction(stream.id, reaction);
    } catch (error) {
      console.error("Error sending reaction:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Sign in to watch live streams</h3>
          <Button onClick={() => router.push('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-black text-white ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={stream.hostAvatar} alt={stream.hostName} />
            <AvatarFallback>{stream.hostName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{stream.title}</h3>
            <p className="text-sm text-gray-300">{stream.hostName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-red-500 text-white animate-pulse">
            LIVE
          </Badge>
          <div className="flex items-center gap-1 text-sm text-gray-300">
            <Users className="h-4 w-4" />
            {stream.viewerCount}
          </div>
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullscreen}
              className="text-white hover:bg-white/10"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={isMuted}
            src={stream.playbackUrl}
          />

          {/* Video Controls Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="bg-black/50 hover:bg-black/70"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsVideoOff(!isVideoOff)}
                className="bg-black/50 hover:bg-black/70"
              >
                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
            </div>

            {/* Reaction Buttons */}
            <div className="flex items-center gap-1">
              {(['like', 'heart', 'fire', 'clap', 'wow'] as const).map((reaction) => (
                <Button
                  key={reaction}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSendReaction(reaction)}
                  className="bg-black/50 hover:bg-black/70 p-2"
                >
                  {reaction === 'like' && '👍'}
                  {reaction === 'heart' && '❤️'}
                  {reaction === 'fire' && '🔥'}
                  {reaction === 'clap' && '👏'}
                  {reaction === 'wow' && '😮'}
                </Button>
              ))}
            </div>
          </div>

          {/* Floating Reactions */}
          <div className="absolute top-4 right-4 space-y-2">
            {reactions.slice(-5).map((reaction, index) => (
              <div
                key={reaction.id}
                className="animate-bounce text-2xl opacity-80"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {reaction.reaction === 'like' && '👍'}
                {reaction.reaction === 'heart' && '❤️'}
                {reaction.reaction === 'fire' && '🔥'}
                {reaction.reaction === 'clap' && '👏'}
                {reaction.reaction === 'wow' && '😮'}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Sidebar */}
        {stream.settings.allowChat && (
          <div className="w-80 bg-gray-900 flex flex-col border-l border-gray-700">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700">
              <h4 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Live Chat
              </h4>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div key={message.id} className="flex gap-2">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={message.userAvatar} alt={message.userName} />
                      <AvatarFallback>{message.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.userName}</span>
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm break-words">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  maxLength={200}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}