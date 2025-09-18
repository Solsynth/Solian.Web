/**
 * Transform object keys between snake_case and camelCase
 */

type TransformFunction = (key: string) => string

const snakeCase: TransformFunction = (key: string): string => {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

const camelCase: TransformFunction = (key: string): string => {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function transformKeys(obj: unknown, transformFn: TransformFunction): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys(item, transformFn))
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      const transformedKey = transformFn(key)
      transformed[transformedKey] = transformKeys(value, transformFn)
    }

    return transformed
  }

  return obj
}

/**
 * Convert snake_case keys to camelCase
 */
export function keysToCamel<T = unknown>(obj: unknown): T {
  return transformKeys(obj, camelCase) as T
}

/**
 * Convert camelCase keys to snake_case
 */
export function keysToSnake<T = unknown>(obj: unknown): T {
  return transformKeys(obj, snakeCase) as T
}

/**
 * Deep clone and transform keys
 */
export function deepTransformKeys<T = unknown>(obj: unknown, transformFn: TransformFunction): T {
  return JSON.parse(JSON.stringify(transformKeys(obj, transformFn))) as T
}
