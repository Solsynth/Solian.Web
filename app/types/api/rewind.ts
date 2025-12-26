// Rewind data interfaces
import type { SnCloudFile } from "./post"
import type { SnPublisher } from "./publisher"
import type { SnAccount } from "./user"

export interface SnRewindActiveData {
  maxCheckInStreak: number
  mostActiveDay: string
  mostActiveWeekday: string
  latestActiveTime: string
  checkInCompleteness: number
  lotteriesWins: number
  lotteriesLosses: number
  lotteriesWinRate: number
  newBlockedCount: number
  newFriendsCount: number
}

export interface SnRewindMostCalledChat {
  id: string
  name: string
  type: number
  description: string
  picture: SnCloudFile | null
  realmId: string | null
  accountId: string
  isPublic: boolean
  isCommunity: boolean
  background: SnCloudFile | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SnRewindMostPopularPost {
  id: string
  title: string
  upvotes: number
  viewsTotal: number
  viewsUnique: number
  createdAt: string
  updatedAt: string
  publishedAt: string
}

export interface SnRewindMostProductiveDay {
  date: string
  postCount: number
}

export interface SnRewindMostLovedPublisher {
  publisher: SnPublisher
  upvoteCounts: number
}

export interface SnRewindChat {
  id: string
  name: string | null
  type: number
  members: SnRewindChatMember[]
  picture: SnCloudFile | null
  background: SnCloudFile | null
  createdAt: string
  updatedAt: string
}

export interface SnRewindCallSummary {
  chat: SnRewindChat
  duration: number
}

export interface SnRewindChatSummary {
  chat: SnRewindChat
  messageCounts: number
}

export interface SnRewindChatMember {
  id: string
  nick: string | null
  role: number
  account: {
    id: string
    name: string
    nick: string
    profile: {
      id: string
      bio: string
      level: number
      picture: SnCloudFile | null
      background: SnCloudFile | null
      createdAt: string
      updatedAt: string
    }
  }
}

export interface SnRewindMostLovedAudience {
  account: SnAccount
  upvoteCounts: number
}

export interface SnAccountCallRewind {
  account: SnAccount
  duration: number
}

export interface SnRewindSocialData {
  totalPostCount: number
  totalUpvoteCount: number
  mostCalledChat: SnRewindCallSummary
  mostMessagedDirectChat: SnRewindChatSummary
  mostPopularPost: SnRewindMostPopularPost
  mostProductiveDay: SnRewindMostProductiveDay
  mostCalledAccounts: SnAccountCallRewind[]
  mostCalledChatTopMembers: SnAccount[]
  mostLovedPublisher: SnRewindMostLovedPublisher
  mostLovedAudience: SnRewindMostLovedAudience
  mostMessagedChat: SnRewindChatSummary
  topWords: { word: string; count: number }[]
}

export interface SnRewind {
  id: string
  year: number
  schemaVersion: number
  data: {
    pass: SnRewindActiveData
    sphere: SnRewindSocialData
  }
  accountId: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
