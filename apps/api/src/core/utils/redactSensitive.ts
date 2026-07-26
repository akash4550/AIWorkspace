const REDACTED_VALUE = '[REDACTED]';
const CIRCULAR_VALUE = '[CIRCULAR]';

const SENSITIVE_KEYS_PATTERN =
  /password|token|secret|authorization|cookie|api[_-]?key|credential|databaseurl|redisurl|connectionstring/i;

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function redactValue(
  value: unknown,
  key: string | undefined,
  activePath: WeakSet<object>,
): unknown {
  if (key && SENSITIVE_KEYS_PATTERN.test(key)) {
    return REDACTED_VALUE;
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (activePath.has(value)) {
    return CIRCULAR_VALUE;
  }

  activePath.add(value);

  let result: unknown;

  if (Array.isArray(value)) {
    result = value.map((item) =>
      redactValue(item, undefined, activePath),
    );
  } else if (isPlainObject(value)) {
    const cloned: Record<string, unknown> = {};

    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      cloned[propertyKey] = redactValue(
        propertyValue,
        propertyKey,
        activePath,
      );
    }

    result = cloned;
  } else {
    result = value;
  }

  activePath.delete(value);

  return result;
}

export function redactSensitive(value: unknown): unknown {
  return redactValue(value, undefined, new WeakSet<object>());
}