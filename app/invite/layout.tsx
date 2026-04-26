import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Invitation",
  description:
    "Accept your team invitation to join the workspace on the Multi-Model Agent Platform.",
  openGraph: {
    title: "Team Invitation | Computer",
    description:
      "Accept your team invitation to join the workspace on the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "Team Invitation | Computer",
    description:
      "Accept your team invitation to join the workspace on the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
