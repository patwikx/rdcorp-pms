/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = [
  "/auth/new-verification",
  "/api/uploadthing"
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to the default redirect
 * @type {string[]}
 */
export const authRoutes = [
  "/auth/sign-in",
  "/auth/register",
  "/auth/error",
  "/auth/reset",
  "/auth/new-password"
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in
 * Users will be redirected here to select their business unit context
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/setup";

/**
 * Protected route patterns for the property management system
 * These routes require both authentication and business unit context
 * @type {string[]}
 */
export const protectedRoutePatterns = [
  "/properties",
  "/releases", 
  "/turnovers",
  "/returns",
  "/approvals",
  "/reports",
  "/users",
  "/roles",
  "/audit"
];

/**
 * Admin-only route patterns
 * These routes require admin permissions
 * @type {string[]}
 */
export const adminRoutePatterns = [
  "/admin",
  "/business-units",
  "/system-settings"
];

/**
 * Routes that don't require business unit context
 * These are accessible to authenticated users without business unit selection
 * @type {string[]}
 */
export const contextFreeRoutes = [
  "/setup",
  "/profile",
  "/settings",
  "/help"
];