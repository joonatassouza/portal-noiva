// Moved to /src/app/_actions/upcoming.ts so it's importable via a path alias
// without a `[locale]` segment that breaks TS path resolution.
// This file is kept only as a compatibility re-export and can be deleted.
'use server';

export { fetchUpcomingServices, fetchUpcomingEvents } from '@/app/_actions/upcoming';
