export interface UserRole {
  type: 'athlete' | 'coach' | 'scout' | 'fan';
  sport: string;
  position?: string;
  age?: number;
  height?: string;
  weight?: string;
  team?: string;
  experience?: string;
  bio?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  followers: string[];
  following: string[];
  postsCount: number;
  reelsCount: number;
  verified?: boolean;
  location?: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  caption: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  sport: string;
  likes: string[];
  comments: Comment[];
  shares: number;
  saves: string[];
  createdAt: Date;
}

export interface Reel {
  id: string;
  userId: string;
  caption: string;
  videoUrl: string;
  likes: string[];
  comments: Comment[];
  views: number;
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  expiresAt: Date;
}
