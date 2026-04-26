/**
 * Task specification templates for each TaskKind.
 *
 * Maps task taxonomies to the canonical tool sets they are permitted to invoke,
 * along with typical expected outputs and constraint defaults.
 */

import type { TaskKind, ToolName, ArtifactKind, ModelTier } from '@/src/types';
import type { TaskSpec, TaskConstraints, TaskExpectedOutput, ToolBinding } from '@/src/types';

// ─────────────────────────────────────────────────────────────────────────────
// Tool sets per task kind
// ─────────────────────────────────────────────────────────────────────────────

/** Full tool binding with a tool enabled by default. */
function tool(name: ToolName, config?: Record<string, unknown>): ToolBinding {
  return { name, enabled: true, config: config ?? null };
}

/** Tool binding with a tool explicitly disabled. */
function disabled(name: ToolName): ToolBinding {
  return { name, enabled: false, config: null };
}

export interface TaskTemplate {
  readonly kind: TaskKind;
  readonly displayName: string;
  readonly description: string;
  readonly defaultTools: readonly ToolBinding[];
  readonly defaultModelTier: ModelTier;
  readonly defaultExpectedOutput: TaskExpectedOutput;
  readonly defaultConstraints: Pick<TaskConstraints, 'maxAttempts' | 'timeoutSeconds' | 'maxTokens'>;
  /** Typical duration in ms (used by simulator). */
  readonly typicalDurationMs: number;
  /** Whether this task typically produces artifacts. */
  readonly producesArtifacts: boolean;
  /** Artifact kinds this task typically emits. */
  readonly typicalArtifactKinds: readonly ArtifactKind[];
}

