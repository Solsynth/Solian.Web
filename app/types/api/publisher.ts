import type { SnCloudFile } from './post'

// Verification interface
export interface SnVerification {
  type: number;
  title: string;
  description: string;
  verifiedBy: string;
}

// Publisher interface
export interface SnPublisher {
  id: string;
  type: number;
  name: string;
  nick: string;
  bio: string;
  pictureId: string;
  backgroundId: string;
  picture: SnCloudFile | null;
  background: SnCloudFile | null;
  verification: SnVerification | null;
  accountId: string;
  realmId: string | null;
  account: unknown | null;
  resourceIdentifier: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
