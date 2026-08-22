import React from 'react';
import { useAuthStore } from '../../store/auth.store';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/20">
        <h1 className="text-2xl font-extrabold tracking-tight">Welcome back, {user?.name}!</h1>
        <p className="mt-1 text-brand-100 text-sm">
          Stage 2 Authentication is verified and operational. Role-based access control is actively protecting admin APIs and routes.
        </p>
      </div>

      {/* Metrics Grid preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Today's Orders</span>
            <span className="text-xl">🧾</span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-gray-900">0</p>
          <span className="text-xs text-emerald-600 font-semibold">Ready for Stage 5</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Menu Items</span>
            <span className="text-xl">🍔</span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-gray-900">0</p>
          <span className="text-xs text-brand-600 font-semibold">Ready for Stage 3</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Riders</span>
            <span className="text-xl">🛵</span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-gray-900">1</p>
          <span className="text-xs text-blue-600 font-semibold">1 Rider in seed</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Auth Status</span>
            <span className="text-xl">🔒</span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-emerald-600">Active</p>
          <span className="text-xs text-gray-500 font-medium">JWT + Role Guard</span>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-3">System Architecture & Next Stage</h2>
        <div className="prose prose-sm text-gray-600 max-w-none space-y-2 text-sm leading-relaxed">
          <p>
            Your single-restaurant delivery architecture has authenticated user roles established:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>ADMIN</strong>: Access to this dashboard to manage menus, orders, riders, and reports.</li>
            <li><strong>DELIVERY_PARTNER</strong>: Mobile app for accepting order deliveries and live status updates.</li>
            <li><strong>CUSTOMER</strong>: Customer mobile app to browse food, customize cart, and track orders.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
