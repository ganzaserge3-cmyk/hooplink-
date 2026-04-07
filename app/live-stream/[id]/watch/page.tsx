"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { LiveStreamViewer } from "@/components/LiveStreamViewer";
import { getLiveStreamById } from "@/lib/live-stream";
import type { LiveStream } from "@/types/live-stream";

export default function WatchLiveStreamPage() {
  const params = useParams();
  const streamId = params.id as string;
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStream = async () => {
      if (!streamId) {
        setError("Stream ID is required");
        setLoading(false);
        return;
      }

      try {
        const streamData = await getLiveStreamById(streamId);
        if (!streamData) {
          setError("Stream not found");
          setLoading(false);
          return;
        }

        // Check if stream is live or user has permission to view
        if (streamData.status !== 'live' && streamData.status !== 'scheduled') {
          setError("This stream is not currently available");
          setLoading(false);
          return;
        }

        setStream(streamData);
      } catch (err) {
        console.error("Error loading stream:", err);
        setError("Failed to load stream");
      } finally {
        setLoading(false);
      }
    };

    loadStream();
  }, [streamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Stream Unavailable</h1>
          <p className="mb-4">{error || "This stream is not available."}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <LiveStreamViewer stream={stream} />;
}