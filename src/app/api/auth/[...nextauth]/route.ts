// Re-export the handlers created in `src/auth.ts`.
// That file initializes NextAuth and exposes the `handlers` object
// which already includes the `GET` and `POST` exports required by
// the Next.js app router. Re-exporting prevents double-initialization
// and avoids mismatched runtime shapes that can cause "r is not a function".

export { GET, POST } from '@/auth';
