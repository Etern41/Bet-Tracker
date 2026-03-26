import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const appPrefixes = ["/dashboard", "/bets", "/settings"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAppRoute = appPrefixes.some((p) => path === p || path.startsWith(`${p}/`));
  if (!isAppRoute) return NextResponse.next();

  // Must match Auth.js cookie name: HTTPS → __Secure-authjs.session-token.
  const secureCookie = request.nextUrl.protocol === "https:";
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie,
  });

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/bets",
    "/bets/:path*",
    "/settings",
    "/settings/:path*",
  ],
};
