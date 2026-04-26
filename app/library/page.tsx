import type { Metadata } from "next";
import LibraryContent from "./library-content";
import { JsonLdServer } from "@/src/components/JsonLd";
import { webPageSchema } from "@/src/lib/structured-data";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Browse, search, and manage all your workflows. Filter by status, space, and task kind.",
  openGraph: {
    title: "Library | Computer",
    description:
      "Browse, search, and manage all your workflows. Filter by status, space, and task kind.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "Library | Computer",
    description:
      "Browse, search, and manage all your workflows. Filter by status, space, and task kind.",
    images: ["/og-image.png"],
  },
};

export default function LibraryPage() {
  return (
    <>
      <JsonLdServer
        data={webPageSchema(
          "Library",
          "Browse, search, and manage all your workflows. Filter by status, space, and task kind.",
          "/library"
        )}
      />
      <LibraryContent />
    </>
  );
}

export default function LibraryPage() {
  return <LibraryContent />;
}
