import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Reads the NextAuth JWT from the cookie (no DB call → edge-safe) and guards routes.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const approved = !!token && token.status === "approved" && !!token.role;
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/scoring");

  // Root → route based on auth state.
  if (pathname === "/") {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.redirect(new URL(approved ? "/dashboard" : "/auth/pending", request.url));
  }

  if (isProtected) {
    if (!token) {
      const url = new URL("/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    if (!approved) {
      return NextResponse.redirect(new URL("/auth/pending", request.url));
    }
  }

  // Signed-in approved users shouldn't sit on the login page.
  if (pathname === "/login" && approved) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
