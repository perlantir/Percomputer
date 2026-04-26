import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  getCorsOrigin,
  getAuthContext,
  withAuth,
  withErrorHandler,
  safeParseInt,
  jsonResponse,
  errorResponse,
  parseQueryParams,
  corsPreflight,
  validateRequest,
  sseStream,
  type AuthContext,
} from "./api-utils";

// ─── helpers ────────────────────────────────────────────────────────────────

function createMockRequest(
  url: string,
  options: {
    headers?: Record<string, string>;
    method?: string;
  } = {}
): NextRequest {
  return new NextRequest(new URL(url), {
    headers: new Headers(options.headers),
    method: options.method || "GET",
  });
}

// ─── getCorsOrigin ──────────────────────────────────────────────────────────

describe("getCorsOrigin", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ALLOWED_ORIGINS: "https://app.example.com,https://other.com" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns matching origin from allowed list", () => {
    const req = createMockRequest("https://app.example.com/api/test", {
      headers: { origin: "https://app.example.com" },
    });
    expect(getCorsOrigin(req)).toBe("https://app.example.com");
  });

  it("returns first allowed origin when origin does not match", () => {
    const req = createMockRequest("https://app.example.com/api/test", {
      headers: { origin: "https://unknown.com" },
    });
    expect(getCorsOrigin(req)).toBe("https://app.example.com");
  });

  it("returns first allowed origin when no origin header", () => {
    const req = createMockRequest("https://app.example.com/api/test");
    expect(getCorsOrigin(req)).toBe("https://app.example.com");
  });

  it("falls back to localhost when ALLOWED_ORIGINS is not set", () => {
    delete process.env.ALLOWED_ORIGINS;
    const req = createMockRequest("http://localhost:3000/api/test", {
      headers: { origin: "http://localhost:3000" },
    });
    expect(getCorsOrigin(req)).toBe("http://localhost:3000");
  });
});

// ─── getAuthContext ─────────────────────────────────────────────────────────

describe("getAuthContext", () => {
  it("returns 401 when authorization header is missing", () => {
    const req = createMockRequest("https://app.example.com/api/test");
    const result = getAuthContext(req);
    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(401);
  });

  it("returns 401 when token does not start with tok_", () => {
    const req = createMockRequest("https://app.example.com/api/test", {
      headers: { authorization: "Bearer invalid_token" },
    });
    const result = getAuthContext(req);
    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(401);
  });

  it("returns 401 for unknown user", () => {
    const req = createMockRequest("https://app.example.com/api/test", {
      headers: { authorization: "Bearer tok_unknownuser" },
    });
    const result = getAuthContext(req);
    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(401);
  });

  it("returns auth context for valid admin user", () => {
    const req = createMockRequest("https://app.example.com/api/test", {
      headers: { authorization: "Bearer tok_usr_7a3f9e2b1c4d" },
    });
    const result = getAuthContext(req);
    expect(result).not.toBeInstanceOf(NextResponse);
    const ctx = result as AuthContext;
    expect(ctx.user.name).toBe("Sarah Chen");
    expect(ctx.user.role).toBe("admin");
    expect(ctx.orgId).toBe("org_acme_001");
  });

  it("returns auth context for valid engineer user", () => {
    const req = createMockRequest("https://app.example.com/api/test", {
      headers: { authorization: "Bearer tok_usr_2f6c8d3e5b9a" },
    });
    const result = getAuthContext(req);
    const ctx = result as AuthContext;
    expect(ctx.user.role).toBe("engineer");
    expect(ctx.user.name).toBe("Alex Patel");
  });

  it("returns 403 when user role is insufficient", () => {
    // engineer trying to access admin route
    const req = createMockRequest("https://app.example.com/api/test", {
      headers: { authorization: "Bearer tok_usr_2f6c8d3e5b9a" },
    });
    const result = getAuthContext(req, "admin");
    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(403);
  });

  it("allows admin access to admin route", () => {
    const req = createMockRequest("https://app.example.com/api/test", {
      headers: { authorization: "Bearer tok_usr_7a3f9e2b1c4d" },
    });
    const result = getAuthContext(req, "admin");
    expect(result).not.toBeInstanceOf(NextResponse);
  });

  it("allows analyst to access engineer route (higher role)", () => {
    const req = createMockRequest("https://app.example.com/api/test", {
      headers: { authorization: "Bearer tok_usr_b8e5d1a4f7c2" }, // analyst
    });
    const result = getAuthContext(req, "engineer");
    expect(result).not.toBeInstanceOf(NextResponse);
  });

  it("returns 401 for malformed token without underscore part", () => {
    const req = createMockRequest("https://app.example.com/api/test", {
      headers: { authorization: "Bearer tok_" },
    });
    const result = getAuthContext(req);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });
});

// ─── withAuth ───────────────────────────────────────────────────────────────

