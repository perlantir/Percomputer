"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/src/lib/utils";
import { DEMO_WORKFLOWS } from "@/src/data/demo-workflows";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Zap, ArrowUpRight } from "lucide-react";

interface DailyUsage {
  day: string;
  credits: number;
}

function generateLast30DaysUsage(): DailyUsage[] {
  const days: DailyUsage[] = [];
  const totalSpent = DEMO_WORKFLOWS.reduce((sum, w) => sum + w.workflow.spentCredits, 0);
  const dailyAverage = totalSpent / 30;

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const variation = 0.5 + Math.random();
    days.push({
      day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      credits: Math.max(0, Math.round(dailyAverage * variation)),
    });
  }
  return days;
}

function fetchBillingData(): Promise<{ usage: DailyUsage[]; balance: number; plan: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        usage: generateLast30DaysUsage(),
        balance: 48760,
        plan: "Pro",
      });
    }, 200);
  });
}

export function BillingPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["settings-billing"],
    queryFn: fetchBillingData,
    initialData: {
      usage: generateLast30DaysUsage(),
      balance: 48760,
      plan: "Pro",
    },
  });

  const { usage, balance, plan } = data ?? { usage: [], balance: 0, plan: "Free" };

  const maxUsage = useMemo(() => {
    return Math.max(...usage.map((d) => d.credits), 1);
  }, [usage]);

  const totalUsed = useMemo(() => usage.reduce((sum, d) => sum + d.credits, 0), [usage]);

  return (
    <div className="flex flex-col gap-6">
      {/* Credit Balance Card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription>Credit Balance</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Zap className="h-6 w-6 text-accent-primary" />
              {balance.toLocaleString()}
              <span className="text-sm font-normal text-foreground-tertiary">cr</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-foreground-tertiary">
              {totalUsed.toLocaleString()} credits used in the last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription>Current Plan</CardDescription>
            <CardTitle className="text-2xl">{plan}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-foreground-tertiary">
              $99/month · Unlimited workflows · Priority routing
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-1 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardDescription>Next Billing</CardDescription>
            <CardTitle className="text-xl">Feb 14, 2025</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="default" size="sm" className="w-full">
              Upgrade Plan
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage (Last 30 Days)</CardTitle>
          <CardDescription>Daily credit consumption across all workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-48 animate-skeleton rounded-md" />
          ) : (
            <div className="flex items-end gap-1 h-48 px-1">
              {usage.map((day, i) => {
                const heightPct = Math.max(4, (day.credits / maxUsage) * 100);
                return (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-1 group"
                    title={`${day.day}: ${day.credits.toLocaleString()} cr`}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t-sm transition-all duration-fast ease-out",
                        "bg-accent-primary/30 hover:bg-accent-primary/60"
                      )}
                      style={{ height: `${heightPct}%` }}
                    />
                    {i % 5 === 0 && (
                      <span className="text-[10px] text-foreground-tertiary leading-none rotate-0">
                        {day.day.split(" ")[1]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stripe Integration Placeholder */}
      <Card className="bg-surface-2/40">
        <CardHeader>
          <CardTitle className="text-base">Payment Method</CardTitle>
          <CardDescription>Manage your billing details via Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-dashed border-border-default bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#635BFF]/10">
                <span className="text-sm font-bold text-[#635BFF]">S</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground-primary">Stripe Connected</p>
                <p className="text-xs text-foreground-tertiary">Card ending in 4242</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
