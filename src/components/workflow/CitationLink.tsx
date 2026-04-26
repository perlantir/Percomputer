"use client";

import * as React from "react";

interface CitationLinkProps {
  sourceId: string;
  children: React.ReactNode;
  onNavigate?: (sourceId: string) => void;
}

/**
 * CitationLink handles navigation to the Sources tab and scrolling
 * to a specific source when a citation or "view source" link is clicked.
 */
export const CitationLink = React.memo(function CitationLink({ sourceId, children, onNavigate }: CitationLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onNavigate?.(sourceId);
  };

  return (
    <button
      onClick={handleClick}
      className="inline cursor-pointer bg-transparent p-0 text-inherit"
      type="button"
    >
      {children}
    </button>
  );
});
