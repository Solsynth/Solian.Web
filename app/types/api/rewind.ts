// Rewind data interfaces
import type { SnCloudFile } from './post'

export interface SnRewindPassData {
  maxCheckInStrike: number;
}

export interface SnRewindMostCalledChat {
  id: string;
  name: string;
  type: number;
  description: string;
  picture: SnCloudFile | null;
  realmId: string | null;
  accountId: string;
  isPublic: boolean;
  isCommunity: boolean;
  background: SnCloudFile | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SnRewindMostPopularPost {
  id: string;
  title: string;
  upvotes: number;
  viewsTotal: number;
  viewsUnique: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface SnRewindMostProductiveDay {
  date: string;
  postCount: number;
}

export interface SnRewindMostCalledAccount {
  id: string;
  name: string;
  nick: string;
  profile: {
    id: string;
    bio: string;
    level: number;
    picture: SnCloudFile | null;
    background: SnCloudFile | null;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SnRewindMostLovedPublisher {
  publisher: {
    id: string;
    name: string;
    nick: string;
    bio: string;
    level: number;
    picture: SnCloudFile | null;
    background: SnCloudFile | null;
    createdAt: string;
    updatedAt: string;
  };
  upvoteCounts: number;
}

export interface SnRewindMostMessagedChat {
  id: string;
  name: string | null;
  type: number;
  members: SnRewindChatMember[];
  createdAt: string;
  updatedAt: string;
}

export interface SnRewindChatMember {
  id: string;
  nick: string | null;
  role: number;
  isBot: boolean;
  account: {
    id: string;
    name: string;
    nick: string;
    profile: {
      id: string;
      bio: string;
      level: number;
      picture: SnCloudFile | null;
      background: SnCloudFile | null;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export interface SnRewindSphereData {
  totalCount: number;
  upvoteCounts: number;
  mostCalledChat: SnRewindMostCalledChat;
  mostPopularPost: SnRewindMostPopularPost;
  mostProductiveDay: SnRewindMostProductiveDay;
  mostCalledAccounts: SnRewindMostCalledAccount[];
  mostLovedPublisher: SnRewindMostLovedPublisher;
  mostMessagedChat: SnRewindMostMessagedChat;
}

export interface SnRewind {
  id: string;
  year: number;
  schemaVersion: number;
  data: {
    pass: SnRewindPassData;
    sphere: SnRewindSphereData;
  };
  accountId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
