import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-sans font-bold text-brand-primary mb-4">404</h1>
      <h2 className="text-2xl font-serif text-text-secondary mb-8">Page en construction</h2>
      <p className="text-text-secondary max-w-md mb-8">
        Cette section du prototype LIAS n'a pas encore été implémentée.
      </p>
      <Link 
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-colors"
      >
        <ArrowLeft size={20} />
        Retour à l'accueil
      </Link>
    </div>
  );
}
