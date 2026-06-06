import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 80;
const requestStore = new Map<string, { count: number; windowStart: number }>();

const PRIVATE_PATH_PREFIXES = [
  "/dashboard",
  "/knowledge",
  "/learning",
  "/labs",
  "/writeups",
  "/certifications",
  "/projects",
  "/toolkit",
  "/siem",
  "/inventory",
];

const PUBLIC_API_PREFIXES = ["/api/auth", "/api/health", "/api/public"];

function isPrivatePath(pathname: string) {
  return PRIVATE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicApi(pathname: string) {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
  );
}

function rateLimit(ip: string) {
  const now = Date.now();
  const record = requestStore.get(ip);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestStore.set(ip, { count: 1, windowStart: now });
    return true;
  }

  record.count += 1;
  requestStore.set(ip, record);
  return record.count <= RATE_LIMIT_MAX;
}

export async function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const pathname = request.nextUrl.pathname;

  const sessionToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  const needsPrivateSession = isPrivatePath(pathname) || (pathname.startsWith("/api") && !isPublicApi(pathname));

  if (needsPrivateSession && !sessionToken) {
    if (pathname.startsWith("/api")) {
      const unauthorizedResponse = NextResponse.json({ error: "Authentication required" }, { status: 401 });
      applySecurityHeaders(unauthorizedResponse);
      return unauthorizedResponse;
    }

    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(signinUrl);
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  if (pathname.startsWith("/api/audit") && sessionToken && !["OWNER", "ADMIN"].includes(String(sessionToken.role))) {
    const forbiddenResponse = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    applySecurityHeaders(forbiddenResponse);
    return forbiddenResponse;
  }

  if (pathname.startsWith("/api") && !rateLimit(ip)) {
    const response = NextResponse.json(
      { error: "Too many requests. Please retry later." },
      { status: 429 }
    );
    applySecurityHeaders(response);
    return response;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
