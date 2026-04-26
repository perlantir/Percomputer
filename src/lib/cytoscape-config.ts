import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

// Register dagre extension
cytoscape.use(dagre);

export const TASK_KIND_SHAPES: Record<string, string> = {
  research: 'roundrectangle',
  code_author: 'hexagon',
  transform: 'parallelogram',
  synthesize: 'diamond',
  extract: 'rectangle',
  verify: 'ellipse',
  summarize: 'roundrectangle',
  data_analyze: 'rectangle',
  image_gen: 'rectangle',
  video_gen: 'rectangle',
};

export const STATUS_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  pending:   { fill: 'var(--bg-surface-2)', stroke: 'var(--border-default)', text: 'var(--text-secondary)' },
  running:   { fill: 'var(--accent-primary)', stroke: 'var(--accent-primary)', text: '#ffffff' },
  succeeded: { fill: 'var(--success)', stroke: 'var(--success)', text: '#ffffff' },
  failed:    { fill: 'var(--danger)', stroke: 'var(--danger)', text: '#ffffff' },
  cancelled: { fill: 'var(--text-tertiary)', stroke: 'var(--border-default)', text: 'var(--text-secondary)' },
};

export const EDGE_STYLES: Record<string, Partial<cytoscape.Css.Edge>> = {
  data: {
    'line-color': 'var(--border-default)',
    'target-arrow-color': 'var(--border-default)',
    'line-style': 'solid',
    'width': 2,
    'target-arrow-shape': 'triangle',
  },
  ordering: {
    'line-color': 'var(--text-tertiary)',
    'target-arrow-color': 'var(--text-tertiary)',
    'line-style': 'dashed',
    'width': 2,
    'target-arrow-shape': 'triangle',
  },
  conditional: {
    'line-color': 'var(--warning)',
    'target-arrow-color': 'var(--warning)',
    'line-style': 'dotted',
    'width': 2,
    'target-arrow-shape': 'triangle',
    'label': 'data(label)',
    'color': 'var(--warning)',
    'font-size': '10px',
    'text-background-color': 'var(--bg-surface)',
    'text-background-opacity': 1,
    'text-background-padding': 2,
  },
};

export function buildStylesheet(): cytoscape.Stylesheet[] {
  return [
    {
      selector: 'node',
      style: {
        'shape': 'data(shape)',
        'label': 'data(label)',
        'background-color': 'data(bg)',
        'border-color': 'data(border)',
        'border-width': 2,
        'color': 'data(fg)',
        'font-size': '12px',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': '100px',
        'width': 'label',
        'height': 'label',
        'padding': '12px',
        'transition-property': 'background-color, border-color, color, opacity, padding, shadow-blur, shadow-color, border-width',
        'transition-duration': '0.3s',
        'transition-timing-function': 'ease-in-out',
        'cursor': 'pointer',
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 3,
        'border-color': 'var(--accent-primary)',
        'shadow-blur': 10,
        'shadow-color': 'var(--accent-primary)',
      },
    },
    {
      selector: 'node[kind="summarize"]',
      style: {
        'width': 80,
        'height': 40,
        'font-size': '10px',
      },
    },
    {
      selector: 'node[kind="data_analyze"]',
      style: {
        'background-image': 'data(icon)',
        'background-fit': 'none',
        'background-position-x': '10%',
        'background-position-y': '50%',
        'background-width': 14,
        'background-height': 14,
        'padding-left': '24px',
      },
    },
    {
      selector: 'node[kind="image_gen"], node[kind="video_gen"]',
      style: {
        'background-image': 'data(icon)',
        'background-fit': 'none',
        'background-position-x': '10%',
        'background-position-y': '50%',
        'background-width': 14,
        'background-height': 14,
        'padding-left': '24px',
      },
    },
    {
      selector: 'node[status="cancelled"]',
      style: {
        'text-decoration': 'line-through',
        'opacity': 0.6,
      },
    },
    {
      selector: 'node.collapsed',
      style: {
        'shape': 'roundrectangle',
        'background-color': 'var(--bg-surface)',
        'border-color': 'var(--accent-primary)',
        'border-width': 2,
        'color': 'var(--accent-primary)',
        'font-weight': 'bold',
      },
    },
    {
      selector: 'node.collapsed:selected',
      style: {
        'border-width': 3,
        'shadow-blur': 10,
        'shadow-color': 'var(--accent-primary)',
      },
    },
    {
      selector: 'edge',
      style: {
        'curve-style': 'bezier',
        'width': 2,
        'target-arrow-shape': 'triangle',
        'arrow-scale': 1.2,
        'target-arrow-fill': 'filled',
        'transition-property': 'line-color, target-arrow-color, width, opacity',
        'transition-duration': '0.3s',
        'transition-timing-function': 'ease-in-out',
      },
    },
    {
      selector: 'edge[type="data"]',
      style: EDGE_STYLES.data,
    },
    {
      selector: 'edge[type="ordering"]',
      style: EDGE_STYLES.ordering,
    },
    {
      selector: 'edge[type="conditional"]',
      style: EDGE_STYLES.conditional,
    },
    {
      selector: 'edge.highlight',
      style: {
        'line-color': 'var(--accent-primary)',
        'target-arrow-color': 'var(--accent-primary)',
        'width': 3,
      },
    },
    {
      selector: 'node.highlight',
      style: {
        'border-color': 'var(--accent-primary)',
        'border-width': 3,
      },
    },
    {
      selector: '.hidden',
      style: {
        'display': 'none',
      },
    },
  ];
}

