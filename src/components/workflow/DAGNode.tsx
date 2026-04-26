import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import cytoscape from 'cytoscape';
import { createPopper, Instance as PopperInstance } from '@popperjs/core';

interface DAGNodeProps {
  node: cytoscape.NodeSingular;
  cy: cytoscape.Core;
}

export interface ContextMenuItem {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

const DAGNode: React.FC<DAGNodeProps> = React.memo(({ node, cy }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const popperRef = useRef<PopperInstance | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Build tooltip content
  const tooltipContent = useCallback(() => {
    const data = node.data();
    return (
      <div className="dag-node-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-kind-badge">{data.kind}</span>
          <span className={`tooltip-status tooltip-status--${data.status}`}>{data.status}</span>
        </div>
        <div className="tooltip-title">{data.label}</div>
        {data.description && <div className="tooltip-desc">{data.description}</div>}
        {data.attempts !== undefined && (
          <div className="tooltip-meta">Attempts: {data.attempts}</div>
        )}
        {data.toolCalls && (
          <div className="tooltip-meta">Tools: {data.toolCalls.length}</div>
        )}
        {data.traceId && (
          <div className="tooltip-trace">
            Trace: <code>{data.traceId.slice(0, 12)}...</code>
          </div>
        )}
      </div>
    );
  }, [node]);

  // Hover tooltip with Popper
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const showTooltip = (evt: cytoscape.EventObject) => {
      if (!tooltipRef.current) return;

      timer = setTimeout(() => {
        const target = evt.target as cytoscape.NodeSingular;
        const domNode = tooltipRef.current!;

        popperRef.current = createPopper(
          target.popperRef(),
          domNode,
          {
            placement: 'top',
            modifiers: [
              { name: 'offset', options: { offset: [0, 10] } },
              { name: 'preventOverflow', options: { boundary: cy.container() } },
            ],
          }
        );
        domNode.classList.add('visible');
      }, 300);
    };

    const hideTooltip = () => {
      clearTimeout(timer);
      tooltipRef.current?.classList.remove('visible');
      popperRef.current?.destroy();
      popperRef.current = null;
    };

    node.on('mouseover', showTooltip);
    node.on('mouseout', hideTooltip);

    return () => {
      clearTimeout(timer);
      node.removeListener('mouseover', showTooltip);
      node.removeListener('mouseout', hideTooltip);
      popperRef.current?.destroy();
    };
  }, [node, cy]);

  // Right-click context menu
  useEffect(() => {
    const handleCtx = (evt: cytoscape.EventObject) => {
      evt.preventDefault();
      const originalEvent = evt.originalEvent as MouseEvent;
      setContextMenu({
        x: originalEvent.clientX,
        y: originalEvent.clientY,
        visible: true,
      });
    };

    node.on('cxttap', handleCtx);
    return () => {
      node.removeListener('cxttap', handleCtx);
    };
  }, [node]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu.visible) return;
    const close = () => setContextMenu((prev) => ({ ...prev, visible: false }));
    window.addEventListener('click', close, { once: true });
    return () => window.removeEventListener('click', close);
  }, [contextMenu.visible]);

  const menuItems: ContextMenuItem[] = [
    {
      label: 'View Details',
      action: () => {
        node.emit('tap');
        setContextMenu((prev) => ({ ...prev, visible: false }));
      },
    },
    {
      label: 'Highlight Path',
      action: () => {
        // Highlight predecessor path
        const predecessors = node.predecessors();
        cy.elements().removeClass('highlight');
        predecessors.add(node).addClass('highlight');
        setContextMenu((prev) => ({ ...prev, visible: false }));
      },
    },
    {
      label: 'Focus Node',
      action: () => {
        cy.animate({
          center: { eles: node },
          zoom: 1.5,
          duration: 300,
        });
        setContextMenu((prev) => ({ ...prev, visible: false }));
      },
    },
    {
      label: 'Trace',
      action: () => {
        const traceId = node.data('traceId');
        if (traceId) {
          window.open(`/traces/${traceId}`, '_blank');
        }
        setContextMenu((prev) => ({ ...prev, visible: false }));
      },
      disabled: !node.data('traceId'),
    },
    {
      label: 'Cancel Task',
      action: () => {
        // Emit cancellation event
        cy.emit('taskCancel', [node.id()]);
        setContextMenu((prev) => ({ ...prev, visible: false }));
      },
      danger: true,
      disabled: !['pending', 'running'].includes(node.data('status')),
    },
  ];

  return (
    <>
      {/* Hover tooltip */}
      <div
        ref={tooltipRef}
        className="dag-tooltip"
        style={{
          position: 'absolute',
          zIndex: 100,
          pointerEvents: 'none',
          opacity: 0,
          transition: prefersReducedMotion ? 'none' : 'opacity 0.2s',
        }}
      >
        {tooltipContent()}
      </div>

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          className="dag-context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 200,
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`ctx-item ${item.danger ? 'ctx-item--danger' : ''} ${item.disabled ? 'ctx-item--disabled' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!item.disabled) item.action();
              }}
              disabled={item.disabled}
            >
              {item.icon && <span className="ctx-icon">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
});

export default DAGNode;
