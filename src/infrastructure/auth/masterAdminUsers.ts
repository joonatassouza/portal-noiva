import { getDb } from '@/infrastructure/mongo/client';

interface UserDoc {
  _id: unknown;
  email?: string;
}

/**
 * Returns the user-ids (Auth.js's user._id as string) that match the
 * MASTER_ADMIN_EMAILS env list. Used by the notification fan-out to keep the
 * Master Admin's bell badge in sync with claim activity.
 *
 * Lives in infrastructure because it touches the auth users collection that
 * is owned by Auth.js. The application layer only sees the resolved ids.
 */
export async function resolveMasterAdminUserIds(): Promise<string[]> {
  const emails = (process.env.MASTER_ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) return [];

  const db = await getDb();
  const docs = await db
    .collection<UserDoc>('users')
    .find({ email: { $in: emails } })
    .toArray();
  return docs.map((d) => String(d._id));
}
