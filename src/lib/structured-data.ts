/**
 * Schema.org JSON-LD Structured Data Utilities
 *
 * Provides typed builders for common Schema.org structured data schemas.
 * All functions return plain objects that can be passed to <JsonLd data={...}>.
 *
 * @see https://schema.org/docs/schemas.html
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const ORG_NAME = "Multi-Model Agent Platform";
export const ORG_URL = "https://agentplatform.dev";
export const ORG_LOGO = "https://agentplatform.dev/logo.png";
export const ORG_SAME_AS = [
  "https://twitter.com/agentplatform",
  "https://github.com/agentplatform",
  "https://linkedin.com/company/agentplatform",
];

// ── Types ────────────────────────────────────────────────────────────────────

/** Base schema type that all schemas extend */
interface SchemaBase {
  "@context": "https://schema.org";
  "@type": string;
}

/** Organization schema */
export interface OrganizationSchema extends SchemaBase {
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
  description?: string;
  foundingDate?: string;
  contactPoint?: {
    "@type": "ContactPoint";
    contactType: string;
    email: string;
    availableLanguage: string[];
  }[];
}

/** WebSite schema (search sitelinks box) */
export interface WebSiteSchema extends SchemaBase {
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  publisher: { "@type": string; name: string; logo: string };
  potentialAction?: {
    "@type": "SearchAction";
    target: { "@type": string; urlTemplate: string };
    "query-input": string;
  };
}

/** WebPage schema — generic page-level metadata */
export interface WebPageSchema extends SchemaBase {
  "@type": "WebPage";
  name: string;
  description: string;
  url: string;
  isPartOf?: { "@type": string; name: string; url: string };
  datePublished?: string;
  dateModified?: string;
  breadcrumb?: { "@type": string; itemListElement: unknown[] };
}

/** SoftwareApplication schema — for the platform / product */
export interface SoftwareApplicationSchema extends SchemaBase {
  "@type": "SoftwareApplication";
  name: string;
  applicationCategory: string;
  description: string;
  url: string;
  operatingSystem: string;
  offers: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
    description?: string;
  }[];
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: string;
    ratingCount: string;
    bestRating: string;
  };
  featureList?: string;
  softwareVersion?: string;
  author: { "@type": string; name: string; url: string };
}

/** FAQPage schema — help / docs pages */
export interface FAQPageSchema extends SchemaBase {
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
}

/** BreadcrumbList schema */
export interface BreadcrumbListSchema extends SchemaBase {
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }[];
}

/** Product schema — for pricing tiers */
export interface ProductSchema extends SchemaBase {
  "@type": "Product";
  name: string;
  description: string;
  brand: { "@type": string; name: string };
  offers: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
    availability: string;
    description?: string;
    priceValidUntil?: string;
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: string;
    ratingCount: string;
  };
}

/** Article schema — for changelog entries / blog posts */
export interface ArticleSchema extends SchemaBase {
  "@type": "Article" | "TechArticle";
  headline: string;
  description: string;
  url: string;
  author: { "@type": string; name: string; url: string };
  publisher: { "@type": string; name: string; logo: string };
  datePublished: string;
  dateModified?: string;
}

/** AggregateRating schema */
export interface AggregateRatingSchema extends SchemaBase {
  "@type": "AggregateRating";
  ratingValue: string;
  ratingCount: string;
  bestRating: string;
}

// ── Union type of all supported schemas ──────────────────────────────────────
export type JsonLdSchema =
  | OrganizationSchema
  | WebSiteSchema
  | WebPageSchema
  | SoftwareApplicationSchema
  | FAQPageSchema
  | BreadcrumbListSchema
  | ProductSchema
  | ArticleSchema;

// ── Builder functions ────────────────────────────────────────────────────────

/**
 * Organization schema — used site-wide in the root layout.
 * Enables rich results like logo, social profile links, and knowledge panels.
 */
export function organizationSchema(
  overrides?: Partial<OrganizationSchema>
): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: ORG_URL,
    logo: ORG_LOGO,
    sameAs: ORG_SAME_AS,
    description:
      "A multi-model, multi-agent orchestration platform for building, running, and scaling autonomous AI workflows.",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@agentplatform.dev",
        availableLanguage: ["English"],
      },
    ],
    ...overrides,
  };
}

