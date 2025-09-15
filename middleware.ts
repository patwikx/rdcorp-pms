import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import {
  publicRoutes,
  authRoutes,
  apiAuthPrefix,
  DEFAULT_LOGIN_REDIRECT
} from "./routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
 
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
 
  // Allow API auth routes to pass through
  if (isApiAuthRoute) {
    return;
  }
 
  // Handle auth routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return; // Allow access to auth routes when not logged in
  }
 
  // Allow public routes for non-authenticated users
  if (!isLoggedIn && isPublicRoute) {
    return;
  }
 
  // Redirect non-authenticated users to sign-in for protected routes
  if (!isLoggedIn) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
   
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/auth/sign-in?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }
 
  // Handle root route - redirect authenticated users to setup
  if (nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }
 
  // Business unit context handling for authenticated users
  const requestHeaders = new Headers(req.headers);
 
  // Extract business unit ID from URL patterns like /[businessUnitId]/...
  // Only for business unit routes (not setup, api, etc.)
  const pathSegments = nextUrl.pathname.split('/').filter(Boolean);
  const potentialBusinessUnitId = pathSegments[0];
  
  // Check if this looks like a business unit route (UUID format)
  const isBusinessUnitRoute = potentialBusinessUnitId && 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(potentialBusinessUnitId);
 
  // Add business unit context to headers if it's a valid business unit route
  if (isBusinessUnitRoute) {
    requestHeaders.set('x-business-unit-id', potentialBusinessUnitId);
   
    // Add user context for additional security checks
    if (req.auth?.user?.id) {
      requestHeaders.set('x-user-id', req.auth.user.id);
    }

    // Check if user has access to the requested business unit
    if (req.auth?.user?.assignments) {
      const hasAccess = req.auth.user.assignments.some(
        assignment => assignment.businessUnitId === potentialBusinessUnitId
      );
     
      // If user doesn't have access to this business unit, redirect to setup
      if (!hasAccess) {
        return NextResponse.redirect(new URL('/setup?error=unauthorized', nextUrl));
      }
    }
  }
 
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};