import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useReducedMotion } from 'framer-motion';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import {
  buildElements,
  createCytoscapeConfig,
  fitGraph,
  zoomOneToOne,
  applyThemeStylesheet,
  detectFanOutGroups,
  collapseGroup,
  expandGroup,
  DAGRE_LAYOUT_OPTIONS,
  WorkflowPlan,
} from '../../lib/cytoscape-config';
import DAGControls from './DAGControls';
import DAGMiniMap from './DAGMiniMap';
import TaskDetailDrawer from './TaskDetailDrawer';
import DAGNode from './DAGNode';

cytoscape.use(dagre);

export interface DAGVisualizationProps {
  plan: WorkflowPlan;
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string | null) => void;
  onTaskCancel?: (taskId: string) => void;
  theme?: 'light' | 'dark';
  collapsibleFanOut?: boolean;
  showMiniMap?: boolean;
  height?: string | number;
  readOnly?: boolean;
}

const DAGVisualization: React.FC<DAGVisualizationProps> = ({
  plan,
  selectedTaskId,
  onSelectTask,
  onTaskCancel,
  theme = 'dark',
  collapsibleFanOut = true,
  showMiniMap = true,
  height = '100%',
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fanOutExpanded, setFanOutExpanded] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [activeNodes, setActiveNodes] = useState<Map<string, React.ReactNode>>(new Map());
  const shouldReduceMotion = useReducedMotion();

  // Refs to avoid stale closures in the mount-only effect
  const onSelectTaskRef = useRef(onSelectTask);
  const onTaskCancelRef = useRef(onTaskCancel);
  const readOnlyRef = useRef(readOnly);
  const drawerOpenRef = useRef(drawerOpen);

  useEffect(() => { onSelectTaskRef.current = onSelectTask; }, [onSelectTask]);
  useEffect(() => { onTaskCancelRef.current = onTaskCancel; }, [onTaskCancel]);
  useEffect(() => { readOnlyRef.current = readOnly; }, [readOnly]);
  useEffect(() => { drawerOpenRef.current = drawerOpen; }, [drawerOpen]);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setSelectedNode(null);
    onSelectTask?.(null);
    cyRef.current?.nodes().unselect();
  }, [onSelectTask]);

  // Entrance animation helper
  const runEntranceAnimation = useCallback((cy: cytoscape.Core) => {
    if (shouldReduceMotion) {
      // Skip animations: show all elements immediately
      cy.nodes().style({ opacity: 1, 'border-width': 2, 'shadow-blur': 0 });
      cy.edges().style({ opacity: 1 });
      return;
    }

    const nodes = cy.nodes();
    const edges = cy.edges();

    // Nodes pop in with stagger
    nodes.forEach((node, i) => {
      node.style({ opacity: 0, 'border-width': 0, 'shadow-blur': 0 });
      node.animate({
        style: { opacity: 1, 'border-width': 2 },
        duration: 400,
        delay: i * 35,
        easing: 'ease-out-cubic',
      });
    });

    // Edges draw in with stagger
    edges.forEach((edge, i) => {
      const targetWidth = edge.numericStyle('width') || 2;
      edge.style({ opacity: 0, width: 0 });
      edge.animate({
        style: { opacity: 1, width: targetWidth },
        duration: 350,
        delay: 150 + i * 25,
        easing: 'ease-out-cubic',
      });
    });
  }, [shouldReduceMotion]);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const elements = buildElements(plan);
    const config = createCytoscapeConfig(containerRef.current, elements);
    const cy = cytoscape(config);
    cyRef.current = cy;

    // Run dagre layout
    const layout = cy.layout(DAGRE_LAYOUT_OPTIONS as unknown as cytoscape.LayoutOptions);
    layout.run();

    // Entrance animation after layout settles
    setTimeout(() => runEntranceAnimation(cy), 400);

    // Fit after initial layout
    setTimeout(() => fitGraph(cy, 40), 100);

    // Track zoom
    const updateZoom = () => setZoomLevel(cy.zoom());
    cy.on('zoom', updateZoom);

    // Node selection
    cy.on('tap', 'node', (evt) => {
      const node = evt.target as cytoscape.NodeSingular;
      const id = node.id();
      setSelectedNode(id);
      onSelectTaskRef.current?.(id);
      setDrawerOpen(true);
    });

    // Deselect on background tap
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        onSelectTaskRef.current?.(null);
        setDrawerOpen(false);
      }
    });

    // Node hover scale effect (skip if reduced motion)
    if (!shouldReduceMotion) {
      cy.on('mouseover', 'node', (evt) => {
        const node = evt.target as cytoscape.NodeSingular;
        if (node.selected() || node.hasClass('collapsed')) return;
        node.stop();
        node.animate({
          style: {
            padding: '16px',
            'border-width': 3,
            'shadow-blur': 14,
            'shadow-color': 'var(--accent-primary)',
          },
          duration: 200,
          easing: 'ease-out-cubic',
        });
      });

      cy.on('mouseout', 'node', (evt) => {
        const node = evt.target as cytoscape.NodeSingular;
        if (node.selected() || node.hasClass('collapsed')) return;
        node.stop();
        node.animate({
          style: {
            padding: '12px',
            'border-width': 2,
            'shadow-blur': 0,
          },
          duration: 200,
          easing: 'ease-out-cubic',
        });
      });
    }

    // Keyboard shortcuts — only active when DAG container has focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const containerHasFocus =
        containerRef.current === document.activeElement ||
        (containerRef.current !== null && containerRef.current.contains(document.activeElement));

      // Escape always closes the drawer if it's open or if focus is inside the DAG
      if (e.key === 'Escape') {
        if (drawerOpenRef.current || containerHasFocus) {
          setDrawerOpen(false);
          setSelectedNode(null);
          onSelectTaskRef.current?.(null);
        }
        return;
      }

      // Other shortcuts only when DAG is focused and not read-only
      if (!containerHasFocus || readOnlyRef.current) return;

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          fitGraph(cy, 40);
          break;
        case '1':
          e.preventDefault();
          zoomOneToOne(cy);
          break;
        case '+':
        case '=':
          e.preventDefault();
          cy.zoom({ level: cy.zoom() * 1.2, position: { x: cy.width() / 2, y: cy.height() / 2 } });
          break;
        case '-':
          e.preventDefault();
          cy.zoom({ level: cy.zoom() * 0.8, position: { x: cy.width() / 2, y: cy.height() / 2 } });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Resize handler
    const resizeObserver = new ResizeObserver(() => {
      cy.resize();
    });
    resizeObserver.observe(containerRef.current);

    // Task cancel listener
    cy.on('taskCancel', (_evt, taskId: string) => {
      onTaskCancelRef.current?.(taskId);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      resizeObserver.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  // Update elements when plan changes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const newElements = buildElements(plan);
    cy.elements().remove();
    cy.add(newElements);

    const layout = cy.layout(DAGRE_LAYOUT_OPTIONS as unknown as cytoscape.LayoutOptions);
    layout.run();

    // Restore collapsed groups
    if (!fanOutExpanded && collapsibleFanOut) {
      const groups = detectFanOutGroups(cy);
      groups.forEach((children, parentId) => {
        collapseGroup(cy, parentId, children, (groupId) => {
          expandGroup(cy, groupId);
          setCollapsedGroups((prev) => {
            const next = new Set(prev);
            next.delete(groupId);
            return next;
          });
        });
      });
    }

    setTimeout(() => {
      fitGraph(cy, 40);
      runEntranceAnimation(cy);
    }, 100);
  }, [plan.id, plan.updatedAt]);

  // Update theme
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    applyThemeStylesheet(cy);
  }, [theme]);

  // Toggle fan-out
  const handleToggleFanOut = useCallback(() => {
    const cy = cyRef.current;
    if (!cy || !collapsibleFanOut) return;

    const nextExpanded = !fanOutExpanded;
    setFanOutExpanded(nextExpanded);

    if (!nextExpanded) {
      // Collapse
      const groups = detectFanOutGroups(cy);
      const newCollapsed = new Set<string>();
      groups.forEach((children, parentId) => {
        const groupId = collapseGroup(cy, parentId, children, (gid) => {
          expandGroup(cy, gid);
          setCollapsedGroups((prev) => {
            const p = new Set(prev);
            p.delete(gid);
            return p;
          });
          setFanOutExpanded(true);
        });
        newCollapsed.add(groupId);
      });
      setCollapsedGroups(newCollapsed);
    } else {
      // Expand all
      collapsedGroups.forEach((groupId) => {
        expandGroup(cy, groupId);
      });
      setCollapsedGroups(new Set());
    }

    // Re-run layout
    const layout = cy.layout(DAGRE_LAYOUT_OPTIONS as unknown as cytoscape.LayoutOptions);
    layout.run();
    setTimeout(() => fitGraph(cy, 40), 100);
  }, [fanOutExpanded, collapsedGroups, collapsibleFanOut]);

  // Control handlers
  const handleFit = useCallback(() => {
    const cy = cyRef.current;
    if (cy) fitGraph(cy, 40);
  }, []);

  const handleZoomIn = useCallback(() => {
    const cy = cyRef.current;
    if (cy) {
      cy.zoom({
        level: cy.zoom() * 1.2,
        position: { x: cy.width() / 2, y: cy.height() / 2 },
      });
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const cy = cyRef.current;
    if (cy) {
      cy.zoom({
        level: cy.zoom() * 0.8,
        position: { x: cy.width() / 2, y: cy.height() / 2 },
      });
    }
  }, []);

  const handleResetLayout = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const layout = cy.layout(DAGRE_LAYOUT_OPTIONS as unknown as cytoscape.LayoutOptions);
    layout.run();
    setTimeout(() => fitGraph(cy, 40), 300);
  }, []);

  // Find selected task data
  const selectedTask = useMemo(() => {
    if (!selectedNode) return null;
    return plan.tasks.find((t) => t.id === selectedNode) || null;
  }, [selectedNode, plan.tasks]);

  // Sync external selectedTaskId
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !selectedTaskId) return;
    const node = cy.getElementById(selectedTaskId);
    if (node.nonempty()) {
      cy.nodes().unselect();
      node.select();
      setSelectedNode(selectedTaskId);
    }
  }, [selectedTaskId]);

  // Render DAGNode components for cytoscape nodes (tooltip/context menu support)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const nodes = cy.nodes();
    const newMap = new Map<string, React.ReactNode>();

    nodes.forEach((node) => {
      // Create a portal-like wrapper for each node
      newMap.set(
        node.id(),
        <DAGNode key={node.id()} node={node} cy={cy} />
      );
    });

    setActiveNodes(newMap);
  }, [plan.tasks.length]);

  return (
    <div
      className={`dag-visualization dag-visualization--${theme}`}
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
      }}
    >
      {/* Cytoscape container */}
      <div
        ref={containerRef}
        className="dag-cy-container"
        tabIndex={0}
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--bg-surface)',
          outline: 'none',
        }}
      />

      {/* Controls */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 60,
        }}
      >
        <DAGControls
          onFit={handleFit}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetLayout={handleResetLayout}
          onToggleFanOut={handleToggleFanOut}
          fanOutExpanded={fanOutExpanded}
          zoomLevel={zoomLevel}
        />
      </div>

      {/* Mini-map */}
      {showMiniMap && (
        <DAGMiniMap
          cy={cyRef.current}
          visible={true}
          width={200}
          height={150}
        />
      )}

      {/* Status bar */}
      <div
        className="dag-status-bar"
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          zIndex: 55,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <span className="status-pill">
          {plan.tasks.length} tasks
        </span>
        <span className="status-pill">
          {plan.edges.length} edges
        </span>
        <span className="status-pill status-pill--running">
          {plan.tasks.filter((t) => t.status === 'running').length} running
        </span>
        <span className="status-pill status-pill--success">
          {plan.tasks.filter((t) => t.status === 'succeeded').length} done
        </span>
        {plan.tasks.filter((t) => t.status === 'failed').length > 0 && (
          <span className="status-pill status-pill--danger">
            {plan.tasks.filter((t) => t.status === 'failed').length} failed
          </span>
        )}
      </div>

      {/* Keyboard hint */}
      <div
        className="dag-keyboard-hint"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 55,
          fontSize: 11,
          color: 'var(--text-tertiary)',
          opacity: 0.7,
        }}
      >
        <kbd>f</kbd> fit <kbd>1</kbd> 1:1 <kbd>+</kbd> in <kbd>-</kbd> out
      </div>

      {/* Task detail drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={handleDrawerClose}
      />

      {/* Hidden DAGNode components for event handling */}
      {Array.from(activeNodes.values())}
    </div>
  );
};

export default DAGVisualization;
