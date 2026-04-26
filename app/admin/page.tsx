import type { Metadata } from "next";
import AdminClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Admin",
  description:
    "Administrative console for managing users, organizations, feature flags, and rate limits.",
  twitter: {
    card: "summary",
    title: "Admin | Computer",
    description:
      "Administrative console for managing users, organizations, feature flags, and rate limits.",
  },
};

export default function AdminPage() {
  return <AdminClientPage />;
}
