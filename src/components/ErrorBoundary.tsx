import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream-bg flex items-center justify-center p-6 text-gray-700 font-sans">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-sm text-center">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
              <AlertTriangle size={28} />
            </div>

            <h1 className="text-xl font-serif text-charcoal font-semibold mb-2">
              Something went wrong
            </h1>
            
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Metro Connect encountered an unexpected interface error. Your transit network data remains safe.
            </p>

            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
            >
              <RefreshCw size={14} /> Reload Application
            </button>

            {this.state.error && (
              <p className="mt-4 text-[10px] text-gray-400 font-mono truncate">
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