export const DAGRE_LAYOUT_OPTIONS: dagre.DagreLayoutOptions = {
  name: 'dagre',
  rankDir: 'TB',
  nodeSep: 40,
  edgeSep: 20,
  rankSep: 60,
  animate: true,
  animationDuration: 300,
  fit: false,
  padding: 20,
};

export function createCytoscapeConfig(
  container: HTMLElement,
  elements: cytoscape.ElementsDefinition
): cytoscape.CytoscapeOptions {
  return {
    container,
    elements,
    style: buildStylesheet(),
    layout: DAGRE_LAYOUT_OPTIONS as unknown as cytoscape.LayoutOptions,
    minZoom: 0.2,
    maxZoom: 3,
    wheelSensitivity: 0.3,
    selectionType: 'single',
    autoungrabify: false,
    boxSelectionEnabled: false,
    userZoomingEnabled: true,
    userPanningEnabled: true,
    textureOnViewport: false,
    motionBlur: false,
  };
}

export function applyThemeStylesheet(cy: cytoscape.Core) {
  cy.style(buildStylesheet());
}

export function fitGraph(cy: cytoscape.Core, padding = 40) {
  cy.animate({
    fit: { padding, eles: cy.elements() },
    duration: 300,
    easing: 'ease-in-out-cubic',
  });
}

export function zoomOneToOne(cy: cytoscape.Core) {
  const zoom = cy.zoom();
  cy.animate({
    zoom: 1,
    pan: { x: cy.pan().x / zoom, y: cy.pan().y / zoom },
    duration: 300,
    easing: 'ease-in-out-cubic',
  });
}

export interface TaskNode {
  id: string;
  label: string;
  kind: string;
  status: string;
  description?: string;
  prompt?: string;
  toolCalls?: ToolCall[];
  attempts?: number;
  result?: unknown;
  traceId?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
}

export interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  output?: unknown;
  duration?: number;
  error?: string;
}

export interface WorkflowPlan {
  id: string;
  name: string;
  tasks: TaskNode[];
  edges: TaskEdge[];
  createdAt: string;
  updatedAt: string;
  revision?: number;
}

export function nodesToCytoscape(tasks: TaskNode[]): cytoscape.ElementDefinition[] {
  return tasks.map((task) => {
    const colors = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
    const shape = TASK_KIND_SHAPES[task.kind] || 'roundrectangle';
    const icon =
      task.kind === 'data_analyze'
        ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
        : task.kind === 'image_gen' || task.kind === 'video_gen'
        ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
        : undefined;

    return {
      data: {
        id: task.id,
        label: task.label,
        kind: task.kind,
        status: task.status,
        shape,
        bg: colors.fill,
        border: colors.stroke,
        fg: colors.text,
        icon,
        ...task,
      },
    };
  });
}

export function edgesToCytoscape(edges: TaskEdge[]): cytoscape.ElementDefinition[] {
  return edges.map((edge) => ({
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      label: edge.label,
      ...edge,
    },
  }));
}

export function buildElements(plan: WorkflowPlan): cytoscape.ElementsDefinition {
  return {
    nodes: nodesToCytoscape(plan.tasks),
    edges: edgesToCytoscape(plan.edges),
  };
}

/**
 * Detect fan-out groups: nodes that share the same parent and have many children
 */
export function detectFanOutGroups(
  cy: cytoscape.Core,
  threshold = 3
): Map<string, cytoscape.NodeCollection> {
  const groups = new Map<string, cytoscape.NodeCollection>();
  const nodes = cy.nodes();

  nodes.forEach((node) => {
    const children = node.outgoers('node');
    if (children.length >= threshold) {
      groups.set(node.id(), children);
    }
  });

  return groups;
}

/**
 * Collapse a fan-out group into a single placeholder node
 */
export function collapseGroup(
  cy: cytoscape.Core,
  parentId: string,
  children: cytoscape.NodeCollection,
  onExpand?: (groupId: string) => void
): string {
  const groupId = `group-${parentId}`;
  const parentNode = cy.getElementById(parentId);
  const bbox = parentNode.boundingbox();

  // Hide children and their connecting edges
  children.forEach((child) => {
    child.addClass('hidden');
    child.connectedEdges().addClass('hidden');
  });

  // Add collapsed group node if not exists
  if (cy.getElementById(groupId).empty()) {
    cy.add({
      group: 'nodes',
      data: {
        id: groupId,
        label: `${children.length} tasks`,
        kind: 'collapsed',
        status: 'collapsed',
        shape: 'roundrectangle',
        bg: 'var(--bg-surface)',
        border: 'var(--accent-primary)',
        fg: 'var(--accent-primary)',
        collapsed: true,
        parentId,
        childCount: children.length,
      },
      position: { x: bbox.x2 + 80, y: (bbox.y1 + bbox.y2) / 2 },
    });

    // Edge from parent to group node
    cy.add({
      group: 'edges',
      data: {
        id: `edge-${groupId}`,
        source: parentId,
        target: groupId,
        type: 'ordering',
      },
    });
  }

  // Click to expand
  cy.getElementById(groupId).on('tap', () => {
    onExpand?.(groupId);
  });

  return groupId;
}

/**
 * Expand a previously collapsed group
 */
export function expandGroup(cy: cytoscape.Core, groupId: string) {
  const groupNode = cy.getElementById(groupId);
  const parentId = groupNode.data('parentId');

  if (!parentId) return;

  // Show children
  const parentNode = cy.getElementById(parentId);
  const children = parentNode.outgoers('node');
  children.forEach((child) => {
    child.removeClass('hidden');
    child.connectedEdges().removeClass('hidden');
  });

  // Remove group node and its edge
  cy.remove(groupNode);
  cy.remove(cy.getElementById(`edge-${groupId}`));
}
