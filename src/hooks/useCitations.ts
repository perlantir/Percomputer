"use client";

import { useCallback, useMemo } from "react";
import type { SourceCard } from "@/src/mock/generators";

export interface CitationData {
  number: number;
  source: SourceCard;
}

export interface UseCitationsResult {
  citations: CitationData[];
  parseCitations: (text: string) => Array<{ text: string; citation?: CitationData }>;
  getCitationByNumber: (num: number) => CitationData | undefined;
  handleCitationHover: (number: number) => void;
  handleCitationClick: (number: number) => void;
}

/**
 * Parse citations from Markdown-style text.
 * Looks for patterns like [1], [2], etc.
 */
function extractCitationNumbers(text: string): number[] {
  const matches = text.match(/\[(\d+)\]/g);
  if (!matches) return [];
  return matches
    .map((m) => parseInt(m.replace(/[\[\]]/g, ""), 10))
    .filter((n) => !isNaN(n));
}

/**
 * Build a map of citation numbers to source objects.
 */
function buildCitationMap(sources: SourceCard[]): Map<number, CitationData> {
  const map = new Map<number, CitationData>();
  sources.forEach((source, idx) => {
    const number = idx + 1;
    map.set(number, { number, source });
  });
  return map;
}

export function useCitations(sources: SourceCard[]): UseCitationsResult {
  const citationMap = useMemo(() => buildCitationMap(sources), [sources]);

  const citations = useMemo(() => {
    return Array.from(citationMap.values()).sort((a, b) => a.number - b.number);
  }, [citationMap]);

  const getCitationByNumber = useCallback(
    (num: number) => citationMap.get(num),
    [citationMap]
  );

  const parseCitations = useCallback(
    (text: string) => {
      const parts: Array<{ text: string; citation?: CitationData }> = [];
      const regex = /(\[\d+\])/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const index = match.index;
        const fullMatch = match[0];
        const num = parseInt(fullMatch.replace(/[\[\]]/g, ""), 10);

        if (index > lastIndex) {
          parts.push({ text: text.slice(lastIndex, index) });
        }

        const citation = citationMap.get(num);
        parts.push({ text: fullMatch, citation });
        lastIndex = index + fullMatch.length;
      }

      if (lastIndex < text.length) {
        parts.push({ text: text.slice(lastIndex) });
      }

      if (parts.length === 0) {
        parts.push({ text });
      }

      return parts;
    },
    [citationMap]
  );

  const handleCitationHover = useCallback((number: number) => {
    // Could be used for analytics or preloading
    // eslint-disable-next-line no-console
    console.debug("Citation hover:", number);
  }, []);

  const handleCitationClick = useCallback((number: number) => {
    // Could be used for analytics
    // eslint-disable-next-line no-console
    console.debug("Citation click:", number);
  }, []);

  return {
    citations,
    parseCitations,
    getCitationByNumber,
    handleCitationHover,
    handleCitationClick,
  };
}