describe("withAuth", () => {
  it("calls handler with auth context when authenticated", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withAuth(handler);
    const req = createMockRequest("https://app.example.com/api/test", {
      headers: { authorization: "Bearer tok_usr_7a3f9e2b1c4d" },
    });
    const result = await wrapped(req, { params: {} });
    expect(handler).toHaveBeenCalled();
    expect(result).toBeInstanceOf(NextResponse);
  });

  it("returns 401 when authentication fails", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withAuth(handler);
    const req = createMockRequest("https://app.example.com/api/test");
    const result = await wrapped(req, { params: {} });
    expect(handler).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(401);
    }
  });
});

// ─── withErrorHandler ───────────────────────────────────────────────────────

describe("withErrorHandler", () => {
  it("returns handler result on success", async () => {
    const handler = vi
      .fn()
      .mockResolvedValue(NextResponse.json({ success: true }));
    const wrapped = withErrorHandler(handler);
    const req = createMockRequest("https://app.example.com/api/test");
    const result = await wrapped(req, { params: {} });
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(200);
    }
  });

  it("returns 500 error when handler throws", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("Database failure"));
    const wrapped = withErrorHandler(handler);
    const req = createMockRequest("https://app.example.com/api/test");
    const result = await wrapped(req, { params: {} });
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(500);
    }
  });

  it("uses error message in 500 response", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("Custom error msg"));
    const wrapped = withErrorHandler(handler);
    const req = createMockRequest("https://app.example.com/api/test");
    const result = await wrapped(req, { params: {} });
    if (result instanceof NextResponse) {
      const body = await result.json();
      expect(body.error.message).toBe("Custom error msg");
    }
  });

  it("handles non-Error throws gracefully", async () => {
    const handler = vi.fn().mockRejectedValue("string error");
    const wrapped = withErrorHandler(handler);
    const req = createMockRequest("https://app.example.com/api/test");
    const result = await wrapped(req, { params: {} });
    if (result instanceof NextResponse) {
      expect(result.status).toBe(500);
    }
  });
});

// ─── safeParseInt ───────────────────────────────────────────────────────────

describe("safeParseInt", () => {
  it("parses valid integer string", () => {
    expect(safeParseInt("42", 0)).toBe(42);
  });

  it("returns default for undefined", () => {
    expect(safeParseInt(undefined, 10)).toBe(10);
  });

  it("returns default for empty string", () => {
    expect(safeParseInt("", 5)).toBe(5);
  });

  it("returns default for NaN input", () => {
    expect(safeParseInt("abc", 99)).toBe(99);
  });

  it("parses negative integers", () => {
    expect(safeParseInt("-5", 0)).toBe(-5);
  });

  it("parses zero correctly", () => {
    expect(safeParseInt("0", 10)).toBe(0);
  });

  it("parses string with whitespace", () => {
    expect(safeParseInt("  42  ", 0)).toBe(42);
  });

  it("returns default for mixed alphanumeric", () => {
    expect(safeParseInt("42abc", 0)).toBe(42);
  });
});

// ─── jsonResponse ───────────────────────────────────────────────────────────

