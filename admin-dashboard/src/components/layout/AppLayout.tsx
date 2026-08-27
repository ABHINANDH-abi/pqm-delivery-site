import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { OrderNotificationListener } from './OrderNotificationListener';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-100">
      <OrderNotificationListener />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
