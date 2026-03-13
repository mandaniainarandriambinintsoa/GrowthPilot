import { useState, createContext, useContext, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Zap, History, CalendarDays, BarChart3,
  Settings, LogOut, User, Layout, Link2, Rocket,
  PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MAIN_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/generate', label: 'Generate', icon: Zap },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
];

const CONTENT_NAV = [
  { to: '/history', label: 'History', icon: History },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const TOOLS_NAV = [
  { to: '/landing', label: 'Landing Pages', icon: Layout },
  { to: '/social', label: 'Social Connect', icon: Link2 },
];

const SidebarContext = createContext({ collapsed: false });
export const useSidebar = () => useContext(SidebarContext);

function NavSection({ label, items, collapsed, pathname }: {
  label: string;
  items: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  collapsed: boolean;
  pathname: string;
}) {
  return (
    <div className="mb-2">
      {!collapsed && (
        <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          {label}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map(({ to, label: itemLabel, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? itemLabel : undefined}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all no-underline
                ${active
                  ? 'bg-primary/15 text-primary-light shadow-sm shadow-primary/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-primary-light' : ''}`} />
              {!collapsed && <span>{itemLabel}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 68 : 220;

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="min-h-screen bg-surface flex">
        {/* Sidebar */}
        <aside
          style={{ width: sidebarWidth }}
          className="fixed top-0 left-0 h-screen bg-surface-light/50 backdrop-blur-xl border-r border-white/5 flex flex-col z-50 transition-all duration-300"
        >
          {/* Logo */}
          <div className={`flex items-center h-14 px-4 border-b border-white/5 ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="text-base font-bold text-white tracking-tight">
                Growth<span className="text-primary-light">Pilot</span>
              </span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
            <NavSection label="Main" items={MAIN_NAV} collapsed={collapsed} pathname={pathname} />
            <NavSection label="Content" items={CONTENT_NAV} collapsed={collapsed} pathname={pathname} />
            <NavSection label="Tools" items={TOOLS_NAV} collapsed={collapsed} pathname={pathname} />
          </nav>

          {/* Bottom */}
          <div className="px-2.5 pb-3 space-y-1 border-t border-white/5 pt-3">
            {/* Settings */}
            <Link
              to="/settings"
              title={collapsed ? 'Settings' : undefined}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all no-underline
                ${pathname === '/settings'
                  ? 'bg-primary/15 text-primary-light'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Settings className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>Settings</span>}
            </Link>

            {/* User */}
            {user && (
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {user.name || user.email.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                )}
                <button
                  onClick={logout}
                  title="Sign out"
                  className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-white
                hover:bg-white/5 transition-all cursor-pointer w-full
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              {!collapsed && <span className="text-xs">Collapse</span>}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main
          style={{ marginLeft: sidebarWidth }}
          className="flex-1 min-h-screen pb-12 px-6 lg:px-10 pt-8 transition-all duration-300"
        >
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
