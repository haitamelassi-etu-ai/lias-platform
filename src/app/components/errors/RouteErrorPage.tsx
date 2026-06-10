import { Link, isRouteErrorResponse, useNavigate, useRouteError } from "react-router";
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";

function getErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return "La page demandee est introuvable.";
    }
    return error.statusText || `Erreur ${error.status}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}

export function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const message = getErrorMessage(error);

  return (
    <main className="min-h-screen bg-brand-tertiary px-4 py-12 text-brand-primary">
      <section className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle size={28} />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-red-600">
          Erreur application
        </p>
        <h1 className="mt-2 text-3xl font-bold">La page ne peut pas etre affichee</h1>
        <p className="mx-auto mt-3 max-w-xl font-serif text-text-secondary">
          Une erreur a ete interceptee par l'application LIAS. Le portail reste
          disponible, vous pouvez revenir en arriere ou retourner a l'accueil.
        </p>
        <p className="mx-auto mt-4 max-w-xl rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {message}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/15 px-4 py-2.5 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-tertiary"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-secondary"
          >
            <RefreshCw size={16} />
            Recharger
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/15 px-4 py-2.5 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-tertiary"
          >
            <Home size={16} />
            Accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
