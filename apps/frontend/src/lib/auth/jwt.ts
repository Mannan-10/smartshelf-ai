import { jwtVerify } from 'jose';
import { isAppRole, type AppRole } from '@/lib/rbac';

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: AppRole;
  iat?: number;
  exp?: number;
};

function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is missing in frontend environment variables');
  }

  return new TextEncoder().encode(secret);
}

export async function verifyAuthToken(
  token: string,
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());

    if (!payload.sub || typeof payload.sub !== 'string') {
      return null;
    }

    if (!payload.email || typeof payload.email !== 'string') {
      return null;
    }

    if (!isAppRole(payload.role)) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}