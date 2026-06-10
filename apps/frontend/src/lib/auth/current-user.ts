import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth-config';
import { verifyAuthToken, type AuthTokenPayload } from '@/lib/auth/jwt';

export async function getCurrentUser(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
}