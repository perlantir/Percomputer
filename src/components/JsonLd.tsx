"use client";

/**
 * JsonLd — renders a Schema.org structured data <script> tag.
 *
 * Usage (server component):
 *   import { JsonLd } from "@/src/components/JsonLd";
 *   import { organizationSchema } from "@/src/lib/structured-data";
 *
 *   <JsonLd data={organizationSchema()} />
 *
 * Usage with multiple schemas (server component):
 *   <JsonLd data={[organizationSchema(), webSiteSchema()]} />
 *
 * This component MUST be placed inside a Next.js <Head> or directly in JSX.
 * When used in the App Router, place it as a sibling of <main> or inside <head>.
 *
 * For App Router pages, import the component with "use client" and pass the
 * pre-built schema data as a prop. Schema objects are built server-side in
 * page.tsx and passed to this client component for rendering.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld
 */

import { useMemo } from "react";

/** Any valid Schema.org JSON-LD object */
interface JsonLdObject {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

type JsonLdData = JsonLdObject | JsonLdObject[];

interface JsonLdProps {
  /** Single schema object or array of schema objects */
  data: JsonLdData;
  /** Optional ID for the script tag */
  id?: string;
}

/**
 * Client-side component that renders JSON-LD structured data as a
 * <script type="application/ld+json"> tag.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  const json = useMemo(() => JSON.stringify(data, null, 0), [data]);

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safe — data is typed and generated internally
      dangerouslySetInnerHTML={{ __html: json }}
      id={id}
    />
  );
}

/**
 * Server-safe wrapper for rendering JSON-LD in server components.
 *
 * Use this in server components (page.tsx, layout.tsx) when you need
 * to output JSON-LD without the "use client" directive overhead.
 *
 * Usage:
 *   import { JsonLdServer } from "@/src/components/JsonLd";
 *   <JsonLdServer data={organizationSchema()} />
 */
export function JsonLdServer({ data, id }: JsonLdProps) {
  const json = JSON.stringify(data, null, 0);

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safe — data is typed and generated internally
      dangerouslySetInnerHTML={{ __html: json }}
      id={id}
    />
  );
}
