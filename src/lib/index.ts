export { cn } from "./utils";
export { useAppStore } from "./store";
export { prisma } from "./db";
export { hashPassword, verifyPassword, signToken, verifyToken } from "./auth";
export type { TokenPayload } from "./auth";
export {
  MODEL_ROSTER,
  selectModel,
  rankModels,
  getModelById,
  listModels,
  resolveTier,
  estimateCost,
  estimateCostFromBudget,
  simulateLatency,
} from "./model-router";
export type { RouterOptions, CostEstimate, LatencyEstimate } from "./model-router";
export {
  getTaskTemplate,
  listTaskTemplates,
  buildTaskSpec,
  suggestResearchPlan,
  suggestDataAnalysisPlan,
  suggestCodePlan,
  autoSuggestPlan,
} from "./task-templates";
export type { TaskTemplate } from "./task-templates";
export {
  webSearch,
  webFetch,
  webBrowse,
  codeExec,
  filesRw,
  memoryRead,
  memoryWrite,
  invokeTool,
  formatToolResult,
  setGatewayConfig,
  getGatewayConfig,
  resetGatewayConfig,
} from "./tool-gateway";
export type {
  ToolResult,
  SearchResultItem,
  WebFetchResult,
  CodeExecResult,
  FileOpResult,
  MemoryReadResult,
  GatewayConfig,
} from "./tool-gateway";
export {
  buildSimulation,
  runSimulation,
  simulateWorkflow,
  simulateWorkflowStream,
  cancelSimulation,
} from "./workflow-simulator";
export type { SimulatorConfig } from "./workflow-simulator";

/* ── Missing lib exports ── */
export {
  getCorsOrigin,
  getAuthContext,
  withAuth,
  withErrorHandler,
  safeParseInt,
  jsonResponse,
  sseStream,
  validateRequest,
  parseQueryParams,
  corsPreflight,
} from "./api-utils";
export type { AuthContext } from "./api-utils";
export {
  TASK_KIND_SHAPES,
  STATUS_COLORS,
  EDGE_STYLES,
  buildStylesheet,
  DAGRE_LAYOUT_OPTIONS,
  createCytoscapeConfig,
  applyThemeStylesheet,
  fitGraph,
  zoomOneToOne,
  nodesToCytoscape,
  edgesToCytoscape,
  buildElements,
  detectFanOutGroups,
  collapseGroup,
  expandGroup,
} from "./cytoscape-config";
export type { TaskNode, TaskEdge, ToolCall, WorkflowPlan } from "./cytoscape-config";
export {
  workflowToMarkdown,
  artifactToMarkdown,
  workflowToJSON,
  artifactToJSON,
  objectsToJSON,
  objectsToCSV,
  tasksToCSV,
  generateMockPDF,
  downloadWorkflow,
  downloadArtifact,
  generateShareLink,
  expirationLabel,
  generateEmbedCode,
  generateResponsiveEmbed,
  copyToClipboard,
} from "./export-utils";
export type { ExportFormat, ExportableWorkflow, ShareLinkOptions, EmbedOptions } from "./export-utils";
export { db } from "./mock-db";
export {
  fuzzyMatch,
  searchItems,
  escapeHtml,
  highlightMatches,
  highlightLiteral,
  getHighlightClasses,
} from "./search-utils";
export type { SearchMatch, SearchableItem, SearchResult, SearchResultType } from "./search-utils";
