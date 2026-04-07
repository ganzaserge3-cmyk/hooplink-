"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Square,
  Settings,
  Users,
  MessageCircle,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  getLiveStreamById,
  startLiveStream,
  endLiveStream,
  subscribeToChatMessages,
} from "@/lib/live-stream";
import type { LiveStream, LiveStreamChat } from "@/types/live-stream";

export default function BroadcastPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const streamId = params.id as string;

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<LiveStreamChat[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const loadStream = async () => {
      if (!streamId) return;

      try {
        const streamData = await getLiveStreamById(streamId);
        if (!streamData || streamData.hostId !== user?.uid) {
          router.push('/live-stream');
          return;
        }
        setStream(streamData);
      } catch (error) {
        console.error("Error loading stream:", error);
        router.push('/live-stream');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadStream();
    }
  }, [streamId, user, router]);

  useEffect(() => {
    if (!streamId) return;

    // Subscribe to chat messages
    const unsubscribeChat = subscribeToChatMessages(streamId, (messages) => {
      setChatMessages(messages);
      // Update viewer count based on unique users in chat
      const uniqueUsers = new Set(messages.map(m => m.userId));
      setViewerCount(uniqueUsers.size);
    });

    return unsubscribeChat;
  }, [streamId]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      streamRef.current = mediaStream;
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const startScreenShare = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      streamRef.current = mediaStream;
      setIsScreenSharing(true);
    } catch (error) {
      console.error("Error accessing screen share:", error);
    }
  };

  const stopStreaming = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setIsScreenSharing(false);
  };

  const handleStartStream = async () => {
    if (!stream) return;

    try {
      await startCamera();
      await startLiveStream(stream.id);
      setIsStreaming(true);
    } catch (error) {
      console.error("Error starting stream:", error);
    }
  };

  const handleEndStream = async () => {
    if (!stream) return;

    try {
      await endLiveStream(stream.id);
      stopStreaming();
      router.push('/live-stream');
    } catch (error) {
      console.error("Error ending stream:", error);
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Setting up your stream...</h1>
          <p>Loading broadcast setup...</p>
        </div>
      </div>
    );
  }

  if (!stream || stream.hostId !== user?.uid) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Stream not found</h1>
          <p>You don't have permission to broadcast this stream.</p>
          <Button asChild className="mt-4">
            <Link href="/live-stream">Back to Live Streams</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-white">
            <Link href="/live-stream">
              ← Back to Streams
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{stream.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {viewerCount} viewers
              </span>
              <Badge className="bg-red-500 text-white">
                {isStreaming ? 'LIVE' : 'READY'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndStream}
            disabled={!isStreaming}
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            End Stream
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {!isStreaming ? (
            <div className="h-full flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Play className="h-16 w-16 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Ready to go live?</h2>
                <p className="text-gray-400 mb-6 max-w-md">
                  Click the button below to start your live stream. Make sure your camera and microphone are working.
                </p>
                <Button onClick={handleStartStream} size="lg" className="bg-red-600 hover:bg-red-700">
                  <Play className="h-5 w-5 mr-2" />
                  Go Live
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative h-full">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Stream Controls Overlay */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur rounded-full px-6 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className={`text-white ${isMuted ? 'bg-red-600' : ''}`}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleVideo}
                  className={`text-white ${isVideoOff ? 'bg-red-600' : ''}`}
                >
                  {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startScreenShare}
                  className={`text-white ${isScreenSharing ? 'bg-blue-600' : ''}`}
                >
                  <Monitor className="h-5 w-5" />
                </Button>

                <div className="w-px h-6 bg-gray-600" />

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndStream}
                >
                  <Square className="h-5 w-5" />
                </Button>
              </div>

              {/* Live Indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
          {/* Stream Info */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold mb-2">Stream Info</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Title:</span> {stream.title}
              </div>
              <div>
                <span className="text-gray-400">Category:</span> {stream.category}
              </div>
              <div>
                <span className="text-gray-400">Sport:</span> {stream.sport}
              </div>
              <div>
                <span className="text-gray-400">Privacy:</span> {stream.isPrivate ? 'Private' : 'Public'}
              </div>
            </div>
          </div>

          {/* Chat Preview */}
          {stream.settings.allowChat && (
            <div className="flex-1 p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Live Chat ({chatMessages.length})
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {chatMessages.slice(-10).map((message) => (
                  <div key={message.id} className="text-sm">
                    <span className="font-medium text-blue-400">{message.userName}:</span>{' '}
                    <span>{message.message}</span>
                  </div>
                ))}

                {chatMessages.length === 0 && (
                  <p className="text-gray-400 text-sm">No messages yet. Chat will appear here when viewers join.</p>
                )}
              </div>
            </div>
          )}

          {/* Stream Stats */}
          <div className="p-4 border-t border-gray-700">
            <h3 className="font-semibold mb-3">Stream Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Viewers</div>
                <div className="font-semibold">{viewerCount}</div>
              </div>
              <div>
                <div className="text-gray-400">Duration</div>
                <div className="font-semibold">
                  {isStreaming ? 'Live' : 'Not started'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}