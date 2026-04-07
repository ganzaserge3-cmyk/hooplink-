"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Play,
  Users,
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  Heart,
  Share2,
  Settings,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import type { LiveStream } from "@/types/live-stream";

interface LiveStreamCardProps {
  stream: LiveStream;
  showHost?: boolean;
  compact?: boolean;
  onJoin?: (streamId: string) => void;
  onShare?: (stream: LiveStream) => void;
}

export function LiveStreamCard({
  stream,
  showHost = true,
  compact = false,
  onJoin,
  onShare,
}: LiveStreamCardProps) {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(stream.status === 'live');

  useEffect(() => {
    setIsLive(stream.status === 'live');
  }, [stream.status]);

  const isHost = user?.uid === stream.hostId;
  const canJoin = stream.status === 'live' && !stream.isPrivate;

  const getStatusColor = (status: LiveStream['status']) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white';
      case 'scheduled':
        return 'bg-blue-500 text-white';
      case 'ended':
        return 'bg-gray-500 text-white';
      case 'cancelled':
        return 'bg-red-700 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: LiveStream['status']) => {
    switch (status) {
      case 'live':
        return 'LIVE';
      case 'scheduled':
        return 'SCHEDULED';
      case 'ended':
        return 'ENDED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return status.toUpperCase();
    }
  };

  const formatScheduledTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={stream.hostAvatar} alt={stream.hostName} />
                <AvatarFallback>{stream.hostName.charAt(0)}</AvatarFallback>
              </Avatar>
              {isLive && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={getStatusColor(stream.status)}>
                  {getStatusText(stream.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {stream.sport}
                </span>
              </div>

              <h3 className="font-semibold text-sm truncate">{stream.title}</h3>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {stream.viewerCount}
                </span>
                {stream.status === 'scheduled' && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatScheduledTime(stream.scheduledFor)}
                  </span>
                )}
              </div>
            </div>

            {canJoin && (
              <Button size="sm" onClick={() => onJoin?.(stream.id)}>
                <Play className="h-4 w-4 mr-1" />
                Join
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5">
        {stream.thumbnailUrl ? (
          <img
            src={stream.thumbnailUrl}
            alt={stream.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-12 w-12 text-primary/50" />
          </div>
        )}

        <div className="absolute top-3 left-3">
          <Badge className={getStatusColor(stream.status)}>
            {getStatusText(stream.status)}
          </Badge>
        </div>

        {isLive && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded text-sm">
              <Eye className="h-3 w-3" />
              {stream.viewerCount}
            </div>
          </div>
        )}

        {stream.status === 'scheduled' && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="bg-black/50 text-white px-3 py-2 rounded text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatScheduledTime(stream.scheduledFor)}
              </div>
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate mb-1">{stream.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {stream.description}
            </p>

            {showHost && (
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={stream.hostAvatar} alt={stream.hostName} />
                  <AvatarFallback>{stream.hostName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{stream.hostName}</span>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {stream.viewerCount} {stream.viewerCount === 1 ? 'viewer' : 'viewers'}
              </span>

              <Badge variant="outline" className="text-xs">
                {stream.category}
              </Badge>

              <Badge variant="outline" className="text-xs">
                {stream.sport}
              </Badge>
            </div>
          </div>

          {isHost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/live-stream/${stream.id}/edit`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Stream
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare?.(stream)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Stream
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          {canJoin ? (
            <Button className="flex-1" onClick={() => onJoin?.(stream.id)}>
              <Play className="h-4 w-4 mr-2" />
              Join Live Stream
            </Button>
          ) : stream.status === 'scheduled' ? (
            <Button variant="outline" className="flex-1" disabled>
              <Calendar className="h-4 w-4 mr-2" />
              Scheduled
            </Button>
          ) : (
            <Button variant="outline" className="flex-1" disabled>
              <Clock className="h-4 w-4 mr-2" />
              {getStatusText(stream.status)}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => onShare?.(stream)}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}