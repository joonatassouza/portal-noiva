export type Locale = 'pt-BR' | 'es-LA' | 'en';

/**
 * Per-user preferences and contact info that live ALONGSIDE the Auth.js
 * identity record. The Auth.js `users` collection owns id/name/email/image.
 * We keep our own `profiles` collection for app-specific extensions.
 */
export interface Profile {
  /** Same id as the user in the auth provider. */
  userId: string;
  /** Optional override of the auth-provider display name. */
  displayName?: string;
  /**
   * E.164-formatted phone number (e.g. "+5541999999999"). Optional for
   * regular users; church admins are nudged to provide so visitors can reach
   * out. Stored without spaces or punctuation.
   */
  whatsappNumber?: string;
  /** Default locale shown to this user. */
  locale?: Locale;
  createdAt: Date;
  updatedAt: Date;
}
