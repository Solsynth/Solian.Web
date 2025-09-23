// File metadata interface
import type { SnPublisher } from './publisher'

export interface SnFileMeta {
  blur?: string;
  exif?: Record<string, unknown>;
  xres?: number;
  yres?: number;
  bands?: number;
  ratio?: number;
  width?: number;
  coding?: number;
  format?: number | string;
  height?: number;
  xoffset?: number;
  yoffset?: number;
  filename?: string | null;
  orientation?: number;
  vipsLoader?: string;
  interpretation?: number;
  bitsPerSample?: number;
  resolutionUnit?: string;
}

// Attachment interface
export interface SnAttachment {
  id: string;
  name: string;
  fileMeta: SnFileMeta;
  userMeta: Record<string, unknown> | null;
  sensitiveMarks: string[];
  mimeType: string;
  hash: string;
  size: number;
  hasCompression: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Post interface
export interface SnPost {
  id: string;
  title: string;
  description: string;
  slug: string | null;
  editedAt: string | null;
  publishedAt: string;
  visibility: number;
  content: string;
  type: number;
  pinMode: unknown | null;
  meta: unknown | null;
  sensitiveMarks: string[];
  embedView: unknown | null;
  viewsUnique: number;
  viewsTotal: number;
  upvotes: number;
  downvotes: number;
  awardedScore: number;
  reactionsCount: Record<string, number>;
  repliesCount: number;
  reactionsMade: Record<string, boolean>;
  repliedGone: boolean;
  forwardedGone: boolean;
  repliedPostId: string | null;
  repliedPost: SnPost | null;
  forwardedPostId: string | null;
  forwardedPost: SnPost | null;
  realmId: string | null;
  realm: unknown | null;
  attachments: SnAttachment[];
  publisherId: string;
  publisher: SnPublisher;
  awards: unknown | null;
  tags: string[];
  categories: string[];
  isTruncated: boolean;
  resourceIdentifier: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
