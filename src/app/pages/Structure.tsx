import { motion } from "motion/react";
import { Network, UserRoundCheck, UsersRound } from "lucide-react";

const leadership = [
  { name: "Pr. Faouzia Benabbou", role: "Directrice du laboratoire" },
  { name: "Pr. Abdessamad Belangour", role: "Directeur adjoint" },
];

const teams = [
  {
    name: "ISDIAC",
    lead: "Pr. Nawal Sael",
    themes: ["IA", "Cloud", "NLP", "Sciences de données"],
    members: ["Faouzia Benabbou", "Nawal Sael", "Amal Zaouch", "Fouzia Elazzaby"],
  },
  {
    name: "SIMA",
    lead: "Pr. Mohammed Ait Daoud",
    themes: ["Systèmes intelligents", "Modélisation avancée", "Technologies cognitives"],
    members: ["Mohammed AIT DAOUD", "Khadija Achtaich", "Mostafa Hanoune", "Nabil AHARRANE"],
  },
  {
    name: "SDTIC",
    lead: "Pr. Sara Ouahabi",
    themes: ["Technologie intelligente", "Architecture IoT", "Mathématiques appliquées"],
    members: ["Sara Ouahabi", "Sanaa El filali", "Rachida AIT ABDELOUAHID", "Naceur Achtaich"],
  },
  {
    name: "ILIAS",
    lead: "Pr. Abdelaziz Ettaoufik",
    themes: ["Ingénierie logicielle", "Architectures de données", "Modélisation mathématique"],
    members: ["Abdessamad Belangour", "Youssef Sekhara", "Driss Bouggar"],
  },
];

export function Structure() {
  return (
    <div className="space-y-10">
      <section className="max-w-4xl">
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-brand-secondary">
          Organigramme
        </span>
        <h1 className="mt-3 text-4xl md:text-5xl font-sans font-bold text-brand-primary">
          Structure du laboratoire
        </h1>
        <p className="mt-5 text-xl text-text-secondary font-serif leading-relaxed">
          Le LIAS est structuré autour d’une direction scientifique et de quatre équipes
          permanentes couvrant l’IA, les données, l’IoT, la cybersécurité et la modélisation.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {leadership.map((person, index) => (
          <motion.article
            key={person.name}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="bg-white border border-brand-primary/10 rounded-2xl p-6 shadow-sm"
          >
            <UserRoundCheck className="text-brand-secondary mb-4" size={28} />
            <h2 className="text-2xl font-bold text-brand-primary">{person.name}</h2>
            <p className="mt-1 text-text-secondary font-serif">{person.role}</p>
          </motion.article>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team, index) => (
          <motion.article
            key={team.name}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="bg-white border border-brand-primary/10 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-brand-primary">{team.name}</h2>
                <p className="text-brand-secondary font-bold mt-1">{team.lead}</p>
              </div>
              <Network className="text-brand-secondary shrink-0" size={26} />
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {team.themes.map((theme) => (
                <span key={theme} className="rounded-full bg-brand-secondary/10 px-3 py-1 text-sm font-medium text-brand-secondary">
                  {theme}
                </span>
              ))}
            </div>
            <div className="rounded-xl bg-brand-tertiary p-4">
              <div className="flex items-center gap-2 text-brand-primary font-bold mb-3">
                <UsersRound size={18} /> Membres
              </div>
              <p className="text-text-secondary font-serif leading-7">{team.members.join(", ")}</p>
            </div>
          </motion.article>
        ))}
      </section>
    </div>
  );
}
