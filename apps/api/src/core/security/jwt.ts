import { randomUUID } from 'node:crypto';
import jwt, { JwtPayload as JsonWebTokenPayload, SignOptions } from 'jsonwebtoken';

import { env } from '../../config/env';

export const JWT_ALGORITHM = 'HS256' as const;
export const ACCESS_TOKEN_TYPE = 'access' as const;
export const REFRESH_TOKEN_TYPE = 'refresh' as const;

interface CanonicalTokenClaims extends JsonWebTokenPayload {
  sub: string;
  organizationId: string;
  jti: string;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
}

export interface AccessTokenClaims extends CanonicalTokenClaims {
  type: typeof ACCESS_TOKEN_TYPE;
}

export interface RefreshTokenClaims extends CanonicalTokenClaims {
  type: typeof REFRESH_TOKEN_TYPE;
}

export interface TokenIdentity {
  userId: string;
  organizationId: string;
}

const accessSignOptions: SignOptions = {
  algorithm: JWT_ALGORITHM,
  issuer: env.JWT_ISSUER,
  audience: env.JWT_ACCESS_AUDIENCE,
  expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
};

const refreshSignOptions: SignOptions = {
  algorithm: JWT_ALGORITHM,
  issuer: env.JWT_ISSUER,
  audience: env.JWT_REFRESH_AUDIENCE,
  expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
};

export const signAccessToken = (identity: TokenIdentity): string => jwt.sign(
  {
    type: ACCESS_TOKEN_TYPE,
    organizationId: identity.organizationId,
    jti: randomUUID(),
  },
  env.JWT_ACCESS_SECRET,
  {
    ...accessSignOptions,
    subject: identity.userId,
  },
);

export const signRefreshToken = (identity: TokenIdentity): string => jwt.sign(
  {
    type: REFRESH_TOKEN_TYPE,
    organizationId: identity.organizationId,
    jti: randomUUID(),
  },
  env.JWT_REFRESH_SECRET,
  {
    ...refreshSignOptions,
    subject: identity.userId,
  },
);

const verifyCanonicalClaims = <T extends CanonicalTokenClaims>(
  token: string,
  secret: string,
  audience: string,
  expectedType: typeof ACCESS_TOKEN_TYPE | typeof REFRESH_TOKEN_TYPE,
): T => {
  const payload = jwt.verify(token, secret, {
    algorithms: [JWT_ALGORITHM],
    issuer: env.JWT_ISSUER,
    audience,
  });

  if (
    typeof payload === 'string' ||
    typeof payload.sub !== 'string' ||
    payload.sub.length === 0 ||
    typeof payload.organizationId !== 'string' ||
    payload.organizationId.length === 0 ||
    typeof payload.jti !== 'string' ||
    payload.jti.length === 0 ||
    typeof payload.iat !== 'number' ||
    typeof payload.exp !== 'number' ||
    payload.type !== expectedType
  ) {
    throw new jwt.JsonWebTokenError('Invalid token claims');
  }

  return payload as T;
};

export const verifyAccessToken = (token: string): AccessTokenClaims =>
  verifyCanonicalClaims<AccessTokenClaims>(
    token,
    env.JWT_ACCESS_SECRET,
    env.JWT_ACCESS_AUDIENCE,
    ACCESS_TOKEN_TYPE,
  );

export const verifyRefreshToken = (token: string): RefreshTokenClaims =>
  verifyCanonicalClaims<RefreshTokenClaims>(
    token,
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_AUDIENCE,
    REFRESH_TOKEN_TYPE,
  );
