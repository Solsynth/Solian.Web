import type { SnAttachment } from './post'

// Verification interface
export interface SnVerification {
  type: number;
  title: string;
  description: string;
  verified_by: string;
}

// Publisher interface
export interface SnPublisher {
  id: string;
  type: number;
  name: string;
  nick: string;
  bio: string;
  picture_id: string;
  background_id: string;
  picture: SnAttachment | null;
  background: SnAttachment | null;
  verification: SnVerification | null;
  account_id: string;
  realm_id: string | null;
  account: unknown | null;
  resource_identifier: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
