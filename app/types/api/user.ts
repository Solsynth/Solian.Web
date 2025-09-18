import type { SnAttachment } from './post'
import type { SnVerification } from './publisher'

// Account link interface
export interface SnAccountLink {
  name: string;
  url: string;
}

// Account badge interface
export interface SnAccountBadge {
  id: string;
  type: string;
  label: string | null;
  caption: string | null;
  meta: Record<string, unknown>;
  activatedAt: string;
  expiredAt: string | null;
  accountId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Account perk subscription interface
export interface SnAccountPerkSubscription {
  id: string;
  identifier: string;
  begunAt: string;
  endedAt: string;
  isActive: boolean;
  isAvailable: boolean;
  isFreeTrial: boolean;
  status: number;
  basePrice: number;
  finalPrice: number;
  renewalAt: string;
  accountId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Account profile interface
export interface SnAccountProfile {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  bio: string;
  gender: string;
  pronouns: string;
  timeZone: string;
  location: string;
  links: SnAccountLink[];
  birthday: string;
  lastSeenAt: string;
  verification: SnVerification | null;
  activeBadge: unknown | null;
  experience: number;
  level: number;
  socialCredits: number;
  socialCreditsLevel: number;
  levelingProgress: number;
  picture: SnAttachment | null;
  background: SnAttachment | null;
  accountId: string;
  resourceIdentifier: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Account interface
export interface SnAccount {
  id: string;
  name: string;
  nick: string;
  language: string;
  region: string;
  activatedAt: string;
  isSuperuser: boolean;
  automatedId: string | null;
  profile: SnAccountProfile;
  contacts: unknown[];
  badges: SnAccountBadge[];
  perkSubscription: SnAccountPerkSubscription | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
