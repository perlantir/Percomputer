"use client";

import * as React from "react";
import { ErrorState } from "@/src/components/ui/error-state";

interface ConsoleErrorBoundaryProps {
  children: React.ReactNode;
  label: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ConsoleErrorBoundary extends React.Component<
  ConsoleErrorBoundaryProps,
  State
> {
  constructor(props: ConsoleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Console view "${this.props.label}" crashed:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center p-6">
          <ErrorState
            variant="generic"
            title={`${this.props.label} failed to load`}
            message={
              this.state.error?.message ??
              "An unexpected error occurred while rendering this view."
            }
            retry={() => this.setState({ hasError: false })}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
