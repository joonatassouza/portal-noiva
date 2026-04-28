// Moved to src/auth.ts so it sits under the standard `@/` alias.
// Re-export kept temporarily for any tooling expecting the file at the root.
export { handlers, auth, signIn, signOut } from '@/auth';
