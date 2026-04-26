"use client";

import React, { useState } from "react";
import {
  FileText,
  Table,
  Image as ImageIcon,
  Code,
  FileJson,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ArtifactViewer } from "./ArtifactViewer";
import type { ArtifactMeta } from "@/src/mock/generators";

export interface ArtifactsTabProps {
  artifacts: ArtifactMeta[];
}

function kindFromType(type: string): ArtifactViewerProps["kind"] {
  if (type.includes("markdown") || type.includes("document")) return "report_md";
  if (type.includes("csv")) return "dataset_csv";
  if (type.includes("png")) return "image_png";
  if (type.includes("jpg") || type.includes("jpeg")) return "image_jpg";
  if (type.includes("diff")) return "code_diff";
  if (type.includes("json")) return "json";
  return "text_txt";
}

function iconForType(type: string) {
  if (type.includes("csv")) return <Table className="h-5 w-5" />;
  if (type.includes("png") || type.includes("jpg") || type.includes("image"))
    return <ImageIcon className="h-5 w-5" />;
  if (type.includes("json")) return <FileJson className="h-5 w-5" />;
  if (type.includes("python") || type.includes("typescript") || type.includes("code"))
    return <Code className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* Mock content generators */
function generateMockContent(artifact: ArtifactMeta): string {
  const { type, name } = artifact;

  if (type.includes("csv")) {
    return `Name,Age,City,Role,Salary
Alice Johnson,34,New York,Engineer,145000
Bob Smith,29,San Francisco,Designer,112000
Carol White,41,Chicago,Manager,178000
David Lee,27,Seattle,Engineer,134000
Eva Brown,35,Boston,Analyst,128000
Frank Miller,31,Austin,Engineer,156000
Grace Davis,39,Denver,Manager,165000
Henry Wilson,26,Miami,Designer,98000
Ivy Chen,33,Portland,Engineer,142000
Jack Taylor,45,Atlanta,Director,210000`;
  }

  if (type.includes("json")) {
    return JSON.stringify(
      {
        project: name.replace(/\.(json|txt)$/i, ""),
        version: "1.0.0",
        metrics: {
          accuracy: 0.943,
          f1_score: 0.928,
          latency_ms: 142,
        },
        config: {
          model: "claude-sonnet-4.6",
          temperature: 0.3,
          max_tokens: 4000,
        },
      },
      null,
      2
    );
  }

  if (type.includes("python")) {
    return `import pandas as pd
from typing import List, Dict

class DataProcessor:
    def __init__(self, source: str):
        self.source = source
        self.cache: Dict[str, any] = {}

    def load(self) -> pd.DataFrame:
        """Load data from the configured source."""
        return pd.read_csv(self.source)

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply standard cleaning pipeline."""
        df = df.dropna(subset=["id", "value"])
        df["value"] = pd.to_numeric(df["value"], errors="coerce")
        return df

    def export(self, df: pd.DataFrame, path: str):
        """Write to output format."""
        df.to_parquet(path, index=False)

if __name__ == "__main__":
    processor = DataProcessor("input.csv")
    raw = processor.load()
    clean = processor.transform(raw)
    processor.export(clean, "output.parquet")
`;
  }

  if (type.includes("markdown")) {
    return `# ${name}

## Executive Summary

This document summarizes the findings and recommendations based on the analysis conducted. Key conclusions include:

1. **Market Position**: The subject entity maintains a strong competitive position within its primary sector.
2. **Financial Health**: Liquidity ratios and cash flow generation remain robust despite macro headwinds.
3. **Risk Factors**: Regulatory uncertainty and supply chain diversification present the most material near-term risks.

## Detailed Analysis

### Revenue and Growth
Revenue growth has moderated from 28% YoY to 14% YoY, reflecting market maturation and increased competition.

### Margin Expansion
Gross margin expanded 240bps driven by operational efficiencies and pricing power in premium segments.

## Recommendations

- Continue investment in R&D to maintain technological differentiation
- Diversify supplier base to reduce concentration risk
- Evaluate strategic partnerships to accelerate geographic expansion
`;
  }

  return `Artifact: ${name}
Type: ${type}
Generated: ${new Date().toISOString()}

This is a generated artifact preview. In a production environment, the actual content would be fetched from the artifact storage URL.`;
}

import type { ArtifactViewerProps } from "./ArtifactViewer";

export function ArtifactsTab({ artifacts }: ArtifactsTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = artifacts.find((a) => a.id === selectedId);

  return (
    <div className="space-y-4">
      {selected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedId(null)}
            >
              ← Back to artifacts
            </Button>
          </div>
          <div className="card p-5">
            <ArtifactViewer
              name={selected.name}
              kind={kindFromType(selected.type)}
              content={generateMockContent(selected)}
              sizeBytes={selected.sizeBytes}
              permalink={`#artifact-${selected.id}`}
              downloadUrl={`#download-${selected.id}`}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artifacts.map((artifact) => {
            const kind = kindFromType(artifact.type);
            return (
              <button
                key={artifact.id}
                onClick={() => setSelectedId(artifact.id)}
                className="group card flex flex-col items-start gap-3 p-4 text-left transition-all duration-fast hover:border-[var(--accent-primary)]/30"
              >
                <div className="flex w-full items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--bg-surface-2)] text-[var(--accent-primary)]">
                    {iconForType(artifact.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                      {artifact.name}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {formatBytes(artifact.sizeBytes)} · {artifact.type}
                    </div>
                  </div>
                </div>

                {/* Inline preview */}
                <div className="w-full">
                  {kind === "report_md" || kind === "text_txt" ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {artifact.description}
                    </p>
                  ) : kind === "dataset_csv" ? (
                    <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/50 p-2">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                        <Table className="h-3 w-3" />
                        <span>CSV preview available</span>
                      </div>
                    </div>
                  ) : kind === "image_png" || kind === "image_jpg" ? (
                    <div className="flex h-24 w-full items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
                      <ImageIcon className="h-8 w-8 text-[var(--text-tertiary)]" />
                    </div>
                  ) : (
                    <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-2">
                      <code className="line-clamp-2 text-xs font-mono text-[var(--text-secondary)]">
                        {generateMockContent(artifact).split("\n")[0]}
                      </code>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="mt-auto flex w-full items-center justify-between pt-1">
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    {new Date(artifact.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] transition-colors">
                      <Eye className="h-3 w-3" />
                      View
                    </span>
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] transition-colors">
                      <Download className="h-3 w-3" />
                      Download
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
