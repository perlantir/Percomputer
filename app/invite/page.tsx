import type { Metadata } from "next";
import InviteClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Team Invitation",
  description:
    "Accept your team invitation to join a workspace on the Computer platform.",
  twitter: {
    card: "summary",
    title: "Team Invitation | Computer",
    description:
      "Accept your team invitation to join a workspace on the Computer platform.",
  },
};

export default function InvitePage() {
  return <InviteClientPage />;
}
