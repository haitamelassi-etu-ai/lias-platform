import { motion } from "motion/react";
import { BookOpenText, Building2, GraduationCap, Target } from "lucide-react";

const figures = [
  "4 équipes permanentes : ISDIAC, SDTIC, ILIAS, SIMA",
  "42 thèses en cours sur la période 2021-2024",
  "28 thèses soutenues sur la période 2021-2024",
  "230+ publications indexées entre 2021 et 2024",
  "8 projets de recherche en cours",
];

export function About() {
  return (
    <div className="space-y-10">
      <section className="max-w-4xl">
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-brand-secondary">
          Laboratoire
        </span>
        <h1 className="mt-3 text-4xl md:text-5xl font-sans font-bold text-brand-primary">
          Présentation, mission et vision
        </h1>
        <p className="mt-5 text-xl text-text-secondary font-serif leading-relaxed">
          Le Laboratoire d’Intelligence Artificielle et Systèmes (LIAS), rattaché à la
          Faculté des Sciences Ben M’Sick de l’Université Hassan II de Casablanca, développe
          des recherches fondamentales et appliquées en IA, science des données, cloud, IoT,
          big data et modélisation mathématique.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-brand-primary/10 rounded-2xl p-8 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3">
            <Target className="text-brand-secondary" size={26} />
            <h2 className="text-2xl font-bold text-brand-primary">Mission</h2>
          </div>
          <p className="font-serif text-lg leading-8 text-text-secondary">
            Le LIAS répond aux enjeux des villes intelligentes dans les domaines de la santé,
            l’éducation, le transport, l’agriculture, la finance et la cybersécurité. Aligné
            sur la vision « Digital Morocco 2030 », le laboratoire vise l’excellence
            scientifique et un impact socio-économique mesurable par l’innovation et les
            partenariats publics-privés.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-brand-tertiary p-5">
              <Building2 size={22} className="text-brand-secondary mb-3" />
              <h3 className="font-bold text-brand-primary mb-2">Ancrage institutionnel</h3>
              <p className="font-serif text-text-secondary">
                Faculté des Sciences Ben M’Sick, Université Hassan II de Casablanca.
              </p>
            </div>
            <div className="rounded-xl bg-brand-tertiary p-5">
              <BookOpenText size={22} className="text-brand-secondary mb-3" />
              <h3 className="font-bold text-brand-primary mb-2">Approche scientifique</h3>
              <p className="font-serif text-text-secondary">
                Recherche fondamentale, expérimentation appliquée et valorisation partenariale.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white border border-brand-primary/10 rounded-2xl p-8 shadow-sm h-fit"
        >
          <div className="flex items-center gap-3 mb-5">
            <GraduationCap className="text-brand-secondary" size={26} />
            <h2 className="text-2xl font-bold text-brand-primary">Chiffres clés</h2>
          </div>
          <ul className="space-y-3">
            {figures.map((figure) => (
              <li key={figure} className="rounded-xl bg-brand-tertiary px-4 py-3 text-text-secondary font-medium">
                {figure}
              </li>
            ))}
          </ul>
        </motion.aside>
      </div>

      <section className="rounded-2xl bg-brand-primary text-white p-8 md:p-10">
        <blockquote className="font-serif text-2xl leading-relaxed max-w-4xl">
          « Au LIAS, nous explorons l’intelligence artificielle comme une force créatrice
          capable de transformer les systèmes, d’inspirer l’innovation et d’éclairer l’avenir
          numérique du Maroc. »
        </blockquote>
      </section>
    </div>
  );
}
