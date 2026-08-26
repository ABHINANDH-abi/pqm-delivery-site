import React, { useState } from 'react';
import { Settings, Store, Clock, Phone, MapPin, Save, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: 'PQM Kitchen & Gourmet Pizza',
    phone: '+91 98765 43210',
    email: 'contact@pqmkitchen.com',
    address: '12, MG Road, Indiranagar, Bengaluru, Karnataka 560001',
    openingHours: '10:00 AM - 11:30 PM',
    taxRatePercent: 5,
    flatDeliveryFee: 40,
    isAcceptingOrders: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-amber-500" />
            Restaurant Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure restaurant identity, operating hours, delivery fees, and order acceptance
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl animate-in fade-in">
            <Check className="w-4 h-4" /> Settings Saved Successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Store Details */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Store className="w-5 h-5 text-amber-500" /> General Store Info
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Store Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>
        </div>

        {/* Operating & Delivery Settings */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-5 h-5 text-amber-500" /> Operational & Tax Parameters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Opening Hours
              </label>
              <input
                type="text"
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Flat Delivery Fee (₹)
              </label>
              <input
                type="number"
                value={formData.flatDeliveryFee}
                onChange={(e) => setFormData({ ...formData, flatDeliveryFee: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                GST Tax Rate (%)
              </label>
              <input
                type="number"
                value={formData.taxRatePercent}
                onChange={(e) => setFormData({ ...formData, taxRatePercent: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Bank Account & UPI Payment Destination Settings */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="text-amber-500 text-xl">💳</span> Bank Account & UPI Payment Destination
          </h3>
          <p className="text-xs text-slate-400">
            Configure the UPI ID and Bank Account where 100% of customer online payments will be transferred directly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-amber-400 mb-1">
                Merchant UPI ID / VPA (Google Pay / PhonePe VPA)
              </label>
              <input
                type="text"
                defaultValue="qureshimandi@upi"
                placeholder="e.g. 9876543210@okbizaxis or shopname@icici"
                className="w-full bg-slate-950 border border-amber-500/50 text-amber-400 font-mono font-bold rounded-xl px-4 py-2.5 focus:outline-none text-sm"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Direct UPI address receiving customer funds (0% MDR fee).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Payee / Restaurant Account Name
              </label>
              <input
                type="text"
                defaultValue="Qureshi Mandi Coimbatore"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                defaultValue="923010045892147"
                placeholder="e.g. 918020034921"
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Bank IFSC Code
              </label>
              <input
                type="text"
                defaultValue="UTIB0001892"
                placeholder="e.g. HDFC0001234"
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Save className="w-4 h-4" /> Save Restaurant Settings
          </button>
        </div>
      </form>
    </div>
  );
};
