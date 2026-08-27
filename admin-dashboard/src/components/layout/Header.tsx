import React from 'react';
import { useAuthStore } from '../../store/auth.store';
import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 shadow-md">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Qureshi Mandi Admin Portal
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Order Bell Alert */}
        <button
          onClick={() => navigate('/orders')}
          className="relative p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition"
          title="Live Orders"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
        </button>

        <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
          <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-md">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-bold text-white leading-tight">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-slate-400">{user?.email || 'admin@qureshimandi.com'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 text-slate-400 transition"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </header>
  );
};