/**
 * WebSite schema — used in the root layout.
 * Enables Google Search sitelinks search box.
 */
export function webSiteSchema(
  overrides?: Partial<WebSiteSchema>
): WebSiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORG_NAME,
    url: ORG_URL,
    description:
      "Multi-model, multi-agent orchestration platform for building, running, and scaling autonomous AI workflows.",
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: ORG_LOGO,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${ORG_URL}/discover?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    ...overrides,
  };
}

/**
 * WebPage schema — used on individual pages.
 * Provides page-level context to search engines.
 */
export function webPageSchema(
  name: string,
  description: string,
  urlPath: string,
  overrides?: Partial<WebPageSchema>
): WebPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: `${ORG_URL}${urlPath}`,
    isPartOf: {
      "@type": "WebSite",
      name: ORG_NAME,
      url: ORG_URL,
    },
    ...overrides,
  };
}

/**
 * SoftwareApplication schema — used on the landing page.
 * Enables rich app results with ratings, pricing, and features.
 */
export function softwareApplicationSchema(
  overrides?: Partial<SoftwareApplicationSchema>
): SoftwareApplicationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: ORG_NAME,
    applicationCategory: "DeveloperApplication",
    description:
      "Multi-model, multi-agent orchestration platform for building, running, and scaling autonomous AI workflows. Route tasks across 20+ LLMs, compose intelligent agents, and deploy production-ready workflows.",
    url: ORG_URL,
    operatingSystem: "Any",
    softwareVersion: "2.4.1",
    featureList: [
      "Multi-Model Orchestration",
      "Autonomous Agents",
      "Visual Workflow Builder",
      "Sub-Second Latency",
      "Enterprise Security",
      "Global Edge Network",
      "Real-Time Analytics",
      "API-First Design",
      "Smart Routing",
      "Agent Composition",
      "Custom Model Hosting",
      "Version Control",
      "Data Privacy",
      "One-Click Deploy",
      "Scheduled Workflows",
      "Team Collaboration",
      "CLI & SDK",
      "Persistent Memory",
      "Human-in-the-Loop",
      "100+ Integrations",
      "Observability",
      "Auto-Optimization",
      "Fine-Grained Controls",
      "Prompt Injection Guard",
    ].join(", "),
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Starter plan — 1,000 API calls/month, 3 concurrent workflows",
      },
      {
        "@type": "Offer",
        price: "49",
        priceCurrency: "USD",
        description: "Pro plan — 50,000 API calls/month, 20 concurrent workflows",
      },
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Enterprise plan — Custom pricing for unlimited scale",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "1247",
      bestRating: "5",
    },
    author: {
      "@type": "Organization",
      name: ORG_NAME,
      url: ORG_URL,
    },
    ...overrides,
  };
}

/**
 * FAQPage schema — used on the help page.
 * Enables FAQ rich results (expandable Q&A in search).
 */
export function faqPageSchema(
  questions: Array<{ question: string; answer: string }>
): FAQPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

/**
 * BreadcrumbList schema — used on nested pages.
 * Enables breadcrumb rich results in SERPs.
 */
export function breadcrumbListSchema(
  items: Array<{ name: string; urlPath: string }>
): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${ORG_URL}${item.urlPath}`,
    })),
  };
}

/**
 * Article schema — used on changelog entries.
 * Enables article rich results.
 */
export function articleSchema(
  headline: string,
  description: string,
  urlPath: string,
  datePublished: string,
  overrides?: Partial<ArticleSchema>
): ArticleSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: `${ORG_URL}${urlPath}`,
    author: {
      "@type": "Organization",
      name: ORG_NAME,
      url: ORG_URL,
    },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: ORG_LOGO,
    },
    datePublished,
    ...overrides,
  };
}

/**
 * AggregateRating schema — standalone for reuse.
 */
export function aggregateRatingSchema(
  ratingValue: string,
  ratingCount: string,
  bestRating = "5"
): AggregateRatingSchema {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    ratingValue,
    ratingCount,
    bestRating,
  };
}
