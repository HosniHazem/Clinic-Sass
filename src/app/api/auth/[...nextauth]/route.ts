// Explicitly set Node.js runtime for auth handlers
export const runtime = 'nodejs';

// Import and re-export the GET and POST handlers from src/auth.ts
// These are now wrapped functions that handle errors gracefully
export { GET, POST } from '@/auth';
