import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { ordersApi, Order } from '../../api/orders.api';
import { Star, MessageSquare, ShoppingBag, Truck, DollarSign, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await ordersApi.getAll();
        setOrders(data);
      } catch (err) {
        console.log('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const ratedOrders = orders.filter((o) => o.rating && o.rating > 0);
  const totalRevenue = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (typeof o.totalAmount === 'string' ? parseFloat(o.totalAmount) : o.totalAmount), 0);

  const avgRating = ratedOrders.length
    ? (ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-slate-950 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Welcome back, {user?.name || 'Admin'}! 👋</h1>
          <p className="mt-1 text-slate-950 font-semibold text-sm">
            Qureshi Mandi Real-time Operational Hub & Customer Feedback Center
          </p>
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="px-5 py-2.5 bg-slate-950 text-amber-400 font-extrabold text-xs rounded-xl shadow-lg hover:bg-slate-900 transition shrink-0"
        >
          View Live Orders Stream →
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">{orders.length}</p>
          <span className="text-xs text-slate-400 font-semibold">Active & past orders</span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivered Revenue</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-400">₹{totalRevenue}</p>
          <span className="text-xs text-emerald-400/80 font-semibold">Completed sales</span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Rating</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-amber-400">⭐ {avgRating}</p>
          <span className="text-xs text-slate-400 font-semibold">{ratedOrders.length} Reviews received</span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Riders</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">2</p>
          <span className="text-xs text-blue-400 font-semibold">Ramesh & Suresh Online</span>
        </div>
      </div>

      {/* Customer Ratings & Feedback Feed */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" /> Customer Ratings & Reviews Feed
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live feedback and star ratings submitted by customers after order delivery
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold rounded-xl">
            {ratedOrders.length} Reviews
          </span>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm py-4">Loading customer reviews...</p>
        ) : ratedOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            <Star className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            No customer ratings submitted yet. Delivered orders will collect reviews automatically.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ratedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-amber-500/40 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-xs">
                      Order #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {'⭐'.repeat(order.rating || 5)} ({order.rating}/5 Stars)
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white mt-2">
                    Customer: {order.customer?.name || 'Customer'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Delivery Partner: <span className="text-emerald-400 font-semibold">{order.deliveryPartner?.user?.name || 'Rider'}</span>
                  </p>

                  {order.feedback ? (
                    <div className="mt-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                      <p className="text-xs text-slate-200 italic">
                        "{order.feedback}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic mt-2">No written review comment</p>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-900 pt-2 mt-1">
                  <span>Total Bill: ₹{order.totalAmount}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
