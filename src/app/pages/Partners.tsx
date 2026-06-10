import { motion } from "motion/react";
import { Handshake, Network } from "lucide-react";

const partners = [
  "Université Mohammed V — LRI",
  "EMSI — LPRI",
  "Université de Liège",
  "ABA Technology Maroc",
  "Tech-IT Maroc",
  "Stefan cel Mare University, Suceava",
];

export function Partners() {
  return (
    <div className="space-y-10">
      <section className="max-w-4xl">
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-brand-secondary">
          Réseaux
        </span>
        <h1 className="mt-3 text-4xl md:text-5xl font-sans font-bold text-brand-primary">
          Partenaires et collaborations
        </h1>
        <p className="mt-5 text-xl text-text-secondary font-serif leading-relaxed">
          Les activités du LIAS s’appuient sur des collaborations académiques, industrielles
          et technologiques au Maroc et à l’international.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {partners.map((partner, index) => (
          <motion.article
            key={partner}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-brand-primary/10 rounded-2xl p-6 shadow-sm"
          >
            <Handshake className="text-brand-secondary mb-4" size={28} />
            <h2 className="text-xl font-bold text-brand-primary">{partner}</h2>
          </motion.article>
        ))}
      </section>

      <section className="rounded-2xl bg-brand-primary text-white p-8 md:p-10">
        <Network className="text-brand-secondary mb-4" size={30} />
        <h2 className="text-2xl font-bold mb-3">Axes de collaboration</h2>
        <p className="font-serif text-white/75 leading-8 max-w-4xl">
          Projets IA & Smart Cities, architectures Edge-Fog-Cloud, cybersécurité,
          mobilité intelligente, e-santé, données et innovation public-privé.
        </p>
      </section>
    </div>
  );
}