const TEMPLATES: Record<TaskKind, TaskTemplate> = {
  research: {
    kind: 'research',
    displayName: 'Research',
    description: 'Gather information from external sources using web search and fetch.',
    defaultTools: [tool('web_search'), tool('web_fetch'), tool('web_browse'), tool('memory_read')],
    defaultModelTier: 'balanced',
    defaultExpectedOutput: {
      artifactKinds: ['report_md'],
      required: true,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 3, timeoutSeconds: 120, maxTokens: 8192 },
    typicalDurationMs: 8000,
    producesArtifacts: true,
    typicalArtifactKinds: ['report_md', 'json'],
  },

  extract: {
    kind: 'extract',
    displayName: 'Extract',
    description: 'Pull structured data from fetched pages or raw content.',
    defaultTools: [tool('web_fetch'), tool('code_exec')],
    defaultModelTier: 'balanced',
    defaultExpectedOutput: {
      artifactKinds: ['json', 'dataset_csv'],
      required: true,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 3, timeoutSeconds: 90, maxTokens: 4096 },
    typicalDurationMs: 5000,
    producesArtifacts: true,
    typicalArtifactKinds: ['json', 'dataset_csv'],
  },

  synthesize: {
    kind: 'synthesize',
    displayName: 'Synthesize',
    description: 'Combine multiple sources into a coherent narrative or analysis.',
    defaultTools: [tool('memory_read'), tool('memory_write'), tool('submit_result')],
    defaultModelTier: 'reasoning',
    defaultExpectedOutput: {
      artifactKinds: ['report_md'],
      required: true,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 2, timeoutSeconds: 180, maxTokens: 16384 },
    typicalDurationMs: 12000,
    producesArtifacts: true,
    typicalArtifactKinds: ['report_md', 'text_txt'],
  },

  code_author: {
    kind: 'code_author',
    displayName: 'Code Author',
    description: 'Write, refactor, or scaffold code and save it to the workspace.',
    defaultTools: [tool('code_exec'), tool('files_rw'), tool('submit_result')],
    defaultModelTier: 'code_specialist',
    defaultExpectedOutput: {
      artifactKinds: ['code_diff', 'text_txt'],
      required: true,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 3, timeoutSeconds: 180, maxTokens: 8192 },
    typicalDurationMs: 10000,
    producesArtifacts: true,
    typicalArtifactKinds: ['code_diff', 'text_txt'],
  },

  code_review: {
    kind: 'code_review',
    displayName: 'Code Review',
    description: 'Review code for correctness, style, and security issues.',
    defaultTools: [tool('files_rw', { mode: 'read' }), tool('code_exec'), tool('submit_result')],
    defaultModelTier: 'code_specialist',
    defaultExpectedOutput: {
      artifactKinds: ['report_md', 'json'],
      required: true,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 2, timeoutSeconds: 120, maxTokens: 4096 },
    typicalDurationMs: 6000,
    producesArtifacts: true,
    typicalArtifactKinds: ['report_md', 'json'],
  },

  data_analyze: {
    kind: 'data_analyze',
    displayName: 'Data Analyze',
    description: 'Run Python/pandas analysis on datasets and produce insights.',
    defaultTools: [tool('code_exec', { runtime: 'python' }), tool('files_rw'), tool('memory_read')],
    defaultModelTier: 'reasoning',
    defaultExpectedOutput: {
      artifactKinds: ['dataset_csv', 'json'],
      required: true,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 3, timeoutSeconds: 300, maxTokens: 8192 },
    typicalDurationMs: 15000,
    producesArtifacts: true,
    typicalArtifactKinds: ['dataset_csv', 'json', 'image_png'],
  },

  image_gen: {
    kind: 'image_gen',
    displayName: 'Image Gen',
    description: 'Generate images from text descriptions.',
    defaultTools: [tool('image_gen'), tool('memory_read')],
    defaultModelTier: 'image_specialist',
    defaultExpectedOutput: {
      artifactKinds: ['image_png', 'image_jpg'],
      required: true,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 2, timeoutSeconds: 120, maxTokens: 2048 },
    typicalDurationMs: 20000,
    producesArtifacts: true,
    typicalArtifactKinds: ['image_png', 'image_jpg'],
  },

  image_edit: {
    kind: 'image_edit',
    displayName: 'Image Edit',
    description: 'Edit or transform existing images.',
    defaultTools: [tool('image_edit'), tool('files_rw'), tool('memory_read')],
    defaultModelTier: 'image_specialist',
    defaultExpectedOutput: {
      artifactKinds: ['image_png', 'image_jpg'],
      required: true,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 3, timeoutSeconds: 120, maxTokens: 2048 },
    typicalDurationMs: 18000,
    producesArtifacts: true,
    typicalArtifactKinds: ['image_png', 'image_jpg'],
  },

  video_gen: {
    kind: 'video_gen',
    displayName: 'Video Gen',
    description: 'Generate short video clips from prompts or storyboards.',
    defaultTools: [tool('video_gen'), tool('memory_read')],
    defaultModelTier: 'video_specialist',
    defaultExpectedOutput: {
      artifactKinds: [],
      required: false,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 2, timeoutSeconds: 300, maxTokens: 2048 },
    typicalDurationMs: 45000,
    producesArtifacts: true,
    typicalArtifactKinds: [],
  },

  transform: {
    kind: 'transform',
    displayName: 'Transform',
    description: 'Convert content between formats or restructure data.',
    defaultTools: [tool('code_exec'), tool('files_rw'), tool('memory_read')],
    defaultModelTier: 'balanced',
    defaultExpectedOutput: {
      artifactKinds: ['json', 'text_txt', 'dataset_csv'],
      required: true,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 2, timeoutSeconds: 120, maxTokens: 4096 },
    typicalDurationMs: 7000,
    producesArtifacts: true,
    typicalArtifactKinds: ['json', 'dataset_csv', 'text_txt'],
  },

  verify: {
    kind: 'verify',
    displayName: 'Verify',
    description: 'Cross-check facts and claims against external sources.',
    defaultTools: [tool('web_search'), tool('web_fetch'), tool('memory_read'), tool('submit_result')],
    defaultModelTier: 'reasoning',
    defaultExpectedOutput: {
      artifactKinds: ['report_md', 'json'],
      required: true,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 2, timeoutSeconds: 120, maxTokens: 4096 },
    typicalDurationMs: 9000,
    producesArtifacts: true,
    typicalArtifactKinds: ['report_md', 'json'],
  },

  summarize: {
    kind: 'summarize',
    displayName: 'Summarize',
    description: 'Condense long content into key takeaways.',
    defaultTools: [tool('memory_read'), tool('memory_write'), tool('submit_result')],
    defaultModelTier: 'small',
    defaultExpectedOutput: {
      artifactKinds: ['report_md', 'text_txt'],
      required: true,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 2, timeoutSeconds: 60, maxTokens: 4096 },
    typicalDurationMs: 4000,
    producesArtifacts: true,
    typicalArtifactKinds: ['report_md', 'text_txt'],
  },

  connector_read: {
    kind: 'connector_read',
    displayName: 'Connector Read',
    description: 'Read data from an external connector (database, S3, Slack, etc.).',
    defaultTools: [tool('memory_read'), tool('code_exec')],
    defaultModelTier: 'balanced',
    defaultExpectedOutput: {
      artifactKinds: ['dataset_csv', 'json'],
      required: true,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 3, timeoutSeconds: 180, maxTokens: 4096 },
    typicalDurationMs: 8000,
    producesArtifacts: true,
    typicalArtifactKinds: ['dataset_csv', 'json'],
  },

  connector_write: {
    kind: 'connector_write',
    displayName: 'Connector Write',
    description: 'Push data to an external connector (database, S3, Slack, etc.).',
    defaultTools: [tool('memory_read'), tool('code_exec'), tool('files_rw')],
    defaultModelTier: 'balanced',
    defaultExpectedOutput: {
      artifactKinds: [],
      required: false,
      schema: null,
    },
    defaultConstraints: { maxAttempts: 3, timeoutSeconds: 180, maxTokens: 4096 },
    typicalDurationMs: 6000,
    producesArtifacts: false,
    typicalArtifactKinds: [],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Look up a task template by kind. */
export function getTaskTemplate(kind: TaskKind): TaskTemplate {
  const tmpl = TEMPLATES[kind];
  if (!tmpl) throw new Error(`Unknown task kind: ${kind}`);
  return tmpl;
}

/** List all available templates. */
export function listTaskTemplates(): readonly TaskTemplate[] {
  return Object.values(TEMPLATES);
}

/** Build a partial TaskSpec for a task kind with an instruction. */
export function buildTaskSpec(
  kind: TaskKind,
  localId: string,
  title: string,
  instruction: string,
  overrides?: Partial<Omit<TaskSpec, 'kind' | 'localId' | 'title' | 'instruction'>>
): Omit<TaskSpec, 'input'> {
  const tmpl = getTaskTemplate(kind);
  return {
    localId,
    title,
    instruction,
    kind,
    expectedOutput: tmpl.defaultExpectedOutput,
    constraints: {
      maxAttempts: tmpl.defaultConstraints.maxAttempts,
      timeoutSeconds: tmpl.defaultConstraints.timeoutSeconds,
      maxTokens: tmpl.defaultConstraints.maxTokens,
      preferredTier: tmpl.defaultModelTier,
      excludedModels: [],
      requiredSafetyClass: null,
      ...overrides?.constraints,
    },
    modelBinding: null,
    tools: tmpl.defaultTools,
    requiresApproval: false,
    ...overrides,
  };
}

/** Suggest a plan (DAG) for a simple research → synthesize workflow. */
export function suggestResearchPlan(prompt: string) {
  return {
    tasks: [
      buildTaskSpec('research', 't1', 'Web research', `Search and gather sources about: ${prompt}`),
      buildTaskSpec('extract', 't2', 'Extract findings', 'Extract structured findings from research sources.', {
        constraints: {
          maxAttempts: 3,
          timeoutSeconds: 90,
          maxTokens: 4096,
          preferredTier: 'balanced',
          excludedModels: [],
          requiredSafetyClass: null,
        },
      }),
      buildTaskSpec('synthesize', 't3', 'Synthesize report', `Synthesize a coherent report from the extracted findings addressing: ${prompt}`, {
        constraints: {
          maxAttempts: 2,
          timeoutSeconds: 180,
          maxTokens: 16384,
          preferredTier: 'reasoning',
          excludedModels: [],
          requiredSafetyClass: null,
        },
      }),
    ],
    edges: [
      { fromLocalId: 't1', toLocalId: 't2', edgeType: 'data', dataMapping: null, condition: null },
      { fromLocalId: 't2', toLocalId: 't3', edgeType: 'data', dataMapping: null, condition: null },
    ],
  };
}

/** Suggest a plan for a data analysis workflow. */
export function suggestDataAnalysisPlan(prompt: string) {
  return {
    tasks: [
      buildTaskSpec('connector_read', 't1', 'Fetch dataset', `Load dataset for analysis: ${prompt}`),
      buildTaskSpec('data_analyze', 't2', 'Analyze data', `Run analysis: ${prompt}`),
      buildTaskSpec('summarize', 't3', 'Summarize insights', 'Summarize key statistical insights for stakeholders.'),
    ],
    edges: [
      { fromLocalId: 't1', toLocalId: 't2', edgeType: 'data', dataMapping: null, condition: null },
      { fromLocalId: 't2', toLocalId: 't3', edgeType: 'data', dataMapping: null, condition: null },
    ],
  };
}

/** Suggest a plan for a code generation workflow. */
export function suggestCodePlan(prompt: string) {
  return {
    tasks: [
      buildTaskSpec('research', 't1', 'Research patterns', `Research best practices and patterns for: ${prompt}`),
      buildTaskSpec('code_author', 't2', 'Write code', `Implement solution for: ${prompt}`),
      buildTaskSpec('code_review', 't3', 'Review code', 'Review the generated code for correctness and style.'),
      buildTaskSpec('verify', 't4', 'Verify output', 'Run tests and verify the implementation works correctly.'),
    ],
    edges: [
      { fromLocalId: 't1', toLocalId: 't2', edgeType: 'ordering', dataMapping: null, condition: null },
      { fromLocalId: 't2', toLocalId: 't3', edgeType: 'data', dataMapping: null, condition: null },
      { fromLocalId: 't2', toLocalId: 't4', edgeType: 'data', dataMapping: null, condition: null },
      { fromLocalId: 't3', toLocalId: 't4', edgeType: 'ordering', dataMapping: null, condition: null },
    ],
  };
}

/** Auto-suggest a plan based on prompt keywords. */
export function autoSuggestPlan(prompt: string) {
  const p = prompt.toLowerCase();
  if (p.includes('csv') || p.includes('dataset') || p.includes('pandas') || p.includes('analysis')) {
    return suggestDataAnalysisPlan(prompt);
  }
  if (p.includes('code') || p.includes('function') || p.includes('api') || p.includes('implement')) {
    return suggestCodePlan(prompt);
  }
  return suggestResearchPlan(prompt);
}
