import React from 'react';

interface DAGControlsProps {
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetLayout: () => void;
  onToggleFanOut: () => void;
  fanOutExpanded: boolean;
  zoomLevel: number;
}

const DAGControls: React.FC<DAGControlsProps> = ({
  onFit,
  onZoomIn,
  onZoomOut,
  onResetLayout,
  onToggleFanOut,
  fanOutExpanded,
  zoomLevel,
}) => {
  return (
    <div className="dag-controls">
      <div className="dag-controls__group">
        <button
          className="dag-control-btn"
          onClick={onZoomIn}
          title="Zoom in · +"
          aria-label="Zoom in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <div className="dag-zoom-level" title="Current zoom">
          {Math.round(zoomLevel * 100)}%
        </div>

        <button
          className="dag-control-btn"
          onClick={onZoomOut}
          title="Zoom out · -"
          aria-label="Zoom out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <div className="dag-controls__divider" />

      <div className="dag-controls__group">
        <button
          className="dag-control-btn"
          onClick={onFit}
          title="Fit to screen · F"
          aria-label="Fit to screen"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>

        <button
          className="dag-control-btn"
          onClick={() => {
            // 1:1 zoom
            onFit();
          }}
          title="Zoom 1:1 · 1"
          aria-label="Zoom 1 to 1"
        >
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>1:1</span>
        </button>
      </div>

      <div className="dag-controls__divider" />

      <div className="dag-controls__group">
        <button
          className="dag-control-btn"
          onClick={onResetLayout}
          title="Reset layout"
          aria-label="Reset layout"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>

        <button
          className={`dag-control-btn ${fanOutExpanded ? 'dag-control-btn--active' : ''}`}
          onClick={onToggleFanOut}
          title={fanOutExpanded ? 'Collapse fan-out groups' : 'Expand fan-out groups'}
          aria-label="Toggle fan-out expansion"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {fanOutExpanded ? (
              <>
                <path d="M4 14h6v6H4z" />
                <path d="M14 4h6v6h-6z" />
                <path d="M4 4h6v6H4z" />
                <path d="M14 14h6v6h-6z" />
              </>
            ) : (
              <>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DAGControls;
