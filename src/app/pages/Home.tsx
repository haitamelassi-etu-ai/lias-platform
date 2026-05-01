import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight, BookOpen, Users, Activity, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

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
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1772299338379-d0873c1b66b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzY2llbmNlJTIwbGFib3JhdG9yeSUyMGJ1aWxkaW5nfGVufDF8fHx8MTc3NjIxMjU5MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Laboratoire LIAS"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-primary/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/90 via-brand-primary/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div initial="hidden" animate="visible" variants={containerVariants}>
            <motion.h1 
              variants={itemVariants}
              className="font-sans text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight"
            >
              Excellence en <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-brand-accent">
                Recherche Informatique
              </span>
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="font-serif text-xl md:text-2xl max-w-3xl mx-auto mb-10 text-brand-tertiary/90 font-light"
            >
              Le Laboratoire d'Informatique et d'Analyse des Systèmes de la Faculté des Sciences Ben M'Sik explore les défis technologiques de demain avec rigueur et innovation.
            </motion.p>
            <motion.div variants={itemVariants} className="flex justify-center gap-4">
              <Link
                to="/axes"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-brand-secondary text-white font-sans font-semibold hover:bg-white hover:text-brand-primary transition-all shadow-lg hover:shadow-xl"
              >
                Découvrir nos axes <ArrowRight size={20} />
              </Link>
              <Link
                to="/publications"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-transparent border-2 border-brand-tertiary text-white font-sans font-semibold hover:bg-brand-tertiary/10 transition-all"
              >
                Parcourir les publications
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-brand-primary text-brand-tertiary py-12 border-t border-brand-tertiary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-brand-tertiary/10">
            {[
              { label: "Membres Actifs", value: "85+", icon: Users },
              { label: "Publications/an", value: "120", icon: BookOpen },
              { label: "Projets ANR/Europe", value: "15", icon: Activity },
              { label: "Partenaires Industriels", value: "40", icon: ExternalLink },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center px-4"
              >
                <stat.icon size={32} className="mx-auto mb-4 text-brand-secondary" />
                <div className="font-sans text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="font-serif text-sm uppercase tracking-widest text-brand-tertiary/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Research Axes */}
      <section className="py-24 bg-brand-tertiary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="font-sans text-4xl font-bold text-brand-primary mb-4">Axes de Recherche</h2>
              <p className="font-serif text-lg text-text-secondary">
                Nos équipes se concentrent sur trois thématiques principales pour faire avancer l'état de l'art technologique.
              </p>
            </div>
            <Link to="/axes" className="inline-flex items-center gap-2 text-brand-secondary font-bold hover:text-brand-primary transition-colors">
              Voir tous les axes <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Données et Modèles",
                desc: "Ingénierie des données, extraction de connaissances, ontologies et bases de données complexes.",
                img: "https://images.unsplash.com/photo-1760531932521-8eb5a064dbca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwZGF0YSUyMG5ldHdvcmt8ZW58MXx8fHwxNzc2MjEyNTkzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              },
              {
                title: "Automatique et Systèmes",
                desc: "Contrôle-commande, diagnostic, systèmes à paramètres distribués et modélisation énergétique.",
                img: "https://images.unsplash.com/photo-1707944746042-e4c81c191812?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2llbnRpc3RzJTIwcmVzZWFyY2glMjBsYWJ8ZW58MXx8fHwxNzc2MjEyNTkzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              },
              {
                title: "Ingénierie des Systèmes",
                desc: "Architecture des systèmes embarqués, optimisation temps réel et cybersécurité matérielle.",
                img: "https://images.unsplash.com/photo-1762968269894-1d7e1ce8894e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25mZXJlbmNlJTIwZXZlbnQlMjBwcmVzZW50YXRpb258ZW58MXx8fHwxNzc2MjEyNTkzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              }
            ].map((axe, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="group cursor-pointer flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-brand-primary/5"
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback src={axe.img} alt={axe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-brand-primary/20 group-hover:bg-transparent transition-colors duration-500" />
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="font-sans text-2xl font-bold text-brand-primary mb-3 group-hover:text-brand-secondary transition-colors">{axe.title}</h3>
                  <p className="font-serif text-text-secondary mb-6 flex-1">{axe.desc}</p>
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary mt-auto">
                    Explorer <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
