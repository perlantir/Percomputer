import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description:
    "System administration dashboard for managing users, organizations, feature flags, and rate limits.",
  openGraph: {
    title: "Admin | Computer",
    description:
      "System administration dashboard for managing users, organizations, feature flags, and rate limits.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "Admin | Computer",
    description:
      "System administration dashboard for managing users, organizations, feature flags, and rate limits.",
    images: ["/og-image.png"],
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
