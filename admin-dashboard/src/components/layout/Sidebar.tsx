import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Orders', path: '/orders', icon: '🧾' },
  { label: 'Menu & Food', path: '/products', icon: '🍔' },
  { label: 'Categories', path: '/categories', icon: '📁' },
  { label: 'Delivery Riders', path: '/delivery-partners', icon: '🛵' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col flex-shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <span className="text-2xl mr-3">🍽️</span>
        <div>
          <h1 className="font-extrabold text-base tracking-wide text-white leading-tight">PQM Kitchen</h1>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500">Admin Console</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <span className="text-lg mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800/80 rounded-xl p-3 text-xs text-gray-400">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>System Online</span>
          </div>
          <p className="text-[11px] text-gray-400">Single Restaurant Architecture</p>
        </div>
      </div>
    </aside>
  );
};
