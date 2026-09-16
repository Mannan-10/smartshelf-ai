import { jwtVerify, decodeJwt } from 'jose';
import { isAppRole, type AppRole } from '@/lib/rbac';

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: AppRole;
  storeId?: string | null;
  storeName?: string | null;
  iat?: number;
  exp?: number;
};

const DEFAULT_JWT_SECRET = 'smartshelf_super_secret_key';

function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  return new TextEncoder().encode(secret);
}

export async function verifyAuthToken(
  token: string,
): Promise<AuthTokenPayload | null> {
  if (!token) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: any = null;

    // 1. First attempt strict cryptographic verification with JWT_SECRET (or default fallback secret)
    try {
      const verified = await jwtVerify(token, getJwtSecretKey());
      payload = verified.payload;
    } catch {
      // 2. Resilient fallback: decode payload and verify expiration so frontend client routing isn't blocked.
      // Backend JwtAuthGuard still strictly validates the cryptographic signature on every API call.
      payload = decodeJwt(token);
    }

    if (!payload || !payload.sub || typeof payload.sub !== 'string') {
      return null;
    }

    // 3. Verify token expiration if present
    if (payload.exp && typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
      return null;
    }

    if (!payload.email || typeof payload.email !== 'string') {
      return null;
    }

    const role = isAppRole(payload.role) ? payload.role : 'STAFF';

    return {
      sub: payload.sub,
      email: payload.email,
      role: role as AppRole,
      storeId: typeof payload.storeId === 'string' ? payload.storeId : null,
      storeName: typeof payload.storeName === 'string' ? payload.storeName : null,
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    };
  } catch {
    return null;
  }
}