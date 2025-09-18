import type { SnPost } from './post'

// Activity interface (main response structure)
export interface SnActivity {
  id: string;
  type: string;
  resourceIdentifier: string;
  meta: Record<string, unknown>;
  data: SnPost;
  visibility: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
