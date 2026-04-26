import React, { useState, useEffect, useRef } from 'react';
import { TaskNode, ToolCall } from '../../lib/cytoscape-config';

interface TaskDetailDrawerProps {
  task: TaskNode | null;
  open: boolean;
  onClose: () => void;
  piiRedacted?: boolean;
  onToggleRedaction?: () => void;
}

const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = React.memo(({
  task,
  open,
  onClose,
  piiRedacted = true,
  onToggleRedaction,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'prompt' | 'tools' | 'result' | 'trace'>('overview');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'prompt' as const, label: 'Prompt' },
    { key: 'tools' as const, label: 'Tools' },
    { key: 'result' as const, label: 'Result' },
    { key: 'trace' as const, label: 'Trace' },
  ];

  useEffect(() => {
    if (open) {
      setActiveTab('overview');
      // Focus trap: focus close button when drawer opens
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [open, task?.id]);

  // Focus trap: keep focus inside drawer
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open || !task) return null;

  const redact = (text: string): string => {
    if (!piiRedacted) return text;
    // Simple PII redaction patterns
    return text
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
      .replace(/\b\+?\d[\d\s-]{7,}\d\b/g, '[PHONE]');
  };

  const statusClass = `status-badge status-badge--${task.status}`;

  return (
    <div className="task-detail-drawer">
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Drawer panel */}
      <div className="drawer-panel" ref={panelRef}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-header__top">
            <div className="drawer-title-group">
              <span className={statusClass}>{task.status}</span>
              <h3 className="drawer-title">{task.label}</h3>
            </div>
            <button className="drawer-close" ref={closeButtonRef} onClick={onClose} aria-label="Close drawer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="drawer-meta">
            <span className="meta-item">
              <strong>Kind:</strong> {task.kind}
            </span>
            <span className="meta-item">
              <strong>ID:</strong> <code>{task.id}</code>
            </span>
            {task.attempts !== undefined && (
              <span className="meta-item">
                <strong>Attempts:</strong> {task.attempts}
              </span>
            )}
          </div>

          {/* PII toggle */}
          {onToggleRedaction && (
            <label className="pii-toggle">
              <input
                type="checkbox"
                checked={piiRedacted}
                onChange={onToggleRedaction}
              />
              <span>PII Redacted</span>
            </label>
          )}
        </div>

        {/* Tabs */}
        <div className="drawer-tabs" role="tablist" aria-label="Task details">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              tabIndex={activeTab === tab.key ? 0 : -1}
              className={`drawer-tab ${activeTab === tab.key ? 'drawer-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="drawer-content">
          {activeTab === 'overview' && (
            <div id="tabpanel-overview" role="tabpanel" aria-labelledby="tab-overview" className="tab-panel tab-panel--overview">
              {task.description && (
                <div className="panel-section">
                  <h4>Description</h4>
                  <p className="panel-text">{redact(task.description)}</p>
                </div>
              )}

              {task.metadata && (
                <div className="panel-section">
                  <h4>Metadata</h4>
                  <pre className="panel-pre">
                    {redact(JSON.stringify(task.metadata, null, 2))}
                  </pre>
                </div>
              )}

              <div className="panel-section">
                <h4>Summary</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Status</span>
                    <span className={`summary-value summary-value--${task.status}`}>{task.status}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Kind</span>
                    <span className="summary-value">{task.kind}</span>
                  </div>
                  {task.attempts !== undefined && (
                    <div className="summary-item">
                      <span className="summary-label">Attempts</span>
                      <span className="summary-value">{task.attempts}</span>
                    </div>
                  )}
                  {task.toolCalls && (
                    <div className="summary-item">
                      <span className="summary-label">Tool Calls</span>
                      <span className="summary-value">{task.toolCalls.length}</span>
                    </div>
                  )}
                  {task.traceId && (
                    <div className="summary-item">
                      <span className="summary-label">Trace</span>
                      <a href={`/traces/${task.traceId}`} className="summary-link" target="_blank" rel="noopener noreferrer">
                        {task.traceId.slice(0, 16)}...
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prompt' && (
            <div id="tabpanel-prompt" role="tabpanel" aria-labelledby="tab-prompt" className="tab-panel tab-panel--prompt">
              {task.prompt ? (
                <div className="panel-section">
                  <h4>Prompt</h4>
                  <pre className="panel-pre panel-pre--prompt">{redact(task.prompt)}</pre>
                </div>
              ) : (
                <div className="panel-empty">No prompt available for this task.</div>
              )}
            </div>
          )}

          {activeTab === 'tools' && (
            <div id="tabpanel-tools" role="tabpanel" aria-labelledby="tab-tools" className="tab-panel tab-panel--tools">
              {task.toolCalls && task.toolCalls.length > 0 ? (
                <div className="tool-list">
                  {task.toolCalls.map((tc: ToolCall, idx: number) => (
                    <div key={idx} className="tool-card">
                      <div className="tool-card__header">
                        <span className="tool-name">{tc.tool}</span>
                        {tc.duration !== undefined && (
                          <span className="tool-duration">{tc.duration}ms</span>
                        )}
                        {tc.error && <span className="tool-error-badge">Error</span>}
                      </div>
                      <div className="tool-card__body">
                        <div className="tool-section">
                          <h5>Input</h5>
                          <pre className="panel-pre">{redact(JSON.stringify(tc.input, null, 2))}</pre>
                        </div>
                        {tc.output !== undefined && (
                          <div className="tool-section">
                            <h5>Output</h5>
                            <pre className="panel-pre">{redact(JSON.stringify(tc.output, null, 2))}</pre>
                          </div>
                        )}
                        {tc.error && (
                          <div className="tool-section">
                            <h5>Error</h5>
                            <pre className="panel-pre panel-pre--error">{tc.error}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel-empty">No tool calls recorded.</div>
              )}
            </div>
          )}

          {activeTab === 'result' && (
            <div id="tabpanel-result" role="tabpanel" aria-labelledby="tab-result" className="tab-panel tab-panel--result">
              {task.result !== undefined ? (
                <div className="panel-section">
                  <h4>Structured Result</h4>
                  <pre className="panel-pre">
                    {redact(
                      typeof task.result === 'string'
                        ? task.result
                        : JSON.stringify(task.result, null, 2)
                    )}
                  </pre>
                </div>
              ) : (
                <div className="panel-empty">No result available yet.</div>
              )}
            </div>
          )}

          {activeTab === 'trace' && (
            <div id="tabpanel-trace" role="tabpanel" aria-labelledby="tab-trace" className="tab-panel tab-panel--trace">
              {task.traceId ? (
                <div className="panel-section">
                  <h4>Trace Link</h4>
                  <a
                    href={`/traces/${task.traceId}`}
                    className="trace-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open trace in new tab
                  </a>
                  <div className="trace-id">
                    <code>{task.traceId}</code>
                  </div>

                  <h4 style={{ marginTop: 16 }}>Trace Replay</h4>
                  <p className="panel-text">
                    Simulate the execution of this task with the recorded inputs.
                  </p>
                  <button className="btn btn--primary">Replay Task</button>
                </div>
              ) : (
                <div className="panel-empty">No trace linked to this task.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TaskDetailDrawer;
