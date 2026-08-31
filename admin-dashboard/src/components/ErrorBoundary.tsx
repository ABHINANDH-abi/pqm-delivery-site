import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error('Admin Console ErrorBoundary caught error:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl space-y-4">
            <span className="text-5xl block">⚠️</span>
            <h2 className="text-xl font-extrabold text-white">Admin Portal Session Notice</h2>
            <p className="text-xs text-slate-300">
              The Admin Dashboard encountered a temporary view state change. Tap below to refresh the console view.
            </p>
            {this.state.error?.message && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left overflow-x-auto">
                <p className="text-[11px] font-mono text-amber-400">{this.state.error.message}</p>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              🔄 Refresh Dashboard View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