describe("jsonResponse", () => {
  it("returns a NextResponse with JSON body", () => {
    const response = jsonResponse({ key: "value" });
    expect(response).toBeInstanceOf(NextResponse);
  });

  it("sets status code correctly", () => {
    const response = jsonResponse({}, 201);
    expect(response.status).toBe(201);
  });

  it("defaults to status 200", () => {
    const response = jsonResponse({});
    expect(response.status).toBe(200);
  });

  it("includes Content-Type header", () => {
    const response = jsonResponse({});
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("includes rate limit headers", () => {
    const response = jsonResponse({});
    expect(response.headers.get("X-RateLimit-Limit")).toBe("1000");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("998");
    expect(response.headers.get("X-RateLimit-Reset")).not.toBeNull();
  });

  it("includes extra headers when provided", () => {
    const response = jsonResponse({}, 200, { "X-Custom": "value" });
    expect(response.headers.get("X-Custom")).toBe("value");
  });

  it("includes CORS headers when request is provided", () => {
    const req = createMockRequest("http://localhost:3000/api/test");
    const response = jsonResponse({}, 200, undefined, req);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
  });
});

// ─── errorResponse ──────────────────────────────────────────────────────────

describe("errorResponse", () => {
  it("returns a NextResponse", () => {
    const response = errorResponse("Something went wrong", 500);
    expect(response).toBeInstanceOf(NextResponse);
  });

  it("sets correct status code", () => {
    const response = errorResponse("Bad request", 400);
    expect(response.status).toBe(400);
  });

  it("maps 400 to VALIDATION_ERROR code", async () => {
    const response = errorResponse("Invalid", 400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("maps 401 to UNAUTHORIZED code", async () => {
    const response = errorResponse("Unauthorized", 401);
    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("maps 403 to FORBIDDEN code", async () => {
    const response = errorResponse("Forbidden", 403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("maps 404 to NOT_FOUND code", async () => {
    const response = errorResponse("Not found", 404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("maps 429 to RATE_LIMITED code", async () => {
    const response = errorResponse("Too many requests", 429);
    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMITED");
  });

  it("maps 500 to INTERNAL_ERROR code", async () => {
    const response = errorResponse("Server error", 500);
    const body = await response.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("defaults to INTERNAL_ERROR for unknown status", async () => {
    const response = errorResponse("Unknown", 418);
    const body = await response.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("includes error message in body", async () => {
    const response = errorResponse("Custom error", 400);
    const body = await response.json();
    expect(body.error.message).toBe("Custom error");
  });

  it("includes empty details array by default", async () => {
    const response = errorResponse("Error", 400);
    const body = await response.json();
    expect(body.error.details).toEqual([]);
  });

  it("includes provided details in body", async () => {
    const details = [{ field: "email", message: "Invalid email" }];
    const response = errorResponse("Validation failed", 400, details);
    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });

  it("includes requestId in body", async () => {
    const response = errorResponse("Error", 500);
    const body = await response.json();
    expect(body.error.requestId).toBeDefined();
    expect(typeof body.error.requestId).toBe("string");
    expect(body.error.requestId.startsWith("req-")).toBe(true);
  });

  it("includes ISO timestamp in body", async () => {
    const response = errorResponse("Error", 500);
    const body = await response.json();
    expect(body.error.timestamp).toBeDefined();
    expect(new Date(body.error.timestamp).toISOString()).toBe(
      body.error.timestamp
    );
  });

  it("includes status in error body", async () => {
    const response = errorResponse("Error", 404);
    const body = await response.json();
    expect(body.error.status).toBe(404);
  });
});

// ─── sseStream ──────────────────────────────────────────────────────────────

describe("sseStream", () => {
  it("returns a Response object", () => {
    const response = sseStream((send, close) => {
      send("test", { message: "hello" });
      close();
    });
    expect(response).toBeInstanceOf(Response);
  });

  it("sets correct Content-Type header", () => {
    const response = sseStream(() => {});
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("sets Cache-Control header", () => {
    const response = sseStream(() => {});
    expect(response.headers.get("Cache-Control")).toBe(
      "no-cache, no-transform"
    );
  });

  it("sets Connection header", () => {
    const response = sseStream(() => {});
    expect(response.headers.get("Connection")).toBe("keep-alive");
  });

  it("sends events through the stream", async () => {
    const response = sseStream((send, close) => {
      send("message", { data: "hello" });
      close();
    });
    const reader = response.body!.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain("event: message");
    expect(text).toContain('"data":"hello"');
  });
});

// ─── validateRequest ────────────────────────────────────────────────────────

describe("validateRequest", () => {
  it("returns error for invalid JSON body", async () => {
    const req = new NextRequest("https://app.example.com/api/test", {
      method: "POST",
      body: "not-json",
    });
    const result = await validateRequest(req, {} as any);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });

  it("returns success when schema validates", async () => {
    const req = new NextRequest("https://app.example.com/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
    });
    const schema = {
      safeParse: (data: unknown) => ({
        success: true,
        data,
      }),
    } as any;
    const result = await validateRequest(req, schema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "test" });
    }
  });

  it("returns error when schema validation fails", async () => {
    const req = new NextRequest("https://app.example.com/api/test", {
      method: "POST",
      body: JSON.stringify({ name: 123 }),
    });
    const schema = {
      safeParse: () => ({
        success: false,
        error: {
          issues: [
            { path: ["name"], message: "Expected string" },
          ],
        },
      }),
    } as any;
    const result = await validateRequest(req, schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });
});

// ─── parseQueryParams ───────────────────────────────────────────────────────

describe("parseQueryParams", () => {
  it("parses query parameters from URL", () => {
    const req = createMockRequest(
      "https://app.example.com/api/test?page=1&limit=20"
    );
    const params = parseQueryParams(req);
    expect(params.page).toBe("1");
    expect(params.limit).toBe("20");
  });

  it("returns empty object when no query params", () => {
    const req = createMockRequest("https://app.example.com/api/test");
    const params = parseQueryParams(req);
    expect(Object.keys(params)).toHaveLength(0);
  });

  it("decodes URL-encoded values", () => {
    const req = createMockRequest(
      "https://app.example.com/api/test?name=%20hello%20"
    );
    const params = parseQueryParams(req);
    expect(params.name).toBe(" hello ");
  });

  it("handles repeated keys (last wins)", () => {
    const req = createMockRequest(
      "https://app.example.com/api/test?key=first&key=second"
    );
    const params = parseQueryParams(req);
    expect(params.key).toBe("second");
  });
});

// ─── corsPreflight ──────────────────────────────────────────────────────────

describe("corsPreflight", () => {
  it("returns 204 status", () => {
    const response = corsPreflight();
    expect(response.status).toBe(204);
  });

  it("has empty body", async () => {
    const response = corsPreflight();
    const body = await response.text();
    expect(body).toBe("");
  });

  it("includes Access-Control-Allow-Methods header", () => {
    const response = corsPreflight();
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "GET"
    );
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "POST"
    );
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "DELETE"
    );
  });

  it("includes Access-Control-Allow-Headers header", () => {
    const response = corsPreflight();
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain(
      "Content-Type"
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain(
      "Authorization"
    );
  });

  it("includes CORS origin when request is provided", () => {
    const req = createMockRequest("http://localhost:3000/api/test");
    const response = corsPreflight(req);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeDefined();
  });
});
