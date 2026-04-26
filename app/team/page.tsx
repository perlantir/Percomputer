import type { Metadata } from "next";
import TeamClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Team",
  description:
    "Manage team members, invitations, roles, and permissions for your workspace.",
  twitter: {
    card: "summary",
    title: "Team | Computer",
    description:
      "Manage team members, invitations, roles, and permissions for your workspace.",
  },
};

export default function TeamPage() {
  return <TeamClientPage />;
}
