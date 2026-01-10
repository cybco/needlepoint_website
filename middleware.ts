import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

/* Old File
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  let token = null;
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
  } catch (error) {
    // If token parsing fails, treat as unauthenticated
    console.error("Token parsing failed:", error);
    token = null;
  }

  // Protected paths that require authentication
  const protectedPaths = [
    /\/shipping-address/,
    /\/payment-method/,
    /\/place-order/,
    /\/profile/,
    /\/user\/(.*)/,
    /\/order\/(.*)/,
    /\/admin/,
  ];

  // Check if user is not authenticated and accessing a protected path
  if (!token && protectedPaths.some((p) => p.test(pathname))) {
    // Avoid infinite redirects by checking if already on auth pages
    if (pathname === "/sign-in" || pathname === "/sign-up") {
      return NextResponse.next();
    }
    
    try {
      const signInUrl = new URL("/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    } catch (error) {
      // Fallback if URL construction fails
      console.error("Redirect URL construction failed:", error);
      return NextResponse.next();
    }
  }

  // Check for session cart cookie
  if (!request.cookies.get("sessionCartId")) {
    const sessionCartId = crypto.randomUUID();
    const response = NextResponse.next();
    response.cookies.set("sessionCartId", sessionCartId);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
*/
