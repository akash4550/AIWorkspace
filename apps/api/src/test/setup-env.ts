process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.AUTH_TEST_DATABASE_URL
  ?? process.env.DATABASE_URL
  ?? 'postgresql://aiworkspace_test:aiworkspace_test@127.0.0.1:55432/aiworkspace_test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
  ?? 'test-access-token-secret-change-me-now';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
  ?? 'test-refresh-token-secret-change-me-now';
process.env.JWT_ISSUER = 'aiworkspace-api-test';
process.env.JWT_ACCESS_AUDIENCE = 'aiworkspace-api-test';
process.env.JWT_REFRESH_AUDIENCE = 'aiworkspace-auth-test';
process.env.FRONTEND_URL = 'http://localhost:5173';
