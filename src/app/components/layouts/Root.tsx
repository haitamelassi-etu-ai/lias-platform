import { Outlet, Link, useLocation } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { Menu, X, LogOut, ChevronRight, Beaker } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function Root() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicNav = [
    { name: "Accueil", href: "/" },
    { name: "Axes de recherche", href: "/axes" },
    { name: "Membres", href: "/members" },
    { name: "Projets", href: "/projects" },
    { name: "Publications", href: "/publications" },
    { name: "Événements", href: "/events" },
  ];

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
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-tertiary">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-brand-secondary flex items-center justify-center text-white group-hover:bg-brand-primary transition-colors">
                  <Beaker size={20} />
                </div>
                <span className="font-sans font-bold text-xl tracking-tight text-brand-primary">LIAS</span>
              </Link>
            </div>

            {/* Desktop Public Nav */}
            <nav className="hidden md:flex space-x-8">
              {publicNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? "text-brand-secondary border-b-2 border-brand-secondary"
                      : "text-text-secondary hover:text-brand-primary"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
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
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-text-secondary hover:text-brand-primary p-2"
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
        {user && (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/member') || location.pathname.startsWith('/admin')) && (
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

      <footer className="bg-brand-primary text-brand-tertiary py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Beaker size={24} className="text-brand-secondary" />
                <span className="font-sans font-bold text-2xl tracking-tight text-white">LIAS</span>
              </div>
              <p className="font-serif text-brand-tertiary/70 max-w-md">
                Laboratoire d'Informatique et d'Analyse des Systèmes.
                Pôle d'excellence en recherche et innovation à la Faculté des Sciences Ben M'Sik.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Navigation</h4>
              <ul className="space-y-2 font-serif text-brand-tertiary/70">
                <li><Link to="/axes" className="hover:text-brand-secondary transition-colors">Axes de recherche</Link></li>
                <li><Link to="/members" className="hover:text-brand-secondary transition-colors">Membres</Link></li>
                <li><Link to="/publications" className="hover:text-brand-secondary transition-colors">Publications</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Contact</h4>
              <ul className="space-y-2 font-serif text-brand-tertiary/70">
                <li>Faculté des Sciences Ben M'Sik</li>
                <li>Avenue Driss El Harti, Sidi Othmane</li>
                <li>Casablanca, Maroc</li>
                <li>contact@lias.fsb.ac.ma</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center font-serif text-brand-tertiary/50 text-sm">
            © {new Date().getFullYear()} LIAS. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
