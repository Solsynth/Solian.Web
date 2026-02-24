// Auth types (camelCase - API responses are transformed)

export interface SnAuthFactor {
	id: string;
	type: number;
	name?: string;
}

export interface SnAuthChallenge {
	id: string;
	accountId: number;
	stepTotal: number;
	stepRemain: number;
	blacklistFactors: string[];
	createdAt: string;
}

export interface SnAuthToken {
	token: string;
	expiresAt?: string;
}

// User profile types
export interface UserProfilePicture {
	id: string;
	url: string | null;
	width: number | null;
	height: number | null;
	blurhash: string | null;
}

export interface UserProfile {
	id: string;
	firstName: string;
	middleName: string;
	lastName: string;
	bio: string;
	gender: string;
	pronouns: string;
	timeZone: string;
	location: string;
	links: { name: string; url: string }[];
	birthday: string;
	lastSeenAt: string;
	experience: number;
	level: number;
	levelingProgress: number;
	socialCredits: number;
	socialCreditsLevel: number;
	picture: UserProfilePicture | null;
	background: UserProfilePicture | null;
}

export interface UserBadge {
	id: string;
	type: string;
	label: string | null;
	caption: string | null;
	activatedAt: string;
}

export interface User {
	id: string;
	name: string;
	nick: string;
	language: string;
	region: string;
	activatedAt: string;
	isSuperuser: boolean;
	profile: UserProfile;
	badges: UserBadge[];
	createdAt: string;
	updatedAt: string;
}

// Factor type definitions matching Flutter kFactorTypes
export const FACTOR_TYPES: Record<number, { label: string; description: string; icon: string }> = {
	0: { label: 'Password', description: 'Enter your account password', icon: 'key' },
	1: { label: 'Email', description: 'Verification code sent to your email', icon: 'mail' },
	2: { label: 'In-App Notification', description: 'Approve login from your device', icon: 'bell' },
	3: { label: 'TOTP', description: 'Time-based one-time password', icon: 'timer' },
	4: { label: 'PIN', description: 'Enter your security PIN', icon: 'shield' }
};

export type LoginStep = 'lookup' | 'picker' | 'check';
