import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isUnderDevelopmentRoute } from "./lib/under-development-routes";

export function proxy(request: NextRequest) {
  if (isUnderDevelopmentRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }
}

// Keep matcher paths in sync with UNDER_DEVELOPMENT_ROUTES in lib/under-development-routes.ts.
export const config = {
  matcher: ["/logs", "/logs/:path*"],
};
