/**
 * Shared API utilities for Next.js App Router API routes
 */
import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { DEMO_USERS, type DemoUser } from "@/src/data/demo-users";

type ApiUserRole = DemoUser["role"];

export interface AuthContext {
  user: DemoUser;
  orgId: string;
}

// ---------------------------------------------------------------------------
// Security Headers (applied to all API responses)
// ---------------------------------------------------------------------------

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Cache-Control": "no-store, must-revalidate",
  "X-DNS-Prefetch-Control": "off",
  "X-Download-Options": "noopen",
};

/**
 * Apply security headers to a Headers object.
 * Centralises header injection so every API response carries the same
 * baseline protections against MIME-sniffing, clickjacking, and
 * information leakage regardless of which route helper created it.
 */
function applySecurityHeaders(headers: Headers): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
}

/**
 * Apply security headers to a plain Record<string, string>.
 * Used for helpers that construct headers as an object (e.g. sseStream).
 */
function getSecurityHeadersObject(): Record<string, string> {
  return { ...SECURITY_HEADERS };
}

/**
 * Determine safe CORS origin from request.
 * Reflects the request origin only if it matches the allowlist.
 */
export function getCorsOrigin(req: NextRequest): string {
  const allowed = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,https://localhost:3000").split(",").map((o) => o.trim()).filter(Boolean);
  const origin = req.headers.get("origin") || "";
  if (allowed.includes(origin)) return origin;
  return allowed[0] || "";
}

/**
 * Extract auth context from request. Returns context or a NextResponse error.
 */
export function getAuthContext(
  req: NextRequest,
  requiredRole?: ApiUserRole
): AuthContext | NextResponse {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token || !token.startsWith("tok_")) {
    return errorResponse("Unauthorized", 401, undefined, req);
  }

  const extracted = token.split("_")[1];
  if (!extracted) {
    return errorResponse("Unauthorized", 401, undefined, req);
  }
  const userId = extracted;

  const user = DEMO_USERS.find((u) => u.id === userId);
  if (!user) {
    return errorResponse("Unauthorized", 401, undefined, req);
  }

  if (requiredRole) {
    const roleHierarchy: Record<ApiUserRole, number> = {
      admin: 3,
      analyst: 2,
      engineer: 1,
    };
    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      return errorResponse("Forbidden — insufficient permissions", 403, undefined, req);
    }
  }

  return { user, orgId: user.orgId };
}

/**
 * Simulated auth wrapper for route handlers.
 * Preserves the Next.js App Router (request, context) signature.
 */
export function withAuth<T>(
  handler: (req: NextRequest, ctx: AuthContext, context: { params: any }) => Promise<T>,
  requiredRole?: ApiUserRole
): (req: NextRequest, context: { params: any }) => Promise<T | NextResponse> {
  return async (req: NextRequest, context: { params: any }): Promise<T | NextResponse> => {
    const auth = getAuthContext(req, requiredRole);
    if (auth instanceof NextResponse) return auth;
    return handler(req, auth, context);
  };
}

export function withErrorHandler<T>(
  handler: (req: NextRequest, context: { params: any }) => Promise<T | NextResponse>
): (req: NextRequest, context: { params: any }) => Promise<T | NextResponse> {
  return async (req: NextRequest, context: { params: any }): Promise<T | NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("API Error:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return errorResponse(message, 500, undefined, req);
    }
  };
}

/**
 * Parse integer with NaN guard; returns defaultValue if input is missing or invalid.
 */
export function safeParseInt(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function jsonResponse(body: unknown, status = 200, extraHeaders?: Record<string, string>, req?: NextRequest): NextResponse {
  const allowedOrigin = req ? getCorsOrigin(req) : "";
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-RateLimit-Limit": "1000",
    "X-RateLimit-Remaining": "998",
    "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3600),
    ...extraHeaders,
  });
  applySecurityHeaders(headers);
  return NextResponse.json(body, { status, headers });
}


export function errorResponse(
  message: string,
  status: number,
  details?: Array<{ field: string; message: string }>,
  req?: NextRequest
): NextResponse {
  const codeMap: Record<number, string> = {
    400: "VALIDATION_ERROR",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
    502: "PROVIDER_ERROR",
    503: "SERVICE_UNAVAILABLE",
  };
  const body = {
    error: {
      code: codeMap[status] || "INTERNAL_ERROR",
      message,
      status,
      details: details || [],
      requestId: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    },
  };
  return jsonResponse(body, status, undefined, req);
}
export function sseStream(
  generator: (send: (event: string, data: unknown) => void, close: () => void) => Promise<void> | void,
  req?: NextRequest
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        const eventId = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const payload = JSON.stringify(data);
        const chunk = `id: ${eventId}\nevent: ${event}\ndata: ${payload}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      const close = () => {
        if (closed) return;
        closed = true;
        controller.close();
      };

      try {
        await generator(send, close);
      } catch (err) {
        if (!closed) {
          send("error", { message: err instanceof Error ? err.message : "Stream error" });
          close();
        }
      }
    },
  });

  // Build headers: security baseline first, then SSE-specific overrides
  // so that SSE Cache-Control (no-cache, no-transform) wins over
  // the default no-store from the security set.
  const sseHeaders: Record<string, string> = {
    ...getSecurityHeadersObject(),
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": req ? getCorsOrigin(req) : "",
  };

  return new Response(stream, {
    headers: sseHeaders,
  });
}

export async function validateRequest<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { success: false, response: errorResponse("Invalid JSON body", 400, undefined, req) };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      response: errorResponse(
        "Validation failed",
        400,
        result.error.issues.map((issue: any) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
        req
      ),
    };
  }

  return { success: true, data: result.data };
}

export function parseQueryParams(req: NextRequest): Record<string, string> {
  const url = new URL(req.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export function corsPreflight(req?: NextRequest): NextResponse {
  const headers = new Headers({
    "Access-Control-Allow-Origin": req ? getCorsOrigin(req) : "",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  applySecurityHeaders(headers);
  return new NextResponse(null, { status: 204, headers });
}
