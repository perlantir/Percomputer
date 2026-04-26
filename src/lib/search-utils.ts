"use client";

/**
 * Fuzzy search utilities for the Multi-Model Agent Platform.
 *
 * Provides a lightweight, Fuse.js-style fuzzy matching algorithm with scoring,
 * plus text highlighting helpers that safely wrap matched substrings in <mark>.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchMatch {
  indices: number[]; // indices of matched characters in the text
  score: number; // lower = better match
}

export interface SearchableItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  searchableText: string; // the full text used for matching
  href?: string;
  icon?: string;
  meta?: Record<string, unknown>;
}

export type SearchResultType =
  | "workflow"
  | "space"
  | "artifact"
  | "memory"
  | "connector";

export interface SearchResult extends SearchableItem {
  match: SearchMatch;
  highlightedTitle: string;
  highlightedSubtitle?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fuzzy matching algorithm
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate a fuzzy match score between a query and a text string.
 *
 * Scoring heuristic:
 *  - Exact match gets score 0 (best possible).
 *  - Consecutive character matches are rewarded (bonus per consecutive run).
 *  - Matches at word boundaries are rewarded (+2 each).
 *  - Each gap (unmatched char between matched chars) costs +1.
 *  - Leading unmatched chars before first match cost +0.5 each.
 *  - Case-insensitive matching.
 *
 * Returns `null` if not all query characters can be found in order.
 */
export function fuzzyMatch(query: string, text: string): SearchMatch | null {
  if (!query.trim()) return null;

  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Fast path: exact match
  const exactIdx = t.indexOf(q);
  if (exactIdx !== -1) {
    const indices: number[] = [];
    for (let i = exactIdx; i < exactIdx + q.length; i++) indices.push(i);
    return { indices, score: 0 };
  }

  const qChars = Array.from(q);
  const tChars = Array.from(t);

  let qIdx = 0;
  let tIdx = 0;
  const indices: number[] = [];
  let gaps = 0;
  let leadingPenalty = 0;
  let consecutiveBonus = 0;
  let boundaryBonus = 0;
  let foundFirst = false;
  let prevMatched = false;

  while (qIdx < qChars.length && tIdx < tChars.length) {
    if (qChars[qIdx] === tChars[tIdx]) {
      indices.push(tIdx);
      if (!foundFirst) {
        leadingPenalty = tIdx * 0.5;
        foundFirst = true;
        // Bonus for matching at word boundary (start of string or after whitespace/punctuation)
        if (
          tIdx === 0 ||
          /\s/.test(tChars[tIdx - 1]) ||
          /[^a-z0-9]/.test(tChars[tIdx - 1])
        ) {
          boundaryBonus += 2;
        }
      } else if (prevMatched) {
        consecutiveBonus += 1.5;
      }
      prevMatched = true;
      qIdx++;
    } else {
      if (foundFirst) gaps++;
      prevMatched = false;
    }
    tIdx++;
  }

  // If we didn't match all query characters, return null
  if (qIdx < qChars.length) return null;

  // Score: lower is better. Normalize by text length to avoid bias toward short strings.
  const rawScore =
    leadingPenalty + gaps - consecutiveBonus - boundaryBonus * 0.5;
  const normalizedScore = rawScore / Math.max(t.length * 0.1, 1);

  return { indices, score: Math.max(normalizedScore, 0.01) };
}

/**
 * Run fuzzy search over an array of items and return sorted results.
 */
export function searchItems(
  query: string,
  items: SearchableItem[],
  options?: { limit?: number; minScoreThreshold?: number }
): SearchResult[] {
  const { limit = 20, minScoreThreshold = 0.3 } = options ?? {};
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const results: SearchResult[] = [];

  for (const item of items) {
    // Try matching against title first (higher priority)
    let match = fuzzyMatch(trimmedQuery, item.title);
    let textSource = item.title;

    // Fall back to subtitle
    if (!match && item.subtitle) {
      match = fuzzyMatch(trimmedQuery, item.subtitle);
      textSource = item.subtitle;
    }

    // Fall back to full searchable text
    if (!match) {
      match = fuzzyMatch(trimmedQuery, item.searchableText);
      textSource = item.searchableText;
    }

    if (match && match.score <= minScoreThreshold) {
      results.push({
        ...item,
        match,
        highlightedTitle: highlightMatches(item.title, match.indices, true),
        highlightedSubtitle: item.subtitle
          ? highlightMatches(
              item.subtitle,
              // Remap indices if subtitle was matched
              textSource === item.subtitle
                ? match.indices
                : fuzzyMatch(trimmedQuery, item.subtitle)?.indices ?? [],
              true
            )
          : undefined,
      });
    }
  }

  // Sort by score ascending (best first)
  results.sort((a, b) => a.match.score - b.match.score);

  return results.slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// Highlight helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escape HTML special characters so we can safely inject into innerHTML.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Wrap matched character ranges in the text with `<mark>` tags.
 *
 * @param text      Original text
 * @param indices   Indices of characters that were matched
 * @param escape    Whether to escape HTML before injecting <mark> tags
 */
export function highlightMatches(
  text: string,
  indices: number[],
  escape = true
): string {
  if (!indices.length) return escape ? escapeHtml(text) : text;

  const chars = Array.from(text);
  const matched = new Set(indices);

  let output = "";
  let inMark = false;

  for (let i = 0; i < chars.length; i++) {
    const isMatched = matched.has(i);

    if (isMatched && !inMark) {
      output += '<mark class="search-highlight">';
      inMark = true;
    } else if (!isMatched && inMark) {
      output += "</mark>";
      inMark = false;
    }

    output += escape ? escapeHtml(chars[i]) : chars[i];
  }

  if (inMark) output += "</mark>";

  return output;
}

/**
 * Build a highlighted HTML string from a plain text query by matching
 * literal substrings (simple includes). Returns the escaped text with
 * all query substrings wrapped in `<mark>`.
 */
export function highlightLiteral(
  text: string,
  query: string,
  className = "search-highlight"
): string {
  if (!query.trim()) return escapeHtml(text);

  const escapedText = escapeHtml(text);
  const escapedQuery = escapeHtml(query.trim());
  const regex = new RegExp(
    escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "gi"
  );

  return escapedText.replace(
    regex,
    (match) => `<mark class="${className}">${match}</mark>`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS class injection helper (optional, for dark-mode styling)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the recommended Tailwind CSS classes for <mark> highlights.
 * Use this in your global stylesheet or inline.
 */
export function getHighlightClasses(): string {
  return [
    // Light mode
    "bg-yellow-200/80",
    "text-yellow-900",
    "rounded-sm",
    "px-0.5",
    // Dark mode
    "dark:bg-yellow-400/20",
    "dark:text-yellow-200",
  ].join(" ");
}
