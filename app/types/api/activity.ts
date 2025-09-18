import type { SnPost } from './post'

// Activity interface (main response structure)
export interface SnActivity {
  id: string;
  type: string;
  resource_identifier: string;
  meta: Record<string, unknown>;
  data: SnPost;
  visibility: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
