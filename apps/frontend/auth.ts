import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

const connectionString = process.env.NEXT_PUBLIC_DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const auth = betterAuth({
  database: new Pool({ connectionString }),
  secret: process.env.NEXT_PUBLIC_BETTER_AUTH_SECRET || 'fallback-secret-for-dev',
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3847',
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  plugins: [],
  advanced: {
    disableCSRFCheck: true,
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
