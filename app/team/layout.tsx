import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team",
  description:
    "Manage team members, send invitations, and configure role-based permissions.",
  openGraph: {
    title: "Team | Computer",
    description:
      "Manage team members, send invitations, and configure role-based permissions.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "Team | Computer",
    description:
      "Manage team members, send invitations, and configure role-based permissions.",
    images: ["/og-image.png"],
  },
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
