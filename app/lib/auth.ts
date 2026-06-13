import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import * as R from './response';

export interface AuthUser {
  userId: number;
  email: string;
  roleId: number | null;
  roleName: string;
  prodiId: number | null;
}

interface JwtPayload {
  userId: string;
  email: string;
  roleId: string | null;
  roleName: string;
  prodiId: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

// Sign a JWT token
export const signToken = (payload: {
  userId: string;
  email: string;
  roleId: string | null;
  roleName: string;
  prodiId: string | null;
}): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt.sign as any)(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }) as string;
};

// Verify token from Authorization header and return AuthUser or a Response error
export const authenticate = (
  request: NextRequest,
): AuthUser | Response => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return R.unauthorized('Token tidak ditemukan');
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return {
      userId: Number(decoded.userId),
      email: decoded.email,
      roleId: decoded.roleId ? Number(decoded.roleId) : null,
      roleName: decoded.roleName,
      prodiId: decoded.prodiId ? Number(decoded.prodiId) : null,
    };
  } catch {
    return R.unauthorized('Token tidak valid atau sudah expired');
  }
};

// Guard: check if AuthUser has one of the allowed roles
export const authorize = (user: AuthUser, ...roles: string[]): Response | null => {
  const allowed = roles.map((r) => r.toLowerCase());
  if (!allowed.includes(user.roleName.toLowerCase())) {
    return R.forbidden(`Akses ditolak. Diperlukan role: ${roles.join(' atau ')}`);
  }
  return null;
};

// Helper: run authenticate + authorize in one call
// Returns { user } or { error: Response }
export const guard = (
  request: NextRequest,
  ...roles: string[]
): { user: AuthUser; error?: undefined } | { user?: undefined; error: Response } => {
  const result = authenticate(request);
  if (result instanceof Response) return { error: result };
  if (roles.length > 0) {
    const denied = authorize(result, ...roles);
    if (denied) return { error: denied };
  }
  return { user: result };
};
