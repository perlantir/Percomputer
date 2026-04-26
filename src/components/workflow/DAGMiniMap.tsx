import React, { useRef, useEffect, useCallback, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

interface DAGMiniMapProps {
  cy: cytoscape.Core | null;
  visible?: boolean;
  width?: number;
  height?: number;
}

const DAGMiniMap: React.FC<DAGMiniMapProps> = ({
  cy,
  visible = true,
  width = 200,
  height = 150,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const miniCyRef = useRef<cytoscape.Core | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [bb, setBb] = useState({ x1: 0, y1: 0, w: 1, h: 1 });

  // Initialize mini-map Cytoscape instance
  useEffect(() => {
    if (!containerRef.current || !cy || !visible) return;

    // Create mini-map graph with same elements but simplified styling
    const elements = cy.elements().jsons();
    const miniCy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'shape': 'rectangle',
            'background-color': 'var(--bg-surface-2)',
            'border-color': 'var(--border-default)',
            'border-width': 1,
            'width': 8,
            'height': 8,
            'label': '',
          },
        },
        {
          selector: 'node[status="running"]',
          style: {
            'background-color': 'var(--accent-primary)',
          },
        },
        {
          selector: 'node[status="succeeded"]',
          style: {
            'background-color': 'var(--success)',
          },
        },
        {
          selector: 'node[status="failed"]',
          style: {
            'background-color': 'var(--danger)',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': 'var(--border-default)',
            'target-arrow-shape': 'none',
          },
        },
        {
          selector: '.hidden',
          style: {
            'display': 'none',
          },
        },
      ],
      layout: {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 10,
        edgeSep: 5,
        rankSep: 15,
        fit: true,
        padding: 5,
      } as cytoscape.LayoutOptions,
      minZoom: 0.05,
      maxZoom: 5,
      userZoomingEnabled: false,
      userPanningEnabled: false,
      boxSelectionEnabled: false,
      autoungrabify: true,
    });

    miniCyRef.current = miniCy;

    // Fit mini-map to its container
    miniCy.fit(miniCy.elements(), 5);

    // Calculate graph bounding box
    const graphBb = miniCy.elements().boundingBox({});
    setBb({ x1: graphBb.x1, y1: graphBb.y1, w: graphBb.w, h: graphBb.h });

    return () => {
      miniCy.destroy();
      miniCyRef.current = null;
    };
  }, [cy, visible]);

  // Sync main viewport to mini-map
  useEffect(() => {
    if (!cy || !miniCyRef.current || !visible) return;

    const updateViewport = () => {
      const mainPan = cy.pan();
      const mainZoom = cy.zoom();
      const mainBb = cy.elements().boundingBox({});
      const miniBb = miniCyRef.current!.elements().boundingBox({});

      // Scale factors
      const scaleX = width / miniBb.w;
      const scaleY = height / miniBb.h;
      const scale = Math.min(scaleX, scaleY);

      // Viewport dimensions on the mini-map
      const containerWidth = cy.width();
      const containerHeight = cy.height();

      const vpW = (containerWidth / mainZoom) * scale;
      const vpH = (containerHeight / mainZoom) * scale;

      // Viewport position (centered on what's visible in main graph)
      const vpX = ((mainPan.x - miniBb.x1) / mainZoom) * scale;
      const vpY = ((mainPan.y - miniBb.y1) / mainZoom) * scale;

      setPan({ x: vpX + width / 2, y: vpY + height / 2 });
      setZoom(scale);
      setBb({ x1: miniBb.x1, y1: miniBb.y1, w: miniBb.w, h: miniBb.h });
    };

    cy.on('pan zoom resize', updateViewport);
    updateViewport();

    return () => {
      cy.removeListener('pan zoom resize', updateViewport);
    };
  }, [cy, visible, width, height]);

  // Click on mini-map to navigate
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cy || !miniCyRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const miniBb = miniCyRef.current.elements().boundingBox({});
      const scaleX = width / miniBb.w;
      const scaleY = height / miniBb.h;
      const scale = Math.min(scaleX, scaleY);

      // Convert mini-map coordinates to main graph coordinates
      const graphX = miniBb.x1 + (clickX - width / 2) / scale;
      const graphY = miniBb.y1 + (clickY - height / 2) / scale;

      // Center the main graph on this point
      cy.animate({
        pan: {
          x: -graphX * cy.zoom() + cy.width() / 2,
          y: -graphY * cy.zoom() + cy.height() / 2,
        },
        duration: 300,
        easing: 'ease-in-out-cubic',
      });
    },
    [cy, width, height]
  );

  if (!visible) return null;

  // Calculate viewport rectangle style
  const containerWidth = cy?.width() || 800;
  const containerHeight = cy?.height() || 600;
  const mainZoom = cy?.zoom() || 1;

  const scaleX = bb.w > 0 ? width / bb.w : 1;
  const scaleY = bb.h > 0 ? height / bb.h : 1;
  const scale = Math.min(scaleX, scaleY);

  const vpW = Math.min((containerWidth / mainZoom) * scale, width);
  const vpH = Math.min((containerHeight / mainZoom) * scale, height);

  return (
    <div
      className="dag-minimap"
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        width,
        height,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        overflow: 'hidden',
        zIndex: 50,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
        onClick={handleClick}
      />

      {/* Viewport rectangle */}
      <div
        ref={viewportRef}
        className="dag-minimap__viewport"
        style={{
          position: 'absolute',
          left: Math.max(0, Math.min(width - vpW, pan.x - vpW / 2)),
          top: Math.max(0, Math.min(height - vpH, pan.y - vpH / 2)),
          width: vpW,
          height: vpH,
          border: '2px solid var(--accent-primary)',
          backgroundColor: 'rgba(var(--accent-primary-rgb), 0.08)',
          borderRadius: 2,
          pointerEvents: 'none',
          transition: 'all 0.1s linear',
        }}
      />
    </div>
  );
};

export default DAGMiniMap;
