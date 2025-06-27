import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { env } from "@/env";

export async function middleware(request: NextRequest) {
  // Kontrola admin rout
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Povolit přístup k login stránce
    if (request.nextUrl.pathname === "/admin") {
      return NextResponse.next();
    }

    // Zkontrolovat session pro ostatní admin stránky
    const token = request.cookies.get("admin-session")?.value;
    const debugToken = request.cookies.get("admin-session-debug")?.value;

    const activeToken = token || debugToken;

    if (!activeToken) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    try {
      const secret = new TextEncoder().encode(env.JWT_SECRET);
      const { payload } = await jwtVerify(activeToken, secret);
      return NextResponse.next();
    } catch (error) {
      // Token je neplatný, přesměrovat na login
      const response = NextResponse.redirect(new URL("/admin", request.url));
      response.cookies.set("admin-session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
