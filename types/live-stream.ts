export interface LiveStream {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  sport: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduledFor: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // in minutes
  viewerCount: number;
  maxViewers: number;
  isPrivate: boolean;
  invitedUsers?: string[];
  streamKey?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  category: 'training' | 'game' | 'workout' | 'q&a' | 'recruiting' | 'general';
  settings: {
    allowChat: boolean;
    allowRecording: boolean;
    requireApproval: boolean;
    ageRestriction?: 'all' | '13+' | '18+';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveStreamChat {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'system' | 'moderation';
  isModerator?: boolean;
  isHost?: boolean;
}

export interface LiveStreamReaction {
  id: string;
  streamId: string;
  userId: string;
  reaction: 'like' | 'heart' | 'fire' | 'clap' | 'wow';
  timestamp: Date;
}

export interface StreamAnalytics {
  streamId: string;
  totalViewers: number;
  peakViewers: number;
  averageViewTime: number;
  engagementRate: number;
  chatMessages: number;
  reactions: number;
  shares: number;
  recordings: number;
  revenue?: number;
}