import { NextResponse } from "next/server";
import { verifyJwtToken } from "./auth";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // 1. Skip middleware for internal stuff, homepage, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname === '/' ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Public routes (no login required)
  if (
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/projects") ||
    pathname === "/callback" ||
    pathname.match(/^\/[^/]+\/login$/) // Matches /[project]/login
  ) {
    return NextResponse.next();
  }

  // 3. Verify Token
  const token = req.cookies.get("jwt")?.value;
  let verifiedToken = null;

  if (token) {
    try {
      verifiedToken = await verifyJwtToken(token);
    } catch (err) {
      console.log("Token invalid:", err);
    }
  }

  // 4. If no token -> Redirect to Login
  if (!verifiedToken) {
    // If we are already on a login page, do nothing
    if (pathname.includes("/login")) {
      return NextResponse.next();
    }
    // Otherwise redirect to start page
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 5. If token is present:

  // If user visits login page but is already logged in -> Redirect to Bot
  if (pathname.includes("/login")) {
    if (verifiedToken.project) {
      return NextResponse.redirect(new URL(`/${verifiedToken.project}/bot`, req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Check API requests
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 6. Check access to project pages
  // URL format: /[projectAlias]/...
  const pathParts = pathname.split('/');
  // pathParts[0] is empty, [1] is project
  const requestedProject = pathParts[1];

  // Ignore technical paths that might have slipped through (like 'api' if not caught above)
  if (requestedProject === 'api' || requestedProject === 'callback') {
    return NextResponse.next();
  }

  // Check if user has access to this project
  if (verifiedToken.project === requestedProject || verifiedToken.admin === true) {
    return NextResponse.next();
  } else {
    // Wrong project -> Redirect to Home
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
