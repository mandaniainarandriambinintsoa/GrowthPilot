import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Rocket, LayoutDashboard, Zap, History, CalendarDays, BarChart3, Settings, LogOut, User, Layout, Link2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/generate', label: 'Generate', icon: Zap },
  { to: '/history', label: 'History', icon: History },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/landing', label: 'Landing', icon: Layout },
  { to: '/social', label: 'Social', icon: Link2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Growth<span className="text-primary-light">Pilot</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all no-underline ${
                    active
                      ? 'bg-primary/10 text-primary-light'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            {/* User menu */}
            {user && (
              <div className="relative ml-3" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-light border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="hidden sm:inline text-sm text-slate-300 max-w-[120px] truncate">
                    {user.name || user.email.split('@')[0]}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface-light border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
