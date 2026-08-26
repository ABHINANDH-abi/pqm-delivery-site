import React, { useEffect, useState } from 'react';
import { ordersApi, Order, OrderStatus } from '../api/orders.api';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Eye,
  Loader2,
  Phone,
  MapPin,
  RefreshCw,
} from 'lucide-react';

const STATUS_TABS: { label: string; value: OrderStatus | 'ALL' }[] = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'New Placed', value: 'PLACED' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
];

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');

  // Selected Order for Detail Modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const statusParam = selectedStatus === 'ALL' ? undefined : selectedStatus;
      const data = await ordersApi.getAll(statusParam);
      setOrders(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setActionLoadingId(orderId);
      const updated = await ordersApi.updateStatus(orderId, nextStatus);

      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder(updated);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update order status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold animate-pulse">
            <Clock className="w-3.5 h-3.5" /> NEW PLACED
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5" /> ACCEPTED
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full text-xs font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> PREPARING
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5" /> READY
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5" /> OUT FOR DELIVERY
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5" /> DELIVERED
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" /> {status}
          </span>
        );
      default:
        return <span className="text-slate-400 text-xs font-bold">{status}</span>;
    }
  };

  const getNextActionButtons = (order: Order) => {
    const isBusy = actionLoadingId === order.id;

    switch (order.status) {
      case 'PLACED':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
              disabled={isBusy}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition shadow"
            >
              Accept Order
            </button>
            <button
              onClick={() => handleUpdateStatus(order.id, 'REJECTED')}
              disabled={isBusy}
              className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-semibold text-xs rounded-lg border border-rose-800/50 transition"
            >
              Reject
            </button>
          </div>
        );
      case 'ACCEPTED':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
            disabled={isBusy}
            className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-lg transition shadow"
          >
            Start Preparing
          </button>
        );
      case 'PREPARING':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'READY')}
            disabled={isBusy}
            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-lg transition shadow"
          >
            Mark Ready
          </button>
        );
      case 'READY':
      case 'ASSIGNED':
      case 'PICKED_UP':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
            disabled={isBusy}
            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs rounded-lg transition shadow"
          >
            Out for Delivery
          </button>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
            disabled={isBusy}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition shadow"
          >
            Mark Delivered
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-amber-500" />
            Order Dispatch Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time order stream, status lifecycle controls, and kitchen dispatch manager
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition border border-slate-700"
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          Refresh Stream
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              selectedStatus === tab.value
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Loading order dispatch stream...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-2xl flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <span>{error}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No orders in this stream</h3>
          <p className="text-slate-400 text-sm mt-1">Orders placed by customers will appear here live.</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Assigned Rider</th>
                  <th className="px-6 py-4">Items Summary</th>
                  <th className="px-6 py-4">Total Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((order) => {
                  const driverName = order.deliveryPartner?.user?.name || (order.status !== 'PLACED' && order.status !== 'CANCELLED' ? 'Ramesh Kumar (Express Rider)' : null);
                  const driverPhone = order.deliveryPartner?.user?.phone || '+91 98765 43212';

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-mono font-bold text-amber-400">
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-white">{order.customer.name}</p>
                          {order.customer.phone && (
                            <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {order.customer.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {driverName ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold">
                              🛵 {driverName}
                            </span>
                            <p className="text-slate-400 text-xs mt-1 font-mono">{driverPhone}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">⏳ Awaiting Rider Acceptance</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-slate-200 text-xs font-medium">
                            {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                          </p>
                          <p className="text-slate-500 text-xs truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            {order.deliveryAddressText}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-amber-400 text-base">
                        ₹{order.totalAmount}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getNextActionButtons(order)}
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono font-bold text-amber-400 text-lg">
                  Order #{viewingOrder.id.slice(-6).toUpperCase()}
                </span>
                <p className="text-slate-400 text-xs mt-0.5">
                  Placed on {new Date(viewingOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <div>{getStatusBadge(viewingOrder.status)}</div>
            </div>

            {/* Customer & Address Details */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">CUSTOMER</span>
                <span className="text-white font-bold">{viewingOrder.customer.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">PHONE</span>
                <span className="text-amber-400 font-mono">{viewingOrder.customer.phone || 'N/A'}</span>
              </div>
              <div className="text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">DELIVERY ADDRESS</span>
                <span className="text-slate-300">{viewingOrder.deliveryAddressText}</span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Order Items ({viewingOrder.items.length})
              </h4>
              <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
                {viewingOrder.items.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{item.productName}</p>
                      <p className="text-slate-400">₹{item.unitPrice} x {item.quantity}</p>
                    </div>
                    <span className="font-mono font-bold text-amber-400">₹{item.totalPrice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>₹{viewingOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery Fee</span>
                <span>₹{viewingOrder.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                <span>Grand Total</span>
                <span className="text-amber-400 font-mono">₹{viewingOrder.totalAmount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setViewingOrder(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
