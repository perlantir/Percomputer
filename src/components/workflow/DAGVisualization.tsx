"use client";

import dynamic from "next/dynamic";
import type { DAGVisualizationProps } from "./DAGVisualizationCore";

const DAGVisualization = dynamic(
  () => import("./DAGVisualizationCore"),
  { ssr: false }
);

export default DAGVisualization;
export type { DAGVisualizationProps } from "./DAGVisualizationCore";
