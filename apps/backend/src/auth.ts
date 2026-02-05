/// <reference types="node" />
import { type Request, type Response, type NextFunction } from 'express';
import { prisma } from './db.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'SPONSOR' | 'PUBLISHER' | null;
    sponsorId?: string;
    publisherId?: string;
  };
}

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || 'http://localhost:3847';

interface BetterAuthSessionResponse {
  user?: { id: string; email?: string; name?: string };
  session?: unknown;
}

async function fetchSessionFromNext(cookieHeader: string | undefined): Promise<BetterAuthSessionResponse | null> {
  if (!cookieHeader) return null;
  const url = `${BETTER_AUTH_URL}/api/auth/get-session`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as BetterAuthSessionResponse;
  return data?.user ? data : null;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const cookieHeader = (req as Request).headers?.cookie;
  const sessionData = await fetchSessionFromNext(cookieHeader);

  if (!sessionData?.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { id, email } = sessionData.user;
  const sponsor = await prisma.sponsor.findUnique({
    where: { userId: id },
    select: { id: true },
  });
  if (sponsor) {
    req.user = {
      id,
      email: email ?? '',
      role: 'SPONSOR',
      sponsorId: sponsor.id,
    };
    next();
    return;
  }

  const publisher = await prisma.publisher.findUnique({
    where: { userId: id },
    select: { id: true },
  });
  if (publisher) {
    req.user = {
      id,
      email: email ?? '',
      role: 'PUBLISHER',
      publisherId: publisher.id,
    };
    next();
    return;
  }

  req.user = {
    id,
    email: email ?? '',
    role: null,
  };
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void | Promise<void> {
  return authMiddleware(req, res, next);
}

export function roleMiddleware(allowedRoles: Array<'SPONSOR' | 'PUBLISHER'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role === null || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
