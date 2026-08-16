export const UNDER_DEVELOPMENT_ROUTES = ["/attendance", "/logs"] as const;

export type UnderDevelopmentRoute = (typeof UNDER_DEVELOPMENT_ROUTES)[number];

export function isUnderDevelopmentRoute(pathname: string): boolean {
  return UNDER_DEVELOPMENT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
