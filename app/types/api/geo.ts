export interface GeoIpLocation {
  latitude: number | null
  longitude: number | null
  countryCode: string | null
  country: string | null
  city: string | null
}

export interface SnAuthChallenge {
  id: string
  expiredAt: string | null
  stepRemain: number
  stepTotal: number
  failedAttempts: number
  type: number
  blacklistFactors: string[]
  audiences: unknown[]
  scopes: unknown[]
  ipAddress: string
  userAgent: string
  nonce: string | null
  location: GeoIpLocation | null
  accountId: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SnAuthSession {
  id: string
  label: string | null
  lastGrantedAt: string
  expiredAt: string | null
  accountId: string
  challengeId: string
  challenge: SnAuthChallenge
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SnAuthFactor {
  id: string
  type: number
  contact?: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  expiredAt: string | null
  enabledAt: string | null
  trustworthy: number
  createdResponse: Record<string, unknown> | null
}

export interface SnAccountConnection {
  id: string
  accountId: string
  provider: string
  providedIdentifier: string
  meta: Record<string, unknown>
  lastUsedAt: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
