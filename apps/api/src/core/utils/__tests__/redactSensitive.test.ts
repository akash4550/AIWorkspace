import { redactSensitive } from '../redactSensitive';

describe('redactSensitive', () => {
  it('replaces sensitive values with [REDACTED]', () => {
    const input = {
      username: 'johndoe',
      password: 'super-secret-password',
      email: 'john@example.com',
      token: 'jwt-token-string',
    };

    expect(redactSensitive(input)).toEqual({
      username: 'johndoe',
      password: '[REDACTED]',
      email: 'john@example.com',
      token: '[REDACTED]',
    });
  });

  it('matches keys case-insensitively', () => {
    const input = {
      PassWord: '123',
      APIKEY: '456',
      Authorization: 'Bearer xyz',
      Set_Cookie: 'session=abc',
      SECRET_KEY: 'hidden',
    };

    expect(redactSensitive(input)).toEqual({
      PassWord: '[REDACTED]',
      APIKEY: '[REDACTED]',
      Authorization: '[REDACTED]',
      Set_Cookie: '[REDACTED]',
      SECRET_KEY: '[REDACTED]',
    });
  });

  it('redacts all configured sensitive key terms', () => {
    const input = {
      password: '1',
      token: '2',
      secret: '3',
      authorization: '4',
      cookie: '5',
      apiKey: '6',
      credential: '7',
      databaseUrl: '8',
      redisUrl: '9',
      connectionString: '10',
      safeField: '11',
    };

    expect(redactSensitive(input)).toEqual({
      password: '[REDACTED]',
      token: '[REDACTED]',
      secret: '[REDACTED]',
      authorization: '[REDACTED]',
      cookie: '[REDACTED]',
      apiKey: '[REDACTED]',
      credential: '[REDACTED]',
      databaseUrl: '[REDACTED]',
      redisUrl: '[REDACTED]',
      connectionString: '[REDACTED]',
      safeField: '11',
    });
  });

  it('redacts nested objects and arrays', () => {
    const input = {
      user: {
        id: 1,
        details: {
          socialSecurityNumber: '123-45-678',
          password: 'my-password',
        },
      },
      headers: [
        {
          name: 'Host',
          value: 'localhost',
        },
        {
          name: 'Authorization',
          authorization: 'Bearer token',
        },
      ],
      tokens: ['a', 'b', 'c'],
    };

    expect(redactSensitive(input)).toEqual({
      user: {
        id: 1,
        details: {
          socialSecurityNumber: '123-45-678',
          password: '[REDACTED]',
        },
      },
      headers: [
        {
          name: 'Host',
          value: 'localhost',
        },
        {
          name: 'Authorization',
          authorization: '[REDACTED]',
        },
      ],
      tokens: '[REDACTED]',
    });
  });

  it('preserves safe fields', () => {
    const input = {
      requestId: 'req-12345',
      method: 'POST',
      route: '/api/v1/users',
      status: 201,
      userId: 'user-789',
      organizationId: 'org-101',
      metadata: {
        status: 'active',
      },
    };

    expect(redactSensitive(input)).toEqual(input);
  });

  it('does not mutate the original object', () => {
    const input = {
      id: 1,
      config: {
        apiKey: 'secret-key',
      },
      items: [
        {
          secretValue: 'hidden',
        },
      ],
    };

    const originalSnapshot = structuredClone(input);

    redactSensitive(input);

    expect(input).toEqual(originalSnapshot);
  });

  it('handles null and undefined sensitive values', () => {
    const input = {
      password: null,
      secret: undefined,
      safe: 'value',
    };

    expect(redactSensitive(input)).toEqual({
      password: '[REDACTED]',
      secret: '[REDACTED]',
      safe: 'value',
    });
  });

  it('preserves repeated references that are not circular', () => {
    const shared = {
      status: 'active',
      apiKey: 'shared-secret',
    };

    const input = {
      primary: shared,
      secondary: shared,
    };

    expect(redactSensitive(input)).toEqual({
      primary: {
        status: 'active',
        apiKey: '[REDACTED]',
      },
      secondary: {
        status: 'active',
        apiKey: '[REDACTED]',
      },
    });
  });

  it('handles circular references safely', () => {
    const input: Record<string, unknown> = {
      status: 'active',
    };

    input.self = input;

    expect(redactSensitive(input)).toEqual({
      status: 'active',
      self: '[CIRCULAR]',
    });
  });
});