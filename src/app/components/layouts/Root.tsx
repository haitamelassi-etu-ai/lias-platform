import { Outlet, Link, useLocation } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { Menu, X, LogOut, ChevronRight, ChevronDown, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import liasLogo from "../../../assets/lias-logo-transparent.png";
import liasLogoDark from "../../../assets/lias-logo-dark-transparent.png";
import uh2cLogo from "../../../assets/uh2c-logo.png";

export function Root() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const savedTheme = window.localStorage.getItem("lias-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    window.localStorage.setItem("lias-theme", theme);
  }, [theme]);

  useEffect(() => {
    const pageTitles: Record<string, string> = {
      "/": "Accueil",
      "/about": "Laboratoire",
      "/structure": "Structure",
      "/axes": "Axes de recherche",
      "/members": "Membres",
      "/projects": "Projets",
      "/publications": "Publications",
      "/events": "Événements",
      "/news": "Actualités",
      "/partners": "Partenaires",
      "/gallery": "Galerie",
      "/calls": "Appels",
      "/contact": "Contact",
      "/login": "Connexion",
      "/register": "Inscription",
      "/admin/panel": "Panel administrateur",
      "/admin/moderation": "Modération",
      "/admin/content": "Gestion des contenus",
      "/admin/audit-logs": "Historique admin",
      "/member/panel": "Espace membre",
      "/dashboard": "Dashboard",
      "/profile": "Profil",
    };

    document.title = `${pageTitles[location.pathname] ?? "LIAS"} | LIAS`;
    setResourcesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!resourcesOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setResourcesOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [resourcesOpen]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };
  const logoSrc = theme === "dark" ? liasLogoDark : liasLogo;
  const workspaceLogoSrc = liasLogoDark;

  const primaryNav = [
    { name: "Accueil", href: "/" },
    { name: "Laboratoire", href: "/about" },
    { name: "Axes de recherche", href: "/axes" },
    { name: "Membres", href: "/members" },
    { name: "Publications", href: "/publications" },
    { name: "Contact", href: "/contact" },
  ];

  const resourceNav = [
    { name: "Projets", href: "/projects" },
    { name: "Actualités", href: "/news" },
    { name: "Événements", href: "/events" },
    { name: "Structure", href: "/structure" },
    { name: "Partenaires", href: "/partners" },
    { name: "Galerie", href: "/gallery" },
    { name: "Appels", href: "/calls" },
  ];
  const publicNav = [...primaryNav, ...resourceNav];
  const isResourceActive = resourceNav.some((item) => location.pathname === item.href);

  const memberNav = [
    { name: "Panel professionnel", href: "/member/panel" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Mon Profil", href: "/profile" },
    { name: "Mes Publications", href: "/publications" },
  ];

  const adminNav = [
    { name: "Panel administrateur", href: "/admin/panel" },
    { name: "Vue Globale", href: "/dashboard" },
    { name: "Modération", href: "/admin/moderation" },
    { name: "Gestion des contenus", href: "/admin/content" },
    { name: "Historique admin", href: "/admin/audit-logs" },
  ];

  const isWorkspacePath =
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/dashboard/") ||
    location.pathname === "/profile" ||
    location.pathname.startsWith("/profile/") ||
    location.pathname === "/member/panel" ||
    location.pathname.startsWith("/member/") ||
    location.pathname === "/admin/panel" ||
    location.pathname.startsWith("/admin/");
  const workspaceNav = user?.role === "admin" ? adminNav : memberNav;
  const workspaceTitle = user?.role === "admin" ? "Administration LIAS" : "Espace membre LIAS";

  if (isWorkspacePath) {
    return (
      <div className="min-h-screen bg-slate-50 text-text-primary">
        <header className="sticky top-0 z-50 border-b border-slate-700/60 bg-slate-950/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-200 md:hidden"
                aria-label="Ouvrir le menu prive"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Link to={user?.role === "admin" ? "/admin/panel" : "/member/panel"} className="flex items-center gap-3">
                <span className="inline-flex rounded-md bg-slate-900 px-2 py-1">
                  <img src={workspaceLogoSrc} alt="LIAS" className="h-9 w-auto max-w-[128px] object-contain" />
                </span>
                <span className="hidden border-l border-slate-700 pl-3 text-sm font-bold text-white sm:inline">
                  {workspaceTitle}
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 transition-colors hover:text-white"
                aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {user && (
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold text-white">{user.full_name}</p>
                  <p className="text-xs uppercase tracking-wider text-cyan-200/80">{user.role}</p>
                </div>
              )}
              <button
                type="button"
                onClick={logout}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 transition-colors hover:border-rose-400 hover:text-rose-300"
                title="Deconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-4rem)]">
          <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950 p-5 md:block">
            <div className="sticky top-20">
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                {workspaceTitle}
              </p>
              <nav className="mt-4 space-y-1">
                {workspaceNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                      location.pathname === item.href
                        ? "bg-cyan-400/15 text-cyan-200"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.name}
                    {location.pathname === item.href && <ChevronRight size={16} />}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-bold text-white">Portail isolé</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Les outils internes sont séparés du site public.
                </p>
              </div>
            </div>
          </aside>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.aside
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="fixed inset-x-4 top-20 z-50 rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-xl md:hidden"
              >
                {workspaceNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block rounded-xl px-3 py-2.5 text-sm font-bold ${
                      location.pathname === item.href
                        ? "bg-cyan-400/15 text-cyan-200"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </motion.aside>
            )}
          </AnimatePresence>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-tertiary">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <span className="inline-flex">
                  <img
                    src={logoSrc}
                    alt="LIAS"
                    className="h-10 w-auto max-w-[132px] object-contain"
                  />
                </span>
              </Link>
            </div>

            {/* Desktop Public Nav */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
              {primaryNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-xs lg:text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? "text-brand-secondary border-b-2 border-brand-secondary"
                      : "text-text-secondary hover:text-brand-primary"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="relative" ref={resourcesRef}>
                <button
                  type="button"
                  onClick={() => setResourcesOpen((open) => !open)}
                  aria-haspopup="true"
                  aria-expanded={resourcesOpen}
                  className={`inline-flex items-center gap-1 px-1 pt-1 text-xs lg:text-sm font-medium transition-colors ${
                    isResourceActive || resourcesOpen
                      ? "text-brand-secondary border-b-2 border-brand-secondary"
                      : "text-text-secondary hover:text-brand-primary"
                  }`}
                >
                  Ressources
                  <ChevronDown
                    size={15}
                    className={`transition-transform ${resourcesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {resourcesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full z-50 mt-3 w-56 rounded-xl border border-brand-primary/10 bg-white p-2 shadow-xl"
                    >
                      {resourceNav.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setResourcesOpen(false)}
                          className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            location.pathname === item.href
                              ? "bg-brand-secondary/10 text-brand-secondary"
                              : "text-text-secondary hover:bg-brand-tertiary hover:text-brand-primary"
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-brand-primary/10 bg-white/80 text-text-secondary transition-colors hover:text-brand-primary hover:border-brand-secondary/40"
                aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
                title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-bold text-brand-primary">{user.full_name}</span>
                    <span className="text-xs text-brand-accent uppercase tracking-wider">{user.role}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-text-secondary hover:text-brand-accent transition-colors"
                    title="Déconnexion"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary transition-colors"
                >
                  Connexion Membre
                </Link>
              )}
            </div>

            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={toggleTheme}
                className="mr-1 inline-flex h-10 w-10 items-center justify-center rounded-md border border-brand-primary/10 bg-white/80 text-text-secondary transition-colors hover:text-brand-primary"
                aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-text-secondary hover:text-brand-primary p-2"
                aria-label="Ouvrir le menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-brand-primary/10"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {publicNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-brand-tertiary ${
                    location.pathname === item.href ? "text-brand-secondary bg-brand-tertiary" : "text-text-primary"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {user && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider border-t border-gray-100 mt-2 pt-3">
                    {user.role === "admin" ? "Espace Administrateur" : "Espace Membre"}
                  </div>
                  {(user.role === "admin" ? adminNav : memberNav).map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-brand-tertiary ${
                        location.pathname === item.href ? "text-brand-secondary bg-brand-tertiary" : "text-text-primary"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 mt-1"
                  >
                    Déconnexion
                  </button>
                </>
              )}
              {!user && (
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-brand-secondary hover:bg-brand-tertiary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connexion Membre
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* Sidebar for Authenticated Users on Dashboard/Profile routes */}
        {user && isWorkspacePath && (
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-brand-primary/5 p-4 sticky top-24">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4 px-3">
                {user.role === 'admin' ? 'Espace Administrateur' : 'Espace Membre'}
              </h3>
              <nav className="space-y-1">
                {(user.role === 'admin' ? adminNav : memberNav).map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === item.href
                        ? "bg-brand-secondary/10 text-brand-secondary"
                        : "text-text-secondary hover:bg-brand-tertiary hover:text-brand-primary"
                    }`}
                  >
                    {item.name}
                    {location.pathname === item.href && <ChevronRight size={16} />}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <footer className="bg-brand-primary text-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <img
                  src={liasLogoDark}
                  alt="LIAS"
                  className="h-12 w-auto max-w-[210px] object-contain"
                />
                <div className="inline-flex items-center rounded-lg bg-white/95 px-3 py-2">
                  <img
                    src={uh2cLogo}
                    alt="Université Hassan II de Casablanca"
                    className="h-10 w-auto object-contain"
                  />
                </div>
              </div>
              <p className="font-serif text-white/70 max-w-md">
                Laboratoire d'Informatique et d'Analyse des Systèmes.
                Pôle d'excellence en recherche et innovation à la Faculté des Sciences Ben M'Sik,
                Université Hassan II de Casablanca.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Navigation</h4>
              <ul className="grid grid-cols-2 gap-x-5 gap-y-2 font-serif text-white/70">
                <li><Link to="/about" className="hover:text-brand-secondary transition-colors">Présentation</Link></li>
                <li><Link to="/structure" className="hover:text-brand-secondary transition-colors">Structure</Link></li>
                <li><Link to="/axes" className="hover:text-brand-secondary transition-colors">Axes de recherche</Link></li>
                <li><Link to="/members" className="hover:text-brand-secondary transition-colors">Membres</Link></li>
                <li><Link to="/publications" className="hover:text-brand-secondary transition-colors">Publications</Link></li>
                <li><Link to="/projects" className="hover:text-brand-secondary transition-colors">Projets</Link></li>
                <li><Link to="/events" className="hover:text-brand-secondary transition-colors">Événements</Link></li>
                <li><Link to="/news" className="hover:text-brand-secondary transition-colors">Actualités</Link></li>
                <li><Link to="/partners" className="hover:text-brand-secondary transition-colors">Partenaires</Link></li>
                <li><Link to="/gallery" className="hover:text-brand-secondary transition-colors">Galerie</Link></li>
                <li><Link to="/calls" className="hover:text-brand-secondary transition-colors">Appels</Link></li>
                <li><Link to="/contact" className="hover:text-brand-secondary transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Contact</h4>
              <ul className="space-y-2 font-serif text-white/70">
                <li>Faculté des Sciences Ben M'Sik</li>
                <li>Université Hassan II de Casablanca</li>
                <li>B.P. 7955 Sidi-Othmane, Casablanca, Maroc</li>
                <li><a href="mailto:lias.fsbm@gmail.com" className="hover:text-brand-secondary transition-colors">lias.fsbm@gmail.com</a></li>
                <li><a href="tel:+212661442427" className="hover:text-brand-secondary transition-colors">(+212) 6 61 44 24 27</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center font-serif text-white/50 text-sm">
            © {new Date().getFullYear()} LIAS. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
