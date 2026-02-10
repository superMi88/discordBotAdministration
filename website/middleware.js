import { NextResponse } from "next/server";
import { verifyJwtToken } from "./auth";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 1. Öffentliche Routen (kein Login nötig)
  if (
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/projects") ||
    pathname === "/admin/callback" ||
    pathname.match(/^\/admin\/[^/]+\/login$/) // Allow /admin/[project]/login
  ) {
    return NextResponse.next();
  }

  // 2. Token prüfen
  const token = req.cookies.get("jwt")?.value;
  let verifiedToken = null;

  if (token) {
    try {
      verifiedToken = await verifyJwtToken(token);
    } catch (err) {
      console.log("Token invalid:", err);
    }
  }

  // 3. Wenn kein Token da ist -> Redirect zum Login
  if (!verifiedToken) {
    // Wenn wir schon auf einer Login-Seite sind, nichts tun (vermeidet Loop)
    if (pathname.includes("/login")) {
      return NextResponse.next();
    }
    // Sonst redirect zur Startseite oder einer generischen Login-Seite
    // Hier schicken wir ihn zur Startseite, wo er ein Projekt auswählen kann
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. Wenn Token da ist:

  // Wenn User auf /admin/login oder /admin/[project]/login geht, aber schon eingeloggt ist -> Redirect zum Bot
  if (pathname.includes("/login")) {
    if (verifiedToken.project) {
      return NextResponse.redirect(new URL(`/admin/${verifiedToken.project}/bot`, req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Api Requests prüfen
  if (pathname.startsWith("/api/")) {
    return NextResponse.next(); // Hier könnte man noch strengere Checks machen
  }

  // Zugriff auf Projekt-Seiten prüfen
  // URL: /admin/[projectAlias]/...
  const adminProjectMatch = pathname.match(/^\/admin\/([^/]+)/);
  if (adminProjectMatch) {
    const requestedProject = adminProjectMatch[1];

    // Darf der User auf dieses Projekt zugreifen?
    // Im neuen Token steht 'project' (String), nicht mehr 'projects' (Array)
    if (verifiedToken.project === requestedProject || verifiedToken.admin === true) {
      return NextResponse.next();
    } else {
      // Falsches Projekt -> Redirect zur Startseite oder Fehler
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
