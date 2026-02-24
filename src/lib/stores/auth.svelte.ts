// Auth store using Svelte 5 runes
import type { SnAuthChallenge, SnAuthFactor, SnAuthToken, User } from '$lib/types/auth';
import { getUserInfo } from '$lib/utils/api';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Auth state using runes
class AuthStore {
	// State
	isAuthenticated = $state(false);
	isLoading = $state(false);
	user = $state<User | null>(null);
	token = $state<SnAuthToken | null>(null);

	// Login flow state
	challenge = $state<SnAuthChallenge | null>(null);
	factors = $state<SnAuthFactor[]>([]);
	selectedFactor = $state<SnAuthFactor | null>(null);

	// FingerprintJS instance
	private fpPromise: Promise<import('@fingerprintjs/fingerprintjs').Agent | null> | null = null;

	constructor() {
		// Initialize FingerprintJS (free version)
		if (typeof window !== 'undefined') {
			this.fpPromise = FingerprintJS.load().catch(() => null);

			// Check for existing token on init
			const savedToken = localStorage.getItem('auth_token');
			if (savedToken) {
				this.token = { token: savedToken };
				this.isAuthenticated = true;
				this.fetchUser();
			}
		}
	}

	// Get device ID using FingerprintJS
	async getDeviceId(): Promise<string> {
		if (typeof window === 'undefined') return '';

		// Try FingerprintJS first
		if (this.fpPromise) {
			try {
				const fp = await this.fpPromise;
				if (fp) {
					const result = await fp.get();
					return result.visitorId;
				}
			} catch {
				// Fallback to localStorage if FingerprintJS fails
			}
		}

		// Fallback to stored UUID
		let deviceId = localStorage.getItem('device_id');
		if (!deviceId) {
			deviceId = crypto.randomUUID();
			localStorage.setItem('device_id', deviceId);
		}
		return deviceId;
	}

	// Actions
	async fetchUser() {
		try {
			this.isLoading = true;
			const userData = await getUserInfo();
			this.user = userData;
			this.isAuthenticated = true;
		} catch (error) {
			console.error('Failed to fetch user:', error);
			this.logout();
		} finally {
			this.isLoading = false;
		}
	}

	setToken(tokenString: string) {
		this.token = { token: tokenString };
		this.isAuthenticated = true;
		if (typeof window !== 'undefined') {
			localStorage.setItem('auth_token', tokenString);
		}
	}

	logout() {
		this.token = null;
		this.user = null;
		this.isAuthenticated = false;
		this.challenge = null;
		this.factors = [];
		this.selectedFactor = null;
		if (typeof window !== 'undefined') {
			localStorage.removeItem('auth_token');
		}
	}

	// Login flow actions
	setChallenge(challenge: SnAuthChallenge | null) {
		this.challenge = challenge;
	}

	setFactors(factors: SnAuthFactor[]) {
		this.factors = factors;
	}

	selectFactor(factor: SnAuthFactor) {
		this.selectedFactor = factor;
	}

	clearLoginFlow() {
		this.challenge = null;
		this.factors = [];
		this.selectedFactor = null;
	}

	// Progress for login steps
	get loginProgress(): number {
		if (!this.challenge) return 0;
		const { stepRemain, stepTotal } = this.challenge;
		if (!stepTotal || stepTotal <= 0) return 0;
		if (stepRemain == null) return 0;
		const progress = 1 - stepRemain / stepTotal;
		return Math.max(0, Math.min(1, progress));
	}

	get loginStep(): number {
		if (!this.challenge) return 0;
		const { stepRemain, stepTotal } = this.challenge;
		if (stepTotal == null || stepRemain == null) return 0;
		return Math.max(0, stepTotal - stepRemain);
	}
}

// Create singleton instance
export const auth = new AuthStore();

// Device info helper
export async function getDeviceInfo(): Promise<Record<string, unknown>> {
	const platform =
		typeof window !== 'undefined'
			? /Mac|iPod|iPhone|iPad/.test(navigator.platform)
				? 4 // macOS
				: /Android/.test(navigator.userAgent)
					? 3 // Android
					: /Windows/.test(navigator.userAgent)
						? 5 // Windows
						: /Linux/.test(navigator.userAgent)
							? 6 // Linux
							: 1 // Web
			: 1;

	const deviceId = await auth.getDeviceId();

	return {
		device_id: deviceId,
		device_name: getDeviceName(),
		platform
	};
}

function getDeviceName(): string {
	if (typeof window === 'undefined') return 'Unknown Device';
	const ua = navigator.userAgent;
	if (ua.includes('Chrome')) return 'Chrome Browser';
	if (ua.includes('Firefox')) return 'Firefox Browser';
	if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari Browser';
	if (ua.includes('Edge')) return 'Edge Browser';
	return 'Web Browser';
}
