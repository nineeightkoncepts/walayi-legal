import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  // A label shown in the fallback (e.g. the tab name) so it's clear which
  // section failed, without taking the rest of the app down with it.
  label?: string;
  // Bump this to force the boundary to drop its error and try rendering
  // children again (e.g. pass the active tab id so switching tabs recovers).
  resetKey?: string | number;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Confines a render crash to the section that threw it. Without this,
 * an uncaught error anywhere in the tree unmounts the entire React app to a
 * blank screen — including the navigation itself — so every other tab
 * looks "broken" even though only one section actually failed.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`ErrorBoundary caught an error in ${this.props.label || 'a section'}:`, error, info);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3" role="alert">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-rose-900">
              {this.props.label ? `${this.props.label} couldn't load` : "This section couldn't load"}
            </h3>
            <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">
              Something went wrong rendering this section. The rest of the console is unaffected — try another tab, or retry this one.
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
