import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm font-bold text-red-700 mb-1">Something went wrong</p>
          <p className="text-xs text-red-500 mb-3">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-xs font-semibold text-red-600 bg-red-100 px-3 py-1.5 rounded-xl hover:bg-red-200 transition"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
