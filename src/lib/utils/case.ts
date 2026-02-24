// Convert snake_case to camelCase
function toCamelCase(str: string): string {
	return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Recursively convert object keys from snake_case to camelCase
export function snakeToCamel<T>(obj: unknown): T {
	if (obj === null || obj === undefined) {
		return obj as T;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => snakeToCamel(item)) as T;
	}

	if (typeof obj === 'object' && obj !== null) {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			const camelKey = toCamelCase(key);
			result[camelKey] = snakeToCamel(value);
		}
		return result as T;
	}

	return obj as T;
}

// Recursively convert object keys from camelCase to snake_case
export function camelToSnake<T>(obj: unknown): T {
	if (obj === null || obj === undefined) {
		return obj as T;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => camelToSnake(item)) as T;
	}

	if (typeof obj === 'object' && obj !== null) {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
			result[snakeKey] = camelToSnake(value);
		}
		return result as T;
	}

	return obj as T;
}
