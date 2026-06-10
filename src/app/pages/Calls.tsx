import { motion } from "motion/react";
import { ExternalLink, FileText, Send } from "lucide-react";

const calls = [
  {
    title: "ICISCT 2026 — Innovative Smart City Technologies",
    type: "Appel à communication",
    description:
      "Conférence internationale autour de l’IA, l’IoT, la science des données, la cybersécurité, les systèmes urbains durables et la transformation numérique.",
    link: "https://lias.ma/icisct/submissions",
    action: "Guide de soumission",
  },
  {
    title: "ICAIS 2025 — Artificial Intelligence and Systems",
    type: "Appel scientifique",
    description:
      "Rendez-vous scientifique dédié à l’innovation et à la recherche en intelligence artificielle et systèmes.",
    link: "https://lias.ma/",
    action: "Voir l’annonce",
  },
];

export function Calls() {
  return (
    <div>
      <div className="mb-12 max-w-4xl">
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-brand-secondary">
          Opportunités
        </span>
        <h1 className="mt-3 text-4xl md:text-5xl font-sans font-bold text-brand-primary">
          Appels à communication et appels à projets
        </h1>
        <p className="mt-5 text-xl text-text-secondary font-serif leading-relaxed">
          Consultez les appels ouverts liés aux conférences, journées scientifiques et projets
          portés ou relayés par le laboratoire.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {calls.map((call, index) => (
          <motion.article
            key={call.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="bg-white border border-brand-primary/10 rounded-2xl p-6 md:p-8 shadow-sm"
          >
            <div className="flex items-center gap-2 text-brand-secondary font-bold mb-4">
              <FileText size={20} /> {call.type}
            </div>
            <h2 className="text-2xl font-bold text-brand-primary">{call.title}</h2>
            <p className="mt-4 text-text-secondary font-serif leading-7">{call.description}</p>
            <a
              href={call.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 font-bold text-white transition-colors hover:bg-brand-secondary"
            >
              {call.action} <ExternalLink size={16} />
            </a>
          </motion.article>
        ))}
      </div>

      <section className="mt-8 rounded-2xl bg-brand-tertiary border border-brand-primary/10 p-6 md:p-8">
        <div className="flex items-center gap-3 text-brand-primary font-bold mb-2">
          <Send size={20} /> Soumettre une proposition
        </div>
        <p className="font-serif text-text-secondary leading-7">
          Les appels peuvent concerner des communications, projets collaboratifs, ateliers ou
          journées doctorales. Les informations officielles sont publiées au fur et à mesure
          de leur ouverture.
        </p>
      </section>
    </div>
  );
}
