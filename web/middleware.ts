import { NextRequest, NextResponse } from "next/server";

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "";
const PUBLIC_PATHS = ["/api/health", "/api/telegram/callback", "/api/log", "/api/commands", "/api/commands/result", "/api/heartbeat", "/api/status", "/_next", "/favicon.ico", "/file.svg", "/globe.svg", "/next.svg", "/vercel.svg", "/window.svg"];
const CONTROL_PATHS = ["/api/commands", "/api/status"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes and static assets.
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protect dashboard control actions.
  if (request.method === "POST" && CONTROL_PATHS.some((p) => pathname.startsWith(p))) {
    // Already protected by X-Device-Secret in each route handler.
    return NextResponse.next();
  }

  // Production auth check for dashboard pages.
  if (DASHBOARD_PASSWORD) {
    const auth = request.cookies.get("dashboard_auth")?.value;
    if (auth !== DASHBOARD_PASSWORD) {
      const url = request.nextUrl.clone();
      if (pathname !== "/login") {
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image).*)",
};
