import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RefreshCw, RotateCcw } from "lucide-react";

interface AppErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("LIAS UI error", error, errorInfo);
  }

  componentDidUpdate(previousProps: AppErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const message =
      import.meta.env.DEV && this.state.error.message
        ? this.state.error.message
        : "Une erreur inattendue a interrompu l'affichage de cette page.";

    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-brand-primary">
          Probleme d'affichage
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-serif text-text-secondary">
          La page n'a pas pu etre affichee correctement. Vous pouvez reessayer
          sans perdre le reste de votre session.
        </p>
        <p className="mx-auto mt-3 max-w-xl rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {message}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-secondary"
          >
            <RotateCcw size={16} />
            Reessayer
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/15 px-4 py-2.5 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-tertiary"
          >
            <RefreshCw size={16} />
            Recharger
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/15 px-4 py-2.5 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-tertiary"
          >
            <Home size={16} />
            Accueil
          </a>
        </div>
      </section>
    );
  }
}
