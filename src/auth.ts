import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';

import { getClient } from '@/infrastructure/mongo/client';

const masterAdminEmails = (process.env.MASTER_ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/**
 * Auth.js v5 configuration.
 *
 * Lives directly under `src/` (not under presentation/) because Auth.js needs
 * to be importable from middleware, route handlers, RSCs, server actions and
 * pages alike — hex layers below are unaware of it. Use cases read the user-id
 * from a session that the presentation layer extracts.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(getClient(), {
    databaseName: process.env.MONGO_DB ?? 'portal_noiva',
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // JWT keeps things simple — no per-request session lookup against Mongo.
  session: { strategy: 'jwt' },
  // Auth.js infers AUTH_SECRET from env automatically.
  callbacks: {
    /**
     * On first sign-in the adapter has just persisted the user; we copy its id
     * into the JWT so server components can read it without an extra DB hit.
     */
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.uid && session.user) {
        session.user.id = token.uid as string;
        const email = session.user.email?.toLowerCase();
        session.user.isMasterAdmin = email ? masterAdminEmails.includes(email) : false;
      }
      return session;
    },
  },
});
