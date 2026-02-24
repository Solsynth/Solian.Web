// API client for Solar Network
import type { SnAuthChallenge, SnAuthFactor, SnAuthToken, User } from '$lib/types/auth';
import { snakeToCamel } from './case';

const API_BASE_URL = 'https://api.solian.app';

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
export async function apiClient(
	endpoint: string,
	options: RequestInit = {}
): Promise<Response> {
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
	const response = await apiClient('/pass/auth/challenge', {
		method: 'POST',
		body: JSON.stringify({
			account,
			...deviceInfo
		})
	});
	return safeJsonParse<SnAuthChallenge>(response);
}

export async function getFactors(challengeId: string): Promise<SnAuthFactor[]> {
	const response = await apiClient(`/pass/auth/challenge/${challengeId}/factors`);
	return safeJsonParse<SnAuthFactor[]>(response);
}

export async function requestFactorCode(
	challengeId: string,
	factorId: string
): Promise<unknown> {
	const response = await apiClient(`/pass/auth/challenge/${challengeId}/factors/${factorId}`, {
		method: 'POST'
	});
	return safeJsonParse<unknown>(response);
}

export async function verifyChallenge(
	challengeId: string,
	factorId: string,
	password: string
): Promise<SnAuthChallenge> {
	const response = await apiClient(`/pass/auth/challenge/${challengeId}`, {
		method: 'PATCH',
		body: JSON.stringify({
			factor_id: factorId,
			password
		})
	});
	return safeJsonParse<SnAuthChallenge>(response);
}

export async function getToken(code: string): Promise<SnAuthToken> {
	const response = await apiClient('/pass/auth/token', {
		method: 'POST',
		body: JSON.stringify({
			grant_type: 'authorization_code',
			code
		})
	});
	return safeJsonParse<SnAuthToken>(response);
}

export async function getUserInfo(): Promise<User> {
	const response = await apiClient('/pass/accounts/me');
	return safeJsonParse<User>(response);
}

export async function requestPasswordReset(
	account: string,
	captchaToken: string
): Promise<unknown> {
	const response = await apiClient('/pass/accounts/recovery/password', {
		method: 'POST',
		body: JSON.stringify({
			account,
			captcha_token: captchaToken
		})
	});
	return safeJsonParse<unknown>(response);
}

// OIDC login URLs
export function getOidcLoginUrl(
	provider: string,
	deviceId: string,
	returnUrl: string
): string {
	const params = new URLSearchParams({
		returnUrl,
		deviceId,
		flow: 'login'
	});
	return `${API_BASE_URL}/pass/auth/login/${provider.toLowerCase()}?${params}`;
}

// Apple login (mobile only)
export async function loginWithApple(
	identityToken: string,
	authorizationCode: string,
	deviceInfo: Record<string, unknown>
): Promise<SnAuthToken> {
	const response = await apiClient('/pass/auth/login/apple/mobile', {
		method: 'POST',
		body: JSON.stringify({
			identity_token: identityToken,
			authorization_code: authorizationCode,
			...deviceInfo
		})
	});
	return safeJsonParse<SnAuthToken>(response);
}
