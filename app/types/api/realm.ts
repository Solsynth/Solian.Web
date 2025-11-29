import type { SnCloudFile } from "./post"
import type { SnVerification as SnVerificationMark } from "./publisher"

export interface SnRealm {
  id: string
  slug: string
  name: string
  description?: string
  isCommunity: boolean
  isPublic: boolean
  picture?: SnCloudFile
  background?: SnCloudFile
  verification?: SnVerificationMark
  accountId: string
  resourceIdentifier: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
