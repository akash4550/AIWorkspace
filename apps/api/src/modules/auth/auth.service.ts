import { createHash, randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../core/errors/AppError';

import {
  LoginDto,
  LoginMetadata,
  LoginResponse,
  RefreshResponse,
  AuthenticatedUser,
  JwtAccessPayload,
  JwtRefreshPayload,
} from './auth.dto';

export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = '15m';

private readonly REFRESH_TOKEN_EXPIRY = '7d';

private readonly REFRESH_TOKEN_DURATION =
  7 * 24 * 60 * 60 * 1000;
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async login(
    data: LoginDto,
    metadata?: LoginMetadata
  ): Promise<LoginResponse> {
    const user = await prisma.user.findFirst({
  where:{
    email:data.email.toLowerCase().trim(),
    organizationId:data.organizationId,
    deletedAt:null,
    isActive:true,
  }
});

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
if (user.lockedUntil && user.lockedUntil > new Date()) {
  throw new AppError(
    'Account is temporarily locked. Please try again later.',
    423
  );
}
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.password
    );

    if (!isPasswordValid) {
  const updatedUser = await prisma.user.update({
  where: {
    id: user.id,
  },
  data: {
    failedLoginAttempts: {
      increment: 1,
    },
  },
});

if (updatedUser.failedLoginAttempts >= 5) {
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lockedUntil: new Date(
        Date.now() + 15 * 60 * 1000
      ),
    },
  });
}

  throw new AppError('Invalid credentials', 401);
}
await prisma.user.update({
  where: {
    id: user.id,
  },
  data: {
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLogin: new Date(),
  },
});
    const accessToken = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
      } satisfies JwtAccessPayload,
      env.JWT_SECRET,
      {
expiresIn:this.ACCESS_TOKEN_EXPIRY,
        algorithm: 'HS256',
      }
    );

   const refreshToken = jwt.sign(
  {
    userId: user.id,
    jti: randomUUID(),
    type: 'refresh',
  } satisfies JwtRefreshPayload,
  env.JWT_SECRET,
  {
     expiresIn:this.REFRESH_TOKEN_EXPIRY,
  algorithm: 'HS256',
 }
);

   await prisma.refreshToken.create({
  data: {
    tokenHash: this.hashToken(refreshToken),
    userId: user.id,
    expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_DURATION),
    lastUsedAt: new Date(),
   device: metadata?.device,
ipAddress: metadata?.ipAddress,
userAgent: metadata?.userAgent,
  },
});

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async authenticate(
  token: string
): Promise<AuthenticatedUser> {
  let payload: JwtAccessPayload;

  try {
    payload = jwt.verify(
  token,
  env.JWT_SECRET,
  {
    algorithms: ['HS256'],
  }
) as JwtAccessPayload;



  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await prisma.user.findUnique({
  where: {
    id: payload.userId,
  },
  select: {
    id: true,
    organizationId: true,
    role: true,
    deletedAt: true,
    isActive: true,
  },
});

  if (!user) {
    throw new AppError('User not found', 401);
  }

  if (user.deletedAt) {
    throw new AppError('User account has been deleted', 403);
  }

  if (!user.isActive) {
    throw new AppError('User account is inactive', 403);
  }

  return {
    id: user.id,
    organizationId: user.organizationId,
    role: user.role,
  };
}
 async refreshToken(
  token: string
): Promise<RefreshResponse> {


let payload: JwtRefreshPayload;
  try {
  payload = jwt.verify(
    token,
    env.JWT_SECRET,
    {
      algorithms: ['HS256'],
    }
  ) as JwtRefreshPayload;
} catch {
  throw new AppError('Invalid refresh token', 401);
}

if (payload.type !== 'refresh') {
  throw new AppError('Invalid token type', 401);
}

if (!payload.jti) {
  throw new AppError('Invalid refresh token', 401);
}
  const hashedToken = this.hashToken(token);

 const storedToken = await prisma.refreshToken.findUnique({
   where:{
     tokenHash: hashedToken
   },
   include: {
  user: {
    select: {
      id: true,
      organizationId: true,
      role: true,
      deletedAt: true,
      isActive: true,
    },
  },
},
   
 });
if (!storedToken) {
  throw new AppError('Invalid refresh token', 401);
}

if (
  storedToken.user.deletedAt ||
  !storedToken.user.isActive
) {
  throw new AppError('User is inactive', 403);
}

 


 if(
   storedToken.revokedAt ||
   storedToken.expiresAt < new Date()
 ){
   throw new AppError(
    'Refresh token expired',
    401
   );
 }

const newAccessToken = jwt.sign(
  {
    userId: storedToken.user.id,
    organizationId: storedToken.user.organizationId,
    role: storedToken.user.role,
  },
  env.JWT_SECRET,
 {
expiresIn:this.ACCESS_TOKEN_EXPIRY,
  algorithm: 'HS256',
}
);

const newRefreshToken = jwt.sign(
  {
    userId: storedToken.user.id,
    jti: randomUUID(),
    type: 'refresh',
  },
  env.JWT_SECRET,
  { expiresIn:this.REFRESH_TOKEN_EXPIRY, algorithm: 'HS256' }
);
 // revoke old token
 await prisma.$transaction(async (tx) => {
  await tx.refreshToken.update({
  where: { id: storedToken.id },
  data: {
    lastUsedAt: new Date(),
    revokedAt: new Date(),
  },
});

  await tx.refreshToken.create({
  data: {
    tokenHash: this.hashToken(newRefreshToken),
    userId: storedToken.user.id,
    expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_DURATION),
    device: storedToken.device,
    ipAddress: storedToken.ipAddress,
    userAgent: storedToken.userAgent,
    lastUsedAt: new Date(),
  },
});
});

 return {
   accessToken:newAccessToken,
   refreshToken:newRefreshToken
 };
}

async logout(token: string): Promise<void> {
    const hashed = this.hashToken(token);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashed,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
}