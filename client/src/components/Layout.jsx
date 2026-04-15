import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Flame, BarChart3, CreditCard, LogIn, LogOut, Menu, X, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';
import DisclaimerBanner from './DisclaimerBanner';

export default function Layout() {
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const location = useLocation();

  const navLinks = [
    { to: '/scan', label: 'Scanner', icon: Flame },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/pricing', label: 'Pricing', icon: CreditCard },
  ];

  const isActive = (path) => location.pathname === path;

  const footerSections = [
    {
      title: 'Products',
      links: [
        { label: 'Single Scanner', to: '/scan' },
        { label: 'Gallery Scanner', to: '/scan' },
        { label: 'URL Scanner', to: '/scan' },
        { label: 'Premium Crispy', to: '/pricing' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'How It Works', to: '/' },
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Pricing', to: '/pricing' },
        { label: 'Blog', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Press', href: '#' },
        { label: 'Privacy', href: '#' },
      ],
    },
    {
      title: 'Help',
      links: [
        { label: 'FAQ', href: '#' },
        { label: 'Getting Started', href: '#' },
        { label: 'Trust & Safety', href: '#' },
        { label: 'Report a Bug', href: '#' },
      ],
    },
    {
      title: 'Contact',
      links: [
        { label: 'hello@toasterai.org', href: 'mailto:hello@toasterai.org' },
        { label: 'Support', href: '#' },
        { label: 'Partnerships', href: '#' },
        { label: 'Twitter / X', href: '#' },
      ],
    },
  ];

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
      <footer className="bg-toast-charcoal text-toast-cream/60 pt-14 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Top: brand + sections */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
            {/* Brand (spans 1 column) */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🍞</span>
                <span className="font-heading text-lg font-bold text-toast-cream">
                  Toaster<span className="text-toast-gold">AI</span>
                </span>
              </Link>
              <p className="text-xs text-toast-cream/40 leading-relaxed">
                Don't get burnt by a bot. AI image detection for the dating world.
              </p>
            </div>

            {/* Sections */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 className="font-heading text-sm font-bold text-toast-cream mb-3 uppercase tracking-wider">
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {link.to ? (
                        <Link to={link.to} className="text-xs text-toast-cream/50 hover:text-toast-gold transition-colors">
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className="text-xs text-toast-cream/50 hover:text-toast-gold transition-colors">
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-toast-cream/10 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-xs text-toast-cream/30">
              &copy; {new Date().getFullYear()} ToasterAI. All rights reserved.
            </p>

            {/* Language selector */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-toast-cream/40" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-toast-charcoal border border-toast-cream/20 text-toast-cream/70 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-toast-gold cursor-pointer"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="pt">Português</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
              </select>
            </div>
          </div>

          <DisclaimerBanner className="mt-6" />
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
