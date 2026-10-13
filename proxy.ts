import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, userFromToken } from "@/lib/auth";

// Sends signed-out visitors (or stale sessions) to /login.
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") return NextResponse.next();
  if (await userFromToken(request.cookies.get(COOKIE)?.value)) return NextResponse.next();
  const res = NextResponse.redirect(new URL("/login", request.url));
  res.cookies.delete(COOKIE);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\\.js|icon|apple-icon|.*\\.png$).*)"],
};
