// path: src/components/WordEditor/WordEditorErrorBoundary.tsx

import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../../utils/logger';
import { WordEditorErrorFallback } from './WordEditorErrorFallback';

interface WordEditorErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WordEditorErrorBoundary extends Component<WordEditorErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('WordEditorErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <WordEditorErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}







