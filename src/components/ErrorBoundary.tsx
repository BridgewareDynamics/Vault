import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-800/95 backdrop-blur-md rounded-lg border-2 border-red-500/50 shadow-2xl p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-3xl font-bold bg-gradient-purple bg-clip-text text-transparent mb-4">
                Something went wrong
              </h2>
              <p className="text-gray-300 text-lg mb-2">
                An unexpected error occurred in the application.
              </p>
              {this.state.error && (
                <div className="mt-4 p-4 bg-red-900/50 border border-red-500/50 rounded-lg">
                  <p className="text-red-200 text-sm font-mono break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-gradient-purple hover:opacity-90 text-white rounded-full font-semibold transition-opacity border border-cyber-purple-500/60 shadow-lg"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-semibold transition-colors border border-cyber-purple-500/60 shadow-lg"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



