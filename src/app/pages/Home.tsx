import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight, Activity, BookOpen, ExternalLink, Users } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import fsbmHero from "../../assets/fsbm-hero.jpg";
import uh2cLogo from "../../assets/uh2c-logo.png";

const stats = [
  { label: "Membres actifs", value: "16", icon: Users },
  { label: "Publications", value: "84", icon: BookOpen },
  { label: "Axes de recherche", value: "7", icon: Activity },
  { label: "Projets actifs", value: "2", icon: ExternalLink },
];

const axes = [
  {
    title: "Intelligence artificielle et science des données",
    desc: "Apprentissage automatique, analyse intelligente des données, systèmes décisionnels et modélisation.",
    img: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1080&q=80",
  },
  {
    title: "Cloud, IoT et systèmes intelligents",
    desc: "Architectures distribuées, objets connectés, plateformes cloud et applications pour villes intelligentes.",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&q=80",
  },
  {
    title: "Cybersécurité et modélisation",
    desc: "Sécurité des systèmes, big data, optimisation et modèles mathématiques appliqués aux domaines critiques.",
    img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1080&q=80",
  },
];

export function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-0">
      <section className="relative flex min-h-[620px] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={fsbmHero}
            alt="Faculté des Sciences Ben M'Sik — Université Hassan II de Casablanca"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/55 to-slate-900/85" />
          <div className="absolute inset-0 bg-slate-900/20 mix-blend-multiply" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center text-white sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={containerVariants}>
            <motion.p
              variants={itemVariants}
              className="mb-4 font-sans text-sm font-bold uppercase tracking-[0.24em] text-white/80"
            >
              Laboratoire LIAS
            </motion.p>
            <motion.h1
              variants={itemVariants}
              className="mx-auto mb-6 max-w-5xl font-sans text-5xl font-bold leading-tight tracking-normal md:text-7xl"
            >
              Intelligence artificielle, systèmes et innovation scientifique
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="mx-auto mb-10 max-w-3xl font-serif text-xl font-light leading-relaxed text-white/90 md:text-2xl"
            >
              Le LIAS mène des recherches fondamentales et appliquées en IA, science des données,
              cloud, IoT, big data et modélisation mathématique au service des villes intelligentes.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/axes"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-secondary px-8 py-4 font-sans font-semibold text-white shadow-lg transition-all hover:bg-white hover:text-brand-primary hover:shadow-xl"
              >
                Découvrir nos axes <ArrowRight size={20} />
              </Link>
              <Link
                to="/publications"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/80 bg-transparent px-8 py-4 font-sans font-semibold text-white transition-all hover:bg-white/10"
              >
                Parcourir les publications
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-brand-tertiary/10 bg-brand-primary py-12 text-brand-tertiary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:divide-x md:divide-white/15">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon size={32} className="mx-auto mb-4 text-brand-secondary" />
                <div className="mb-2 font-sans text-4xl font-bold text-white">{stat.value}</div>
                <div className="font-serif text-sm uppercase tracking-widest text-brand-tertiary/70">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-brand-primary/10"
          >
            <ImageWithFallback
              src={fsbmHero}
              alt="Faculté des Sciences Ben M'Sik"
              className="h-full w-full object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4">
              <img
                src={uh2cLogo}
                alt="Université Hassan II de Casablanca"
                className="h-16 w-auto object-contain"
              />
              <span className="text-sm font-bold uppercase tracking-[0.18em] text-brand-secondary">
                Ancrage institutionnel
              </span>
            </div>
            <h2 className="mt-3 font-sans text-4xl font-bold text-brand-primary md:text-5xl">
              Faculté des Sciences Ben M'Sik
            </h2>
            <p className="mt-5 font-serif text-lg leading-8 text-text-secondary">
              Le LIAS est rattaché à la Faculté des Sciences Ben M'Sik, Université Hassan II
              de Casablanca. Le laboratoire s'inscrit dans la stratégie « Digital Morocco 2030 »
              et collabore avec des partenaires académiques et industriels au Maroc et à l'international.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-brand-tertiary p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-secondary">Université</p>
                <p className="mt-1 font-bold text-brand-primary">Hassan II — Casablanca</p>
              </div>
              <div className="rounded-xl bg-brand-tertiary p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-secondary">Faculté</p>
                <p className="mt-1 font-bold text-brand-primary">Sciences Ben M'Sik</p>
              </div>
            </div>
            <Link
              to="/about"
              className="mt-8 inline-flex items-center gap-2 font-bold text-brand-secondary transition-colors hover:text-brand-primary"
            >
              En savoir plus sur le laboratoire <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="bg-brand-tertiary py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="mb-4 font-sans text-4xl font-bold text-brand-primary">
                Axes de recherche
              </h2>
              <p className="font-serif text-lg text-text-secondary">
                Une structuration scientifique autour des technologies intelligentes, de la donnée et
                des systèmes numériques avancés.
              </p>
            </div>
            <Link
              to="/axes"
              className="inline-flex items-center gap-2 font-bold text-brand-secondary transition-colors hover:text-brand-primary"
            >
              Voir tous les axes <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {axes.map((axe, index) => (
              <motion.article
                key={axe.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-primary/5 bg-white shadow-sm transition-all hover:shadow-xl"
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={axe.img}
                    alt={axe.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-brand-primary/20 transition-colors duration-500 group-hover:bg-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <h3 className="mb-3 font-sans text-2xl font-bold text-brand-primary transition-colors group-hover:text-brand-secondary">
                    {axe.title}
                  </h3>
                  <p className="mb-6 flex-1 font-serif text-text-secondary">{axe.desc}</p>
                  <Link
                    to="/axes"
                    className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-brand-primary"
                  >
                    Explorer{" "}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
