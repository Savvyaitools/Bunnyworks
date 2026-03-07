import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLogger } from "@/core/logger";

const log = createLogger("ErrorBoundary");

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional context label for logging (e.g. "PortalSection") */
  context?: string;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const ctx = this.props.context || "App";
    log.error(`Uncaught error in ${ctx}: ${error.message}`, {
      error: error.stack,
      componentStack: errorInfo.componentStack,
    });
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center p-8 max-w-md border border-border rounded-xl bg-card shadow-lg">
            <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-6">
              We encountered an unexpected error. You can try again or refresh the page.
            </p>
            <div className="flex gap-3 justify-center mb-4">
              <Button variant="outline" onClick={this.handleReset} className="gap-2">
                Try Again
              </Button>
              <Button onClick={this.handleReload} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
            </div>
            {this.state.error && (
              <button
                onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
              >
                <ChevronDown className={`h-3 w-3 transition-transform ${this.state.showDetails ? "rotate-180" : ""}`} />
                Technical details
              </button>
            )}
            {this.state.showDetails && this.state.error && (
              <pre className="mt-3 p-3 bg-muted rounded-lg text-xs text-left overflow-auto max-h-40 text-muted-foreground">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
