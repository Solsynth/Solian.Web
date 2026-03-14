// API client for Solar Network
import type { SnAuthChallenge, SnAuthFactor, SnAuthToken, User } from '$lib/types/auth';
import { snakeToCamel } from './case';

export const API_BASE = 'api.solian.app';
export const API_BASE_URL = `https://${API_BASE}`;

// Parse response - handles JSON, plain text, and empty responses
async function parseResponse(response: Response): Promise<unknown> {
	const text = await response.text();

	// Empty response
	if (!text || text.trim().length === 0) {
		return null;
	}

	// Try to parse as JSON
	try {
		return JSON.parse(text);
	} catch {
		// Not JSON - return as plain text wrapped in object
		return { message: text.trim() };
	}
}

// Client-side only fetch (for auth)
export async function apiClient(endpoint: string, options: RequestInit = {}): Promise<Response> {
	const url = `${API_BASE_URL}${endpoint}`;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...((options.headers as Record<string, string>) || {})
	};

	// Add auth token if available (client-side only)
	if (typeof window !== 'undefined') {
		const token = localStorage.getItem('auth_token');
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
	}

	const response = await fetch(url, {
		...options,
		headers
	});

	if (!response.ok) {
		const errorData = await parseResponse(response);
		const message =
			typeof errorData === 'object' && errorData && 'message' in errorData
				? String(errorData.message)
				: `HTTP ${response.status}`;
		throw new Error(message);
	}

	return response;
}

// Safe JSON parse that handles empty responses and converts snake_case to camelCase
async function safeJsonParse<T>(response: Response): Promise<T> {
	const data = await parseResponse(response);
	// Convert snake_case to camelCase for all API responses
	return snakeToCamel(data) as T;
}

// Auth API functions
export async function createChallenge(
	account: string,
	deviceInfo: Record<string, unknown>
): Promise<SnAuthChallenge> {
	const response = await apiClient('/padlock/auth/challenge', {
		method: 'POST',
		body: JSON.stringify({
			account,
			...deviceInfo
		})
	});
	return safeJsonParse<SnAuthChallenge>(response);
}

export async function getFactors(challengeId: string): Promise<SnAuthFactor[]> {
	const response = await apiClient(`/padlock/auth/challenge/${challengeId}/factors`);
	return safeJsonParse<SnAuthFactor[]>(response);
}

export async function requestFactorCode(challengeId: string, factorId: string): Promise<unknown> {
	const response = await apiClient(`/padlock/auth/challenge/${challengeId}/factors/${factorId}`, {
		method: 'POST'
	});
	return safeJsonParse<unknown>(response);
}

export async function verifyChallenge(
	challengeId: string,
	factorId: string,
	password: string
): Promise<SnAuthChallenge> {
	const response = await apiClient(`/padlock/auth/challenge/${challengeId}`, {
		method: 'PATCH',
		body: JSON.stringify({
			factor_id: factorId,
			password
		})
	});
	return safeJsonParse<SnAuthChallenge>(response);
}

export async function getToken(code: string): Promise<SnAuthToken> {
	const response = await apiClient('/padlock/auth/token', {
		method: 'POST',
		body: JSON.stringify({
			grant_type: 'authorization_code',
			code
		})
	});
	return safeJsonParse<SnAuthToken>(response);
}

export async function getUserInfo(): Promise<User> {
	const response = await apiClient('/passport/accounts/me');
	return safeJsonParse<User>(response);
}

export async function createAccount(payload: {
	name: string;
	nick: string;
	email: string;
	password: string;
	language: string;
	captchaToken: string;
}): Promise<unknown> {
	const response = await apiClient('/padlock/accounts', {
		method: 'POST',
		body: JSON.stringify({
			name: payload.name,
			nick: payload.nick,
			email: payload.email,
			password: payload.password,
			language: payload.language,
			captcha_token: payload.captchaToken
		})
	});
	return safeJsonParse<unknown>(response);
}

export async function requestPasswordReset(
	account: string,
	captchaToken: string
): Promise<unknown> {
	const response = await apiClient('/padlock/accounts/recovery/password', {
		method: 'POST',
		body: JSON.stringify({
			account,
			captcha_token: captchaToken
		})
	});
	return safeJsonParse<unknown>(response);
}

export interface CaptchaConfig {
	provider: string;
	apiKey: string;
}

export async function getCaptchaConfig(): Promise<CaptchaConfig> {
	const response = await apiClient('/padlock/auth/captcha');
	return safeJsonParse<CaptchaConfig>(response);
}

export async function getAuthorizeClientInfo(query: URLSearchParams): Promise<{
	clientName?: string;
	homeUri?: string;
	picture?: { id?: string };
	background?: { id?: string };
	scopes?: string[];
}> {
	const response = await apiClient(`/padlock/auth/open/authorize?${query.toString()}`);
	return safeJsonParse(response);
}

export async function submitAuthorizeDecision(
	query: URLSearchParams,
	authorize: boolean
): Promise<{ redirectUri?: string }> {
	const payload = new URLSearchParams(query);
	payload.set('authorize', authorize ? 'true' : 'false');

	const response = await apiClient('/padlock/auth/open/authorize', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: payload.toString()
	});
	return safeJsonParse(response);
}

export interface WalletOrder {
	id: string;
	productIdentifier: string | null;
	remarks: string | null;
	amount: number;
	currency: string;
	expiredAt?: string | null;
}

export interface SpellInfo {
	type: number;
	account: {
		name: string;
	};
	createdAt: string;
	affectedAt: string;
	expiredAt?: string;
}

export async function getOrder(orderId: string): Promise<WalletOrder> {
	const response = await apiClient(`/passport/orders/${encodeURIComponent(orderId)}`);
	return safeJsonParse<WalletOrder>(response);
}

export async function payOrder(orderId: string, pinCode: string): Promise<unknown> {
	const response = await apiClient(`/passport/orders/${encodeURIComponent(orderId)}/pay`, {
		method: 'POST',
		body: JSON.stringify({
			pin_code: pinCode
		})
	});
	return safeJsonParse(response);
}

export async function getSpell(spellWord: string): Promise<SpellInfo> {
	const response = await apiClient(`/passport/spells/${encodeURIComponent(spellWord)}`);
	return safeJsonParse<SpellInfo>(response);
}

export async function applySpell(spellWord: string, newPassword?: string): Promise<unknown> {
	const response = await apiClient(`/passport/spells/${encodeURIComponent(spellWord)}/apply`, {
		method: 'POST',
		body: newPassword ? JSON.stringify({ new_password: newPassword }) : null
	});
	return safeJsonParse(response);
}

// OIDC login URLs
export function getOidcLoginUrl(provider: string, deviceId: string, returnUrl: string): string {
	const params = new URLSearchParams({
		returnUrl,
		deviceId,
		flow: 'login'
	});
	return `${API_BASE_URL}/padlock/auth/login/${provider.toLowerCase()}?${params}`;
}

// Apple login (mobile only)
export async function loginWithApple(
	identityToken: string,
	authorizationCode: string,
	deviceInfo: Record<string, unknown>
): Promise<SnAuthToken> {
	const response = await apiClient('/padlock/auth/login/apple/mobile', {
		method: 'POST',
		body: JSON.stringify({
			identity_token: identityToken,
			authorization_code: authorizationCode,
			...deviceInfo
		})
	});
	return safeJsonParse<SnAuthToken>(response);
}
