import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import {
  Bike,
  Phone,
  Mail,
  CheckCircle,
  ShieldCheck,
  RefreshCw,
  Loader2,
  DollarSign,
  PackageCheck,
  TrendingUp,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  totalPrice: number | string;
}

interface Order {
  id: string;
  status: string;
  subtotal: number | string;
  deliveryFee: number | string;
  totalAmount: number | string;
  deliveryAddressText: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  deliveryPartnerId?: string;
  rating?: number;
  feedback?: string;
  items: OrderItem[];
}

interface DeliveryDriverStats {
  driverId: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  isAvailable: boolean;
  totalEarnings: number;
  completedOrdersCount: number;
  cashCollected: number;
  deliveredOrders: Order[];
}

export const DeliveryPartnersPage: React.FC = () => {
  const [drivers, setDrivers] = useState<DeliveryDriverStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);

  const fetchDriverData = async () => {
    try {
      setLoading(true);

      // Fetch all system orders
      let allOrders: Order[] = [];
      try {
        const res = await apiClient.get('/orders');
        allOrders = res.data.data || [];
      } catch (e) {
        console.log('Failed to fetch orders, calculating with mock/local state:', e);
      }

      // Filter delivered orders
      const completedOrders = allOrders.filter((o) => o.status === 'DELIVERED');

      // Calculate Driver Stats
      const driverMap: Record<string, DeliveryDriverStats> = {
        'driver-1': {
          driverId: 'driver-1',
          name: 'Ramesh Kumar (Express Rider)',
          email: 'driver@example.com',
          phone: '+91 98765 43212',
          vehicleType: 'Motorcycle / Scooter',
          isAvailable: true,
          totalEarnings: 0,
          completedOrdersCount: 0,
          cashCollected: 0,
          deliveredOrders: [],
        },
        'driver-2': {
          driverId: 'driver-2',
          name: 'Suresh Kumar (Fast Express)',
          email: 'driver2@example.com',
          phone: '+91 98765 88888',
          vehicleType: 'Scooter / EV Bike',
          isAvailable: true,
          totalEarnings: 0,
          completedOrdersCount: 0,
          cashCollected: 0,
          deliveredOrders: [],
        },
      };

      // Populate driver statistics from actual delivered orders
      allOrders.forEach((order) => {
        const fee = typeof order.deliveryFee === 'string' ? parseFloat(order.deliveryFee) : order.deliveryFee || 50;
        const total = typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : order.totalAmount || 0;

        const driverIdKey = order.deliveryPartnerId === 'driver-2' ? 'driver-2' : 'driver-1';
        const targetDriver = driverMap[driverIdKey] || driverMap['driver-1']!;

        if (order.status === 'DELIVERED') {
          targetDriver.completedOrdersCount += 1;
          targetDriver.totalEarnings += fee;
          targetDriver.cashCollected += total;
          targetDriver.deliveredOrders.push(order);
        }
      });

      setDrivers(Object.values(driverMap));
    } catch (err) {
      console.log('Error loading delivery driver page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const totalFleetEarnings = drivers.reduce((sum, d) => sum + d.totalEarnings, 0);
  const totalFleetDeliveries = drivers.reduce((sum, d) => sum + d.completedOrdersCount, 0);
  const totalCashCollected = drivers.reduce((sum, d) => sum + d.cashCollected, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bike className="w-7 h-7 text-amber-500" />
            Delivery Drivers & Money Earned
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track delivery partner earnings (@ ₹20/km per trip), completed orders, and driver fleet performance.
          </p>
        </div>

        <button
          onClick={fetchDriverData}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition border border-slate-700 shadow-lg"
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          Refresh Driver Earnings
        </button>
      </div>

      {/* Fleet Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Rider Earnings</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">₹{totalFleetEarnings}</p>
          <span className="text-xs text-slate-400 font-medium">Calculated @ ₹20 / km per trip</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Delivered Orders</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">{totalFleetDeliveries}</p>
          <span className="text-xs text-slate-400 font-medium">Completed food deliveries</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Cash Collected (COD)</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">₹{totalCashCollected}</p>
          <span className="text-xs text-slate-400 font-medium">Collected cash at customer door</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Fleet Duty Status</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Bike className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-400">
            {drivers.filter((d) => d.isAvailable).length} Online
          </p>
          <span className="text-xs text-slate-400 font-medium">Active delivery partners</span>
        </div>
      </div>

      {/* Driver Fleet Cards List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Calculating driver earnings & delivery history...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {drivers.map((driver) => {
            const isExpanded = expandedDriverId === driver.driverId;

            return (
              <div
                key={driver.driverId}
                className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden"
              >
                {/* Driver Top Info Bar */}
                <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-black text-2xl shrink-0">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-white text-lg">{driver.name}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            driver.isAvailable
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {driver.isAvailable ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-500" /> {driver.email}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-amber-400">
                          <Phone className="w-3.5 h-3.5 text-amber-500" /> {driver.phone}
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Bike className="w-3.5 h-3.5 text-slate-500" /> {driver.vehicleType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Driver Money & Performance Snapshot */}
                  <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                        Driver Rating
                      </span>
                      <span className="text-xl font-black text-amber-400 flex items-center justify-end gap-1">
                        ⭐{' '}
                        {driver.deliveredOrders.filter((o) => o.rating).length > 0
                          ? (
                              driver.deliveredOrders
                                .filter((o) => o.rating)
                                .reduce((sum, o) => sum + (o.rating || 0), 0) /
                              driver.deliveredOrders.filter((o) => o.rating).length
                            ).toFixed(1)
                          : '5.0'}
                      </span>
                    </div>

                    <div className="h-10 w-px bg-slate-800" />

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                        Money Earned
                      </span>
                      <span className="text-2xl font-black text-white">₹{driver.totalEarnings}</span>
                    </div>

                    <div className="h-10 w-px bg-slate-800" />

                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                        Deliveries
                      </span>
                      <span className="text-2xl font-black text-white">{driver.completedOrdersCount}</span>
                    </div>

                    <div className="h-10 w-px bg-slate-800" />

                    <button
                      onClick={() => setExpandedDriverId(isExpanded ? null : driver.driverId)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition border border-slate-700 flex items-center gap-1.5"
                    >
                      {isExpanded ? 'Hide History' : 'View History'}
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Delivered Orders History List */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/60 p-6 space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <PackageCheck className="w-4 h-4" /> Delivered Orders History ({driver.deliveredOrders.length})
                    </h4>

                    {driver.deliveredOrders.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">
                        No orders delivered yet. Money earned will automatically update when rider completes deliveries!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {driver.deliveredOrders.map((order) => (
                          <div
                            key={order.id}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-400 text-sm">
                                  Order #{order.id.slice(-6).toUpperCase()}
                                </span>
                                <span className="text-xs text-slate-500">
                                  • {new Date(order.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 font-semibold mt-1">
                                Customer: {order.customer.name}
                              </p>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" /> {order.deliveryAddressText}
                              </p>
                              {order.rating ? (
                                <div className="mt-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
                                  <span className="font-bold text-amber-400">
                                    {'⭐'.repeat(order.rating)} ({order.rating}/5 Stars)
                                  </span>
                                  {order.feedback ? (
                                    <p className="text-slate-400 italic text-[11px] mt-0.5">
                                      "{order.feedback}"
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-4 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                              <div className="text-right">
                                <span className="text-xs text-slate-400 block">Total Order</span>
                                <span className="text-sm font-bold text-white">₹{order.totalAmount}</span>
                              </div>

                              <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-right">
                                <span className="text-xs text-emerald-400 font-black block">
                                  +₹{order.deliveryFee || 50} Earned
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
