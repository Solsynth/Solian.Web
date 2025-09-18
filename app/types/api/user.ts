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
  activated_at: string;
  expired_at: string | null;
  account_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Account perk subscription interface
export interface SnAccountPerkSubscription {
  id: string;
  identifier: string;
  begun_at: string;
  ended_at: string;
  is_active: boolean;
  is_available: boolean;
  is_free_trial: boolean;
  status: number;
  base_price: number;
  final_price: number;
  renewal_at: string;
  account_id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Account profile interface
export interface SnAccountProfile {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  bio: string;
  gender: string;
  pronouns: string;
  time_zone: string;
  location: string;
  links: SnAccountLink[];
  birthday: string;
  last_seen_at: string;
  verification: SnVerification | null;
  active_badge: unknown | null;
  experience: number;
  level: number;
  social_credits: number;
  social_credits_level: number;
  leveling_progress: number;
  picture: SnAttachment | null;
  background: SnAttachment | null;
  account_id: string;
  resource_identifier: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Account interface
export interface SnAccount {
  id: string;
  name: string;
  nick: string;
  language: string;
  region: string;
  activated_at: string;
  is_superuser: boolean;
  automated_id: string | null;
  profile: SnAccountProfile;
  contacts: unknown[];
  badges: SnAccountBadge[];
  perk_subscription: SnAccountPerkSubscription | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
