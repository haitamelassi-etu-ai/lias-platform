import { FormEvent, useState } from "react";
import { Mail, Phone, Send } from "lucide-react";
import { ApiError, submitContactMessage } from "../lib/api";

const contactEmail = "lias.fsbm@gmail.com";
const contactPhone = "(+212) 6 61 44 24 27";

export function Contact() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "fallback" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  const openMailFallback = () => {
    const subject = encodeURIComponent(`Contact LIAS - ${formData.firstName} ${formData.lastName}`);
    const body = encodeURIComponent(
      [
        `Nom: ${formData.lastName}`,
        `Prénom: ${formData.firstName}`,
        `Email: ${formData.email}`,
        "",
        "Message:",
        formData.message,
      ].join("\n"),
    );

    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setFeedback(null);

    try {
      const response = await submitContactMessage({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        message: formData.message,
      });
      setStatus("success");
      setFeedback(response.message);
      setFormData({ firstName: "", lastName: "", email: "", message: "" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setStatus("error");
        setFeedback("Veuillez vérifier les informations saisies avant d’envoyer le message.");
        return;
      }

      setStatus("fallback");
      setFeedback("Le serveur de contact est indisponible. Ouverture de votre application email.");
      openMailFallback();
    }
  };

  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-brand-secondary">
          Contact
        </span>
        <h1 className="mt-3 text-4xl md:text-5xl font-sans font-bold text-brand-primary">
          Contacter le LIAS
        </h1>
        <p className="mt-4 text-xl text-text-secondary font-serif leading-relaxed">
          Pour toute demande scientifique, institutionnelle ou partenariale, vous pouvez
          contacter directement l’équipe du laboratoire.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.4fr] gap-8">
        <aside className="bg-white border border-brand-primary/10 rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-brand-primary mb-5">Coordonnées</h2>
          <div className="mb-4 rounded-xl bg-brand-tertiary px-4 py-3 text-text-secondary font-serif leading-7">
            Faculté des Sciences Ben M’Sick (FSBM)<br />
            Université Hassan II de Casablanca<br />
            B.P. 7955 Sidi-Othmane, Casablanca, Maroc
          </div>
          <div className="space-y-4">
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-3 rounded-xl border border-brand-primary/10 px-4 py-3 text-text-secondary hover:text-brand-secondary hover:border-brand-secondary/40 transition-colors"
            >
              <Mail size={20} />
              <span className="font-medium">{contactEmail}</span>
            </a>
            <a
              href="tel:+212661442427"
              className="flex items-center gap-3 rounded-xl border border-brand-primary/10 px-4 py-3 text-text-secondary hover:text-brand-secondary hover:border-brand-secondary/40 transition-colors"
            >
              <Phone size={20} />
              <span className="font-medium">{contactPhone}</span>
            </a>
          </div>
        </aside>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-brand-primary/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-5"
        >
          <div>
            <h2 className="text-xl font-bold text-brand-primary">Envoyer un message</h2>
            <p className="mt-1 text-sm text-text-secondary font-serif">
              Remplissez ce formulaire pour préparer un email à envoyer au laboratoire.
            </p>
          </div>

          {feedback && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                status === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : status === "error"
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {feedback}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-brand-primary">Prénom</span>
              <input
                required
                type="text"
                autoComplete="given-name"
                placeholder="Votre prénom"
                value={formData.firstName}
                onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/20"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-brand-primary">Nom</span>
              <input
                required
                type="text"
                autoComplete="family-name"
                placeholder="Votre nom"
                value={formData.lastName}
                onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/20"
              />
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-sm font-medium text-brand-primary">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="votre.email@example.com"
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/20"
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-sm font-medium text-brand-primary">Message</span>
            <textarea
              required
              rows={6}
              placeholder="Expliquez brièvement votre demande..."
              value={formData.message}
              onChange={(event) => setFormData({ ...formData, message: event.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/20"
            />
          </label>

          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 font-bold text-white transition-colors hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "sending" ? "Envoi..." : "Envoyer le message"} <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
