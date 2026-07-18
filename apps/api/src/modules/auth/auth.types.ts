export interface AccessTokenPayload {
  userId: string;
  organizationId: string;
  role: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  jti: string;
  iat: number;
  exp: number;
}