import React from "react";
import { Link } from "react-router-dom";
import { btnPrimaryClass, btnSecondaryClass } from "../constants/themeClasses";
import { cn } from "../utils/cn";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center px-4 py-16">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              Unexpected error
            </p>
            <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              The page ran into a problem. You can try again or return home.
            </p>
            {process.env.NODE_ENV !== "production" && this.state.error ? (
              <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                {String(this.state.error.message || this.state.error)}
              </pre>
            ) : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button type="button" onClick={this.handleRetry} className={btnPrimaryClass}>
                Try again
              </button>
              <Link
                to="/"
                className={cn(btnSecondaryClass, "inline-flex items-center justify-center")}
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
