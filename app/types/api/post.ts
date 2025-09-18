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
  'vips-loader'?: string;
  interpretation?: number;
  'bits-per-sample'?: number;
  'resolution-unit'?: string;
}

// Attachment interface
export interface SnAttachment {
  id: string;
  name: string;
  file_meta: SnFileMeta;
  user_meta: Record<string, unknown> | null;
  sensitive_marks: string[];
  mime_type: string;
  hash: string;
  size: number;
  has_compression: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Post interface
export interface SnPost {
  id: string;
  title: string;
  description: string;
  slug: string | null;
  edited_at: string | null;
  published_at: string;
  visibility: number;
  content: string;
  type: number;
  pin_mode: unknown | null;
  meta: unknown | null;
  sensitive_marks: string[];
  embed_view: unknown | null;
  views_unique: number;
  views_total: number;
  upvotes: number;
  downvotes: number;
  awarded_score: number;
  reactions_count: Record<string, number>;
  replies_count: number;
  reactions_made: Record<string, unknown>;
  replied_gone: boolean;
  forwarded_gone: boolean;
  replied_post_id: string | null;
  replied_post: SnPost | null;
  forwarded_post_id: string | null;
  forwarded_post: SnPost | null;
  realm_id: string | null;
  realm: unknown | null;
  attachments: SnAttachment[];
  publisher_id: string;
  publisher: SnPublisher;
  awards: unknown | null;
  tags: string[];
  categories: string[];
  is_truncated: boolean;
  resource_identifier: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
