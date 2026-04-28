import { MongoClient, Db } from 'mongodb';

/**
 * Singleton MongoDB connection.
 * In dev (HMR) we cache the client on globalThis to avoid leaking sockets.
 */

const url = process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGO_DB ?? 'portal_noiva';

declare global {
  // eslint-disable-next-line no-var
  var __mongoClient: Promise<MongoClient> | undefined;
}

/**
 * Promise that resolves to the connected MongoClient.
 * Exposed for adapters that need the client directly (e.g. @auth/mongodb-adapter).
 */
export function getClient(): Promise<MongoClient> {
  if (!globalThis.__mongoClient) {
    globalThis.__mongoClient = new MongoClient(url, {
      serverSelectionTimeoutMS: 5000,
    }).connect();
  }
  return globalThis.__mongoClient;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName);
}

export async function closeMongo(): Promise<void> {
  if (globalThis.__mongoClient) {
    const client = await globalThis.__mongoClient;
    await client.close();
    globalThis.__mongoClient = undefined;
  }
}

/** Run once at boot/seed: create indexes the repos rely on. */
export async function ensureIndexes(): Promise<void> {
  const db = await getDb();
  await Promise.all([
    db.collection('churches').createIndex({ slug: 1 }, { unique: true }),
    db.collection('churches').createIndex({ country: 1, city: 1 }),
    db.collection('churches').createIndex({ name: 'text', description: 'text', city: 'text' }),
    // 2dsphere on a GeoJSON point for $near queries.
    db.collection('churches').createIndex({ geo: '2dsphere' }),

    db.collection('services').createIndex({ churchId: 1 }),
    // Recurrence is read in bulk by the upcoming-services projection,
    // so a dayOfWeek index isn't needed anymore.

    db.collection('events').createIndex({ churchId: 1 }),
    db.collection('events').createIndex({ startDatetime: 1, _id: 1 }),
    db.collection('events').createIndex({ churchId: 1, slug: 1 }, { unique: true }),

    db.collection('favorites').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('favorites').createIndex({ userId: 1, churchId: 1 }, { unique: true }),

    db.collection('church_roles').createIndex({ churchId: 1 }),
    db.collection('church_roles').createIndex({ userId: 1 }),
    db.collection('church_roles').createIndex({ churchId: 1, userId: 1 }, { unique: true }),

    db.collection('ownership_claims').createIndex({ status: 1, createdAt: 1 }),
    db.collection('ownership_claims').createIndex({ churchId: 1 }),
    db.collection('ownership_claims').createIndex({ claimantUserId: 1 }),

    db.collection('invitations').createIndex({ token: 1 }, { unique: true }),
    db.collection('invitations').createIndex({ churchId: 1 }),
    db.collection('invitations').createIndex({ email: 1 }),

    db.collection('volunteer_applications').createIndex({ eventId: 1, createdAt: -1 }),
    db.collection('volunteer_applications').createIndex({ churchId: 1, createdAt: -1 }),
    db.collection('volunteer_applications').createIndex(
      { eventId: 1, applicantUserId: 1 },
      { unique: true },
    ),

    db.collection('notifications').createIndex({ recipientUserId: 1, createdAt: -1 }),
    db.collection('notifications').createIndex({ recipientUserId: 1, readAt: 1 }),

    db.collection('church_proposals').createIndex({ status: 1, createdAt: 1 }),
    db.collection('church_proposals').createIndex({ proposerUserId: 1 }),

    db.collection('media_posts').createIndex({ churchId: 1, createdAt: -1 }),
    db.collection('media_posts').createIndex({ eventId: 1, createdAt: -1 }),

    db.collection('media_comments').createIndex({ mediaPostId: 1, createdAt: 1 }),

    db.collection('profiles').createIndex({ whatsappNumber: 1 }),
  ]);
}
