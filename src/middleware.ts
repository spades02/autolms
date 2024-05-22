 
// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.

import { authMiddleware } from "@clerk/nextjs/server";

// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({
    // "/" will be accessible to all users
    publicRoutes: [
      "/",
      '/api/webhook/clerk',
      '/api/webhook/stripe',
      "/community",
      "/api/convert",
      "/api/audio-text",
    ],
    ignoredRoutes: [
    ],
  });
 
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
 