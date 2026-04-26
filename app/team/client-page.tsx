"use client";

/**
 * Team management page — integrates invitation form, pending invites list,
 * and team member list into a unified settings view.
 *
 * Features:
 * - Send new email invitations with role selector
 * - View and revoke pending invitations
 * - View team members with role badges
 * - Remove team members
 */

import * as React from "react";
import { Users, Shield, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

import { InviteForm } from "@/src/components/team/InviteForm";
import { InviteList } from "@/src/components/team/InviteList";
import { MemberList } from "@/src/components/team/MemberList";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";

export default function TeamPage() {
  return (
    <main className="relative min-h-[100dvh] bg-[var(--bg-canvas)] overflow-hidden">
      {/* Subtle gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 35% at 20% 0%, rgba(var(--accent-primary-rgb), 0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 25% at 80% 10%, rgba(var(--accent-secondary), 0.03) 0%, transparent 50%)`,
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
              <Users className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                Team
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Manage team members and invitations
              </p>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left column — Invite form */}
          <div className="flex flex-col gap-6">
            <InviteForm />

            <Card variant="ghost" className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--accent-primary)]/10">
                  <Shield className="h-4 w-4 text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-primary)]">
                    Role permissions
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-[var(--text-secondary)]">
                    <li className="flex items-center gap-1.5">
                      <span className="font-medium text-[var(--text-primary)]">Admin</span>
                      — Full access to team, billing, and settings
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="font-medium text-[var(--text-primary)]">Member</span>
                      — Create and run workflows, manage spaces
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="font-medium text-[var(--text-primary)]">Viewer</span>
                      — Read-only access to workflows and reports
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="font-medium text-[var(--text-primary)]">Auditor</span>
                      — Access audit logs and compliance data only
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Right column — Lists */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  People who have access to your organisation
                </CardDescription>
              </CardHeader>
              <MemberList className="px-6 pb-6" />
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Invitations</CardTitle>
                <CardDescription>
                  Pending email invitations sent to team members
                </CardDescription>
              </CardHeader>
              <InviteList className="px-6 pb-6" />
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
