/**
 * GET /api/billing — Billing info
 */
import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, jsonResponse, corsPreflight } from "@/src/lib/api-utils";
const mockBilling = {
  plan: "pro",
  billing_period: "monthly",
  seats: 5,
  seat_price: 49,
  total_monthly: 245,
  credits_included: 1000,
  credits_overage_rate: 0.05,
  current_usage: {
    credits_used: 678.4,
    credits_remaining: 321.6,
    projected_monthly_total: 892,
  },
  invoices: [
    {
      id: "inv-2024-06",
      period: "June 2024",
      amount: 245,
      status: "paid",
      paid_at: "2024-06-01T00:00:00Z",
    },
    {
      id: "inv-2024-05",
      period: "May 2024",
      amount: 320,
      status: "paid",
      paid_at: "2024-05-01T00:00:00Z",
    },
    {
      id: "inv-2024-04",
      period: "April 2024",
      amount: 245,
      status: "paid",
      paid_at: "2024-04-01T00:00:00Z",
    },
  ],
  next_invoice_date: "2024-07-01",
  payment_method: {
    type: "card",
    last4: "4242",
    brand: "visa",
    expiry: "12/25",
  },
};

export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx) => {
    const billing = {
      ...mockBilling,
      org_id: ctx.orgId,
    };
    return jsonResponse(billing);
  }) as any
);

export function OPTIONS() {
  return corsPreflight();
}
