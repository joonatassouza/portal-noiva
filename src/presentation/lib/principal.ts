import { auth } from '@/auth';
import { Principal } from '@/domain/policies/access';

/**
 * Reads the current Auth.js session and converts it into a domain Principal.
 * Lives in presentation because session is a presentation concern.
 */
export async function getPrincipal(): Promise<Principal | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  return {
    userId: session.user.id,
    email: session.user.email,
    isMasterAdmin: Boolean(session.user.isMasterAdmin),
  };
}
