"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/src/components/ui/popover";
import { CitationPopover } from "./CitationPopover";
import type { CitationData } from "@/src/hooks/useCitations";

interface CitationProps {
  citation: CitationData;
  onClick?: (number: number) => void;
  onViewSource?: (sourceId: string) => void;
}

export function Citation({ citation, onClick, onViewSource }: CitationProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <sup
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick?.(citation.number);
          }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className={cn(
            "inline-flex cursor-pointer items-center justify-center",
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
            "bg-accent-primary/10 text-accent-primary",
            "hover:bg-accent-primary/20 transition-colors",
            "ml-0.5 align-super"
          )}
        >
          [{citation.number}]
        </sup>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={6}
        className="p-0 border-0 bg-transparent shadow-none"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <CitationPopover
          source={citation.source}
          number={citation.number}
          onViewSource={onViewSource}
        />
      </PopoverContent>
    </Popover>
  );
}
