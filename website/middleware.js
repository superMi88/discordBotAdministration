import { NextResponse } from "next/server";
import { verifyJwtToken } from "/auth";

export async function middleware(req) {
  const url = req.nextUrl;

  const token = req.cookies.get("jwt")?.value;
  let verifiedToken = null;
  if (token) {
    try {
      verifiedToken = await verifyJwtToken(token);
    } catch (err) {
      console.log("Token verification failed:", err);
    }
  }

  if (url.pathname === "/api/login") {
    return NextResponse.next();
  }

  if (url.pathname.startsWith("/api/")) {
    if (verifiedToken) {
      const contentType = req.headers.get("content-type") || "";
      // Falls der Request JSON sendet, parsen wir den Body
      if (contentType.includes("application/json")) {
        const rawBody = await req.text();
        let body;
        try {
          body = JSON.parse(rawBody);
        } catch (err) {
          return new NextResponse(
            JSON.stringify({ message: "Invalid JSON format" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const projectAlias = body.projectAlias;
        if (!verifiedToken.projects.includes(projectAlias)) {
          return new NextResponse(
            JSON.stringify({ message: "Access denied, user doesn't have access to this project" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }
      }
      // Bei anderen Content-Types (z. B. multipart/form-data) überspringen wir den JSON-Parsing-Block
      return NextResponse.next();
    } else {
      return new NextResponse(
        JSON.stringify({ message: "Invalid or missing token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  if (url.pathname === "/admin/login") {
    if (verifiedToken) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  if (!verifiedToken) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (verifiedToken && verifiedToken.admin === true) {
    return NextResponse.next();
  }

  if (verifiedToken && Array.isArray(verifiedToken.projects)) {
    for (const project of verifiedToken.projects) {
      if (url.pathname.startsWith(`/admin/${project}/`)) {
        return NextResponse.next();
      }
    }
  }

  if (url.pathname === "/admin") {
    return NextResponse.next();
  }
  
  return NextResponse.redirect(new URL("/admin", req.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
