import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, WifiOff } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isNetworkError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isNetworkError: false
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const isNetworkError = !!(error.message && (
        error.message.includes('Loading chunk') || 
        error.message.includes('NetworkError') || 
        error.message.includes('Failed to fetch')
    ));
    return { hasError: true, error, isNetworkError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, isNetworkError: false });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, isNetworkError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-viren-50 p-4">
          <div className="bg-white border border-viren-200 p-8 rounded-lg shadow-2xl max-w-md w-full text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
              {this.state.isNetworkError ? <WifiOff size={32} /> : <AlertTriangle size={32} />}
            </div>
            
            <h2 className="text-2xl font-bold text-viren-950 mb-2 font-serif">
                {this.state.isNetworkError ? "Connection Lost" : "Something went wrong"}
            </h2>
            
            <p className="text-viren-600 mb-6 text-sm">
              {this.state.isNetworkError 
                ? "We couldn't load the necessary resources. Please check your internet connection and try again."
                : "We encountered an unexpected error. The system has prevented a full crash."}
            </p>
            
            {!this.state.isNetworkError && (
                <div className="bg-viren-50 p-3 rounded text-left mb-6 overflow-auto max-h-32 border border-viren-200">
                    <p className="text-xs font-mono text-red-500 break-all">{this.state.error?.message}</p>
                </div>
            )}

            <div className="flex gap-3 justify-center">
              <button 
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 bg-viren-950 text-white rounded hover:bg-viren-800 transition-colors text-sm font-bold shadow-lg"
              >
                <RefreshCw size={16} /> {this.state.isNetworkError ? "Retry Connection" : "Reload Page"}
              </button>
              <button 
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2 border border-viren-200 text-viren-950 rounded hover:bg-viren-50 transition-colors text-sm font-bold"
              >
                <Home size={16} /> Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}