import { NextRequest, NextResponse } from "next/server";

// Security headers applied to all API responses
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Cache-Control": "no-store, must-revalidate",
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(key)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

/**
 * CSP Violation Report Endpoint
 *
 * Receives Content Security Policy violation reports from browsers.
 * Logs reports for monitoring and analysis.
 * In production, forward to your security monitoring service.
 */

interface CSPReportBody {
  "csp-report": {
    "document-uri"?: string;
    "referrer"?: string;
    "blocked-uri"?: string;
    "violated-directive"?: string;
    "effective-directive"?: string;
    "original-policy"?: string;
    "source-file"?: string;
    "line-number"?: number;
    "column-number"?: number;
    "status-code"?: number;
    "script-sample"?: string;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CSPReportBody = await request.json();
    const report = body["csp-report"];

    if (!report) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Invalid report format" },
          { status: 400 }
        )
      );
    }

    // Log the violation (in production, send to monitoring service)
    const logEntry = {
      type: "csp-violation",
      timestamp: new Date().toISOString(),
      documentUri: report["document-uri"],
      blockedUri: report["blocked-uri"],
      violatedDirective: report["violated-directive"],
      effectiveDirective: report["effective-directive"],
      sourceFile: report["source-file"],
      lineNumber: report["line-number"],
      columnNumber: report["column-number"],
      scriptSample: report["script-sample"],
    };

    // Log to stderr for server-side log aggregation
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(logEntry));

    return applySecurityHeaders(
      NextResponse.json({ received: true }, { status: 204 })
    );
  } catch {
    return applySecurityHeaders(
      NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    );
  }
}

// Accept reports from any origin (browsers send reports cross-origin)
export async function OPTIONS(): Promise<NextResponse> {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  return new NextResponse(null, { status: 204, headers });
}
