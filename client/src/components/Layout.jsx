import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Flame, BarChart3, CreditCard, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';
import DisclaimerBanner from './DisclaimerBanner';

export default function Layout() {
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/scan', label: 'Scanner', icon: Flame },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/pricing', label: 'Pricing', icon: CreditCard },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-toast-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-toast-warmWhite/90 backdrop-blur-md border-b border-toast-gold/20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-3xl group-hover:animate-float">🍞</span>
            <span className="font-heading text-2xl font-bold text-toast-brown">
              Toaster<span className="text-toast-gold">AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive(to)
                    ? 'bg-toast-gold/15 text-toast-brown'
                    : 'text-toast-charcoal/60 hover:text-toast-brown hover:bg-toast-gold/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

            <div className="w-px h-6 bg-toast-gold/20 mx-2" />

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-toast-charcoal/50 bg-toast-gold/10 px-3 py-1 rounded-full">
                  {user.plan === 'premium' ? '🔥 Premium' : `${Math.max(0, user.scansLimit - user.scansUsed)}/${user.scansLimit} toasts`}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-toast-charcoal/50 hover:text-burntRed transition-colors rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 px-5 py-2 bg-toast-gold text-white text-sm font-bold rounded-xl hover:bg-toast-brown transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-toast-gold/10 transition-colors"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-toast-gold/10 bg-toast-warmWhite px-4 py-4 space-y-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive(to)
                    ? 'bg-toast-gold/15 text-toast-brown'
                    : 'text-toast-charcoal/60 hover:bg-toast-gold/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <div className="border-t border-toast-gold/10 pt-3">
              {user ? (
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-sm font-semibold text-toast-charcoal/50 hover:text-burntRed rounded-xl"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => { setAuthOpen(true); setMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 w-full bg-toast-gold text-white text-sm font-bold rounded-xl"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet context={{ openAuth: () => setAuthOpen(true) }} />
      </main>

      {/* Footer */}
      <footer className="bg-toast-charcoal text-toast-cream/60 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍞</span>
              <span className="font-heading text-lg font-bold text-toast-cream">
                Toaster<span className="text-toast-gold">AI</span>
              </span>
            </div>
            <div className="flex gap-8 text-sm">
              <Link to="/scan" className="hover:text-toast-gold transition-colors">Scanner</Link>
              <Link to="/pricing" className="hover:text-toast-gold transition-colors">Pricing</Link>
              <Link to="/dashboard" className="hover:text-toast-gold transition-colors">Dashboard</Link>
            </div>
            <p className="text-xs text-toast-cream/30">&copy; {new Date().getFullYear()} ToasterAI. Don't get burnt.</p>
          </div>
          <DisclaimerBanner className="mt-8" />
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
